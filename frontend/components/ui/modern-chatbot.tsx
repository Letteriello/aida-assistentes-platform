"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Paperclip, MoreVertical, Bot, User } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { ScrollArea } from './scroll-area'
import { Avatar, AvatarFallback} from './avatar'
import { Badge } from './badge'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface ModernChatbotProps {
  messages?: Message[]
  onSendMessage?: (message: string) => void
  isTyping?: boolean
  className?: string
}

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 p-4"
    >
      <Avatar className="h-8 w-8 border-2 border-golden-400/30">
        <AvatarFallback className="bg-gradient-to-br from-golden-400 to-golden-600 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-golden-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]}}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2}}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground animate-text-glow">
        IA está digitando...
      </span>
    </motion.div>
  )
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end space-x-2 mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 border-2 border-golden-400/30 animate-prosperity-pulse">
          <AvatarFallback className="bg-gradient-to-br from-golden-400 to-golden-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`
            relative px-4 py-3 rounded-2xl shadow-lg
            ${isUser 
              ? 'bg-gradient-to-br from-golden-500 to-golden-600 text-white ml-auto' 
              : 'bg-gradient-to-br from-tech-slate-800 to-tech-zinc-800 text-white border border-golden-400/20'
            }
            ${!isUser ? 'animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-tech-slate-800 via-golden-500/10 to-tech-slate-800' : ''}
          `}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          
          {/* Timestamp */}
          <div className={`flex items-center justify-between mt-2 text-xs opacity-70`}>
            <span>
              {message.timestamp.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            
            {isUser && message.status && (
              <Badge 
                variant="secondary" 
                className="text-xs bg-white/20 text-white border-none"
              >
                {message.status === 'sending' && '⏳'}
                {message.status === 'sent' && '✓'}
                {message.status === 'delivered' && '✓✓'}
                {message.status === 'read' && '✓✓'}
              </Badge>
            )}
          </div>
          
          {/* Glow effect for AI messages */}
          {!isUser && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-golden-400/10 to-transparent opacity-50 pointer-events-none" />
          )}
        </motion.div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 border-2 border-golden-400/30">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  )
}

const QuickActions = ({ onQuickAction }: { onQuickAction: (action: string) => void }) => {
  const actions = [
    { label: "Como posso ajudar?", value: "help" },
    { label: "Criar assistente", value: "create" },
    { label: "Ver relatórios", value: "reports" },
    { label: "Configurações", value: "settings" },
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2 p-4 border-t border-golden-400/20"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.value}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onQuickAction(action.value)}
          className="
            px-3 py-2 text-xs rounded-full
            bg-gradient-to-r from-golden-500/20 to-golden-600/20
            border border-golden-400/30
            text-golden-300 hover:text-golden-100
            transition-all duration-200
            hover:shadow-lg hover:shadow-golden-500/25
            animate-fade-in-slide
          "
        >
          {action.label}
        </motion.button>
      ))}
    </motion.div>
  )
}

export const ModernChatbot: React.FC<ModernChatbotProps> = ({
  messages = [],
  onSendMessage,
  isTyping = false,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])
  
  const handleSendMessage = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const handleQuickAction = (action: string) => {
    if (onSendMessage) {
      onSendMessage(`Ação rápida: ${action}`)
    }
  }
  
  return (
    <div className={`
      flex flex-col h-full max-h-[600px] 
      bg-gradient-to-br from-tech-slate-900 to-tech-zinc-900
      border border-golden-400/20 rounded-2xl overflow-hidden
      shadow-2xl shadow-golden-500/10
      ${className}
    `}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          flex items-center justify-between p-4 
          bg-gradient-to-r from-golden-500/10 to-golden-600/10
          border-b border-golden-400/20
        "
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-golden-400/50 animate-prosperity-pulse">
              <AvatarFallback className="bg-gradient-to-br from-golden-400 to-golden-600 text-white">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-tech-slate-900" />
          </div>
          <div>
            <h3 className="font-semibold text-golden-300 animate-text-glow">Assistente IA</h3>
            <p className="text-xs text-muted-foreground">Online • Respondendo rapidamente</p>
          </div>
        </div>
        
        <Button variant="ghost" size="sm" className="text-golden-400 hover:text-golden-300">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </motion.div>
      
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
        
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center p-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-golden-400 to-golden-600 rounded-full flex items-center justify-center mb-4 animate-float">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-golden-300 mb-2 animate-text-glow">
              Olá! Como posso ajudar?
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Sou seu assistente de IA especializado em automação de WhatsApp. 
              Posso ajudar você a criar e gerenciar seus assistentes virtuais.
            </p>
          </motion.div>
        )}
      </ScrollArea>
      
      {/* Quick Actions */}
      {messages.length === 0 && (
        <QuickActions onQuickAction={handleQuickAction} />
      )}
      
      {/* Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          p-4 border-t border-golden-400/20
          bg-gradient-to-r from-golden-500/5 to-golden-600/5
        "
      >
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-golden-400 hover:text-golden-300 mb-1"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="
                pr-12 resize-none border-golden-400/30 
                bg-tech-slate-800/50 text-white placeholder:text-gray-400
                focus:border-golden-400/50 focus:ring-golden-400/25
                transition-all duration-200
              "
            />
            
            <Button
              variant="ghost"
              size="sm"
              className={`
                absolute right-1 top-1/2 -translate-y-1/2
                ${isRecording ? 'text-red-400 animate-pulse' : 'text-golden-400 hover:text-golden-300'}
              `}
              onClick={() => setIsRecording(!isRecording)}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="
              bg-gradient-to-r from-golden-500 to-golden-600 
              hover:from-golden-600 hover:to-golden-700
              text-white border-none shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              hover:shadow-golden-500/25
              animate-prosperity-pulse
            "
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default ModernChatbot