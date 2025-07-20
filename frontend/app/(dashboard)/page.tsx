/**
 * AIDA Assistentes - Dashboard Page with Origin UI Design
 * Dashboard principal com novo design tecnológico e Bento Box layout
 */

import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedCard, AnimatedMetricCard } from '@/components/ui/animated-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { StaggerChildren, StaggerItem } from '@/components/ui/page-transition';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Bot,
  Activity,
  Zap,
  Brain,
  Database,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Settings,
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: "AIDA Assistentes - Dashboard",
  description: "Plataforma de assistentes inteligentes com WhatsApp"
};

export default function DashboardPage() {
  // Mock data para demonstração
  const metrics = [
    {
      title: 'Total Assistentes',
      value: '24',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Bot,
      description: '4 ativos, 2 em treinamento'
    },
    {
      title: 'Conversas Hoje',
      value: '1,247',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: MessageSquare,
      description: 'Pico: 156/hora as 14h'
    },
    {
      title: 'Tempo de Resposta',
      value: '0.8s',
      change: '-15.3%',
      changeType: 'positive' as const,
      icon: Zap,
      description: 'Meta: <1s atingida'
    },
    {
      title: 'Taxa de Satisfação',
      value: '98.5%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: '4.9/5 avaliação média'
    },
    {
      title: 'Carga do Sistema',
      value: '45%',
      change: '+5.2%',
      changeType: 'neutral' as const,
      icon: BarChart3,
      description: 'Faixa operacional normal'
    },
    {
      title: 'Dados Processados',
      value: '12.4GB',
      change: '+23.1%',
      changeType: 'positive' as const,
      icon: Database,
      description: 'Embeddings atualizados'
    }
  ];

  const assistants = [
    {
      name: 'Suporte ao Cliente',
      status: 'active' as const,
      conversations: 247,
      accuracy: 96,
      lastActive: '2 min atrás'
    },
    {
      name: 'Assistente de Vendas',
      status: 'training' as const,
      conversations: 89,
      accuracy: 78,
      lastActive: '1 hora atrás'
    },
    {
      name: 'Suporte Tecnico',
      status: 'active' as const,
      conversations: 156,
      accuracy: 94,
      lastActive: 'Agora'
    },
    {
      name: 'Guia de Produtos',
      status: 'idle' as const,
      conversations: 45,
      accuracy: 92,
      lastActive: '30 min atrás'
    }
  ];

  const MetricCard = ({ title, value, change, changeType, icon: Icon, description }) => {
    const ChangeIcon = changeType === 'positive' ? ArrowUpRight : changeType === 'negative' ? ArrowDownRight : Clock;
    const changeColor = changeType === 'positive' ? 'text-accent-lime-500' : changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground';

    return (
      <Card className="bento-card hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className={cn("flex items-center gap-1 text-xs", changeColor)}>
            <ChangeIcon className="h-3 w-3" />
            <span>{change}</span>
            <span className="text-muted-foreground">no último mês</span>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const AssistantCard = ({ name, status, conversations, accuracy, lastActive }) => {
    const statusConfig = {
      active: { label: 'Ativo', color: 'bg-accent-cyan-500', textColor: 'text-accent-cyan-500', icon: Activity },
      training: { label: 'Treinando', color: 'bg-accent-orange-500', textColor: 'text-accent-orange-500', icon: Brain },
      idle: { label: 'Inativo', color: 'bg-secondary-400', textColor: 'text-secondary-400', icon: Clock },
      error: { label: 'Erro', color: 'bg-destructive', textColor: 'text-destructive', icon: AlertCircle }
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
      <Card className="bento-card hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{name}</CardTitle>
            <Badge className={`${config.color}/10 ${config.textColor} border-${config.color}/30`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{conversations}</div>
              <div className="text-xs text-muted-foreground">Conversas</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">Precisão</div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Performance</span>
              <span>{accuracy}%</span>
            </div>
            <Progress value={accuracy} className="h-2" />
          </div>
          
          <div className="text-xs text-muted-foreground">
            Última atividade: {lastActive}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tech-gradient">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo! Aqui está o que está acontecendo com seus assistentes de IA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatedButton variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Ver Relatório
          </AnimatedButton>
          <AnimatedButton className="tech-glow">
            <Plus className="h-4 w-4 mr-2" />
            Novo Assistente
          </AnimatedButton>
        </div>
      </div>

      {/* Métricas Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Visao Geral do Sistema</h2>
        <StaggerChildren className="bento-grid bento-grid-lg" staggerDelay={0.1}>
          {metrics.map((metric, index) => (
            <StaggerItem key={metric.title}>
              <AnimatedMetricCard
                value={metric.value}
                change={metric.change}
                changeType={metric.changeType}
                delay={index * 0.1}
                hoverEffect={true}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                  )}
                </CardContent>
              </AnimatedMetricCard>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Assistentes Ativos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Assistentes Ativos</h2>
          <AnimatedButton variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar
          </AnimatedButton>
        </div>
        <StaggerChildren className="bento-grid bento-grid-md" staggerDelay={0.15}>
          {assistants.map((assistant, index) => (
            <StaggerItem key={assistant.name}>
              <AnimatedCard hoverEffect={true} delay={index * 0.15}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{assistant.name}</CardTitle>
                    <Badge className={`${
                      assistant.status === 'active' ? 'bg-accent-cyan-500/10 text-accent-cyan-500 border-accent-cyan-500/30' :
                      assistant.status === 'training' ? 'bg-accent-orange-500/10 text-accent-orange-500 border-accent-orange-500/30' :
                      'bg-secondary-400/10 text-secondary-400 border-secondary-400/30'
                    }`}>
                      {assistant.status === 'active' && <Activity className="h-3 w-3 mr-1" />}
                      {assistant.status === 'training' && <Brain className="h-3 w-3 mr-1" />}
                      {assistant.status === 'idle' && <Clock className="h-3 w-3 mr-1" />}
                      {assistant.status === 'active' ? 'Ativo' : assistant.status === 'training' ? 'Treinando' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{assistant.conversations}</div>
                      <div className="text-xs text-muted-foreground">Conversas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{assistant.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Precisão</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Performance</span>
                      <span>{assistant.accuracy}%</span>
                    </div>
                    <Progress value={assistant.accuracy} className="h-2" />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Última atividade: {assistant.lastActive}
                  </div>
                </CardContent>
              </AnimatedCard>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Atividade Recente */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Atividade Recente</h2>
        <Tabs defaultValue="activity" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Atividade</TabsTrigger>
            <TabsTrigger value="conversations">Conversas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activity" className="space-y-4">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Feed de Atividade do Sistema
                </CardTitle>
                <CardDescription>
                  Atualizacoes em tempo real dos seus assistentes de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'Nova conversa iniciada', assistant: 'Suporte ao Cliente', time: '2 min atrás', type: 'info' },
                    { action: 'Treinamento concluido com sucesso', assistant: 'Assistente de Vendas', time: '15 min atrás', type: 'success' },
                    { action: 'Alto tempo de resposta detectado', assistant: 'Suporte Tecnico', time: '1 hora atrás', type: 'warning' },
                    { action: 'Assistente implantado em produção', assistant: 'Guia de Produtos', time: '2 horas atrás', type: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        activity.type === 'success' && "bg-accent-lime-500",
                        activity.type === 'warning' && "bg-accent-orange-500",
                        activity.type === 'info' && "bg-accent-cyan-500"
                      )} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.assistant}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="conversations">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle>Conversas Recentes</CardTitle>
                <CardDescription>Ultimas interacoes com usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Conversas aparecerão aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card className="bento-card">
              <CardHeader>
                <CardTitle>Analytics Detalhados</CardTitle>
                <CardDescription>Insights e metricas avancadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics detalhados em breve</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}