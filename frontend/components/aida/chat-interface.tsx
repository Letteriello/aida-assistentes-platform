'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AidaCard } from './aida-card';
import { AidaButton } from './aida-button';
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/design-system';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'error';
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  assistantName?: string;
  className?: string;
  showActions?: boolean;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onCopy?: (content: string) => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = 'Digite sua mensagem...',
  assistantName = 'Assistente',
  className,
  showActions = true,
  onLike,
  onDislike,
  onCopy
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      await onSendMessage(messageContent);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      onCopy?.(content);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  return (
    <AidaCard
      title="Playground do Assistente"
      description="Teste e converse com seu assistente em tempo real"
      className={cn('flex flex-col h-[600px]', className)}
    >
      <div className="flex flex-col h-full">
        {/* Messages area */}
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhuma conversa ainda. Envie uma mensagem para começar!
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'assistant' && (
                    <Avatar className="w-8 h-8 bg-amber-100">
                      <AvatarFallback className="text-amber-700">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    'flex flex-col space-y-1 max-w-[80%]',
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      'rounded-lg px-4 py-2 text-sm',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatTime(message.timestamp)}</span>
                      
                      {message.status === 'sending' && (
                        <span className="text-yellow-600">Enviando...</span>
                      )}
                      {message.status === 'error' && (
                        <span className="text-red-600">Erro</span>
                      )}
                      
                      {/* Message actions for assistant messages */}
                      {showActions && message.sender === 'assistant' && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleCopy(message.content)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Copiar mensagem"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          
                          {onLike && (
                            <button
                              onClick={() => onLike(message.id)}
                              className="p-1 hover:bg-green-100 rounded"
                              title="Útil"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                          )}
                          
                          {onDislike && (
                            <button
                              onClick={() => onDislike(message.id)}
                              className="p-1 hover:bg-red-100 rounded"
                              title="Não útil"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 bg-blue-100">
                      <AvatarFallback className="text-blue-700">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8 bg-amber-100">
                  <AvatarFallback className="text-amber-700">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isSending || isLoading}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            
            <AidaButton
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending || isLoading}
              loading={isSending}
              icon={<Send className="w-4 h-4" />}
              className="self-end"
            >
              Enviar
            </AidaButton>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </AidaCard>
  );
}