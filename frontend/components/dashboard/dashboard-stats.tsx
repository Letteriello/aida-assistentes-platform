'use client';

import { useAuth } from '@/components/providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// Mock data - será substituído por dados reais da API
const mockStats = {
  totalConversations: 1247,
  activeAssistants: 5,
  totalCustomers: 892,
  responseRate: 98.5,
  avgResponseTime: 2.3,
  satisfactionScore: 4.7
};

export function DashboardStats() {
  const { business } = useAuth();
  
  // TODO: Implementar query real para buscar estatísticas
  const { data: stats = mockStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', business?.id],
    queryFn: async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockStats;
    },
    enabled: !!business?.id,
  });

  const statCards = [
    {
      title: "Conversas Totais",
      value: formatNumber(stats.totalConversations),
      description: "+12% em relação ao mês passado",
      icon: MessageSquare,
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Assistentes Ativos",
      value: stats.activeAssistants.toString(),
      description: "Assistentes configurados e funcionando",
      icon: Bot,
      trend: "+1",
      trendUp: true
    },
    {
      title: "Clientes Únicos",
      value: formatNumber(stats.totalCustomers),
      description: "+8% novos clientes este mês",
      icon: Users,
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Taxa de Resposta",
      value: `${stats.responseRate}%`,
      description: "Mensagens respondidas automaticamente",
      icon: CheckCircle,
      trend: "+0.5%",
      trendUp: true
    }
  ];

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse w-16 mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-32" />
            </CardContent>
          </Card>
        ))}
      </>
    );
  }

  return (
    <>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className={`inline-flex items-center text-xs ${
                  stat.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    stat.trendUp ? '' : 'rotate-180'
                  }`} />
                  {stat.trend}
                </span>
                <span className="ml-2">{stat.description}</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}