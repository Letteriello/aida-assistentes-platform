'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Bot,
  Zap,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';

interface DashboardStats {
  activeConversations: number;
  totalMessages: number;
  responseTime: number;
  satisfaction: number;
  messagesUsed: number;
  messageLimit: number;
  documentsUsed: number;
  documentLimit: number;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export function PremiumDashboard() {
  // This would come from your API
  const stats: DashboardStats = {
    activeConversations: 12,
    totalMessages: 1453,
    responseTime: 1.2,
    satisfaction: 4.8,
    messagesUsed: 742,
    messageLimit: 1000,
    documentsUsed: 7,
    documentLimit: 10,
    connectionStatus: 'connected'
  };

  const usagePercentage = (stats.messagesUsed / stats.messageLimit) * 100;
  const documentPercentage = (stats.documentsUsed / stats.documentLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header Premium */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard AIDA
            </h1>
            <p className="text-gray-600">
              Gerencie seus assistentes de IA com elegância
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <StatusIndicator 
              status={stats.connectionStatus}
              label={`WhatsApp ${stats.connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}`}
            />
            <Button variant="aida" size="lg" className="shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Novo Assistente
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="premium" className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversas Ativas
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-aida-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-aida-primary">
                {stats.activeConversations}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% desde ontem
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="premium" className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Mensagens
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-aida-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-aida-success">
                {stats.totalMessages.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +23% este mês
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="premium" className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tempo de Resposta
              </CardTitle>
              <Zap className="h-4 w-4 text-aida-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-aida-warning">
                {stats.responseTime}s
              </div>
              <p className="text-xs text-muted-foreground">
                -15% mais rápido
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="premium" className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfação
              </CardTitle>
              <Users className="h-4 w-4 text-aida-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-aida-secondary">
                {stats.satisfaction}/5.0
              </div>
              <p className="text-xs text-muted-foreground">
                +0.3 pontos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Usage Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-aida-primary" />
                Uso de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{stats.messagesUsed} usadas</span>
                  <span>{stats.messageLimit} limite</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercentage}%` }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className={`h-3 rounded-full ${
                      usagePercentage > 90 ? 'bg-red-500' :
                      usagePercentage > 70 ? 'bg-yellow-500' : 'bg-aida-success'
                    }`}
                  />
                </div>
                
                <p className="text-xs text-gray-600">
                  {Math.round(100 - usagePercentage)}% restantes neste ciclo
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-aida-secondary" />
                Documentos IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>{stats.documentsUsed} carregados</span>
                  <span>{stats.documentLimit} máximo</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${documentPercentage}%` }}
                    transition={{ delay: 0.9, duration: 1 }}
                    className={`h-3 rounded-full ${
                      documentPercentage > 90 ? 'bg-red-500' :
                      documentPercentage > 70 ? 'bg-yellow-500' : 'bg-aida-secondary'
                    }`}
                  />
                </div>
                
                <p className="text-xs text-gray-600">
                  {stats.documentLimit - stats.documentsUsed} slots disponíveis
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card variant="gradient" className="text-white">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/90 mb-4">
                Veja insights detalhados sobre o desempenho dos seus assistentes
              </p>
              <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-aida-primary">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card variant="connected">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800">
                <Bot className="w-5 h-5 mr-2" />
                Assistente IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-4">
                Configure a personalidade e conhecimento do seu assistente
              </p>
              <Button variant="aidaOutline" className="w-full">
                Configurar IA
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-aida-primary" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Personalize horários, webhooks e integrações
              </p>
              <Button variant="aida" className="w-full">
                Abrir Configurações
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}