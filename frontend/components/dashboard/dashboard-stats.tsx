'use client';

import { useAuthStore } from '@/lib/stores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, Users, TrendingUp, Clock, CheckCircle, Activity, BarChart3, ArrowUpRight, Zap } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Mock data - será substituído por dados reais da API
const mockStats = {
  totalConversations: 1247,
  activeAssistants: 5,
  totalCustomers: 892,
  responseRate: 98.5,
  avgResponseTime: 2.3,
  satisfactionScore: 4.7,
  monthlyGrowth: 15.3
};

export function DashboardStats() {
  const { user } = useAuthStore();
  
  // TODO: Implementar query real para buscar estatísticas
  const { data: stats = mockStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockStats;
    },
    enabled: !!user?.id,
  });

  const statCards = [
    {
      title: "Conversas Totais",
      value: formatNumber(stats.totalConversations),
      change: "+12%",
      changeType: "positive" as const,
      icon: MessageSquare,
      description: "Total de conversas este mês",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10"
    },
    {
      title: "Assistentes Ativos", 
      value: stats.activeAssistants.toString(),
      change: "+1",
      changeType: "positive" as const,
      icon: Bot,
      description: "Assistentes em funcionamento",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10"
    },
    {
      title: "Clientes Únicos",
      value: formatNumber(stats.totalCustomers),
      change: "+8%",
      changeType: "positive" as const,
      icon: Users,
      description: "Clientes atendidos este mês",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    {
      title: "Taxa de Resposta",
      value: `${stats.responseRate}%`,
      change: "+2.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "Eficiência de atendimento",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Performance Overview Skeleton */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-muted/50 rounded w-24 animate-pulse" />
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-6 bg-muted/50 rounded w-16 animate-pulse" />
                <div className="h-3 bg-muted/50 rounded w-20 animate-pulse" />
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Stats Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="h-4 bg-muted/50 rounded w-24" />
                <div className="h-4 w-4 bg-muted/50 rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-8 bg-muted/50 rounded w-16" />
                <div className="h-3 bg-muted/50 rounded w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Additional Metrics Skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="h-4 bg-muted/50 rounded w-24" />
                <div className="h-4 w-4 bg-muted/50 rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-8 bg-muted/50 rounded w-16" />
                <div className="h-3 bg-muted/50 rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 stagger-fade-in">
      {/* Performance Overview */}
      <Card className="glass-card premium-gradient border-border/50 hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 animate-glow rounded-xl" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Activity className="h-6 w-6 text-primary pulse-icon" />
                </div>
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Performance Geral</CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-1">
                  <Zap className="h-3 w-3 text-chart-4" />
                  <span>Crescimento de {stats.monthlyGrowth}% este mês</span>
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  +{stats.monthlyGrowth}%
                </span>
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">vs. mês anterior</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="glass-card hover-lift border-border/50 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-lg transition-all duration-300 group-hover:scale-110", stat.bgColor)}>
                  <Icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "pill-badge text-xs font-medium px-2 py-1 rounded-full",
                    stat.changeType === "positive" 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                      : "bg-red-500/10 text-red-600 border border-red-500/20"
                  )}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card hover-lift border-border/50 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Tempo de Resposta
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 transition-all duration-300 group-hover:scale-110">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold tracking-tight">{stats.avgResponseTime}s</div>
            <div className="progress-gradient h-2 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" />
            </div>
            <CardDescription>Tempo médio de primeira resposta</CardDescription>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift border-border/50 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Satisfação
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10 transition-all duration-300 group-hover:scale-110">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold tracking-tight">{stats.satisfactionScore}/5.0</div>
            <div className="progress-gradient h-2 rounded-full overflow-hidden">
              <div className="h-full w-[94%] bg-gradient-to-r from-green-500 to-green-400 rounded-full" />
            </div>
            <CardDescription>Avaliação média dos clientes</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}