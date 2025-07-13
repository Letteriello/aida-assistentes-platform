import { Suspense } from 'react';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentConversations } from '@/components/dashboard/recent-conversations';
import { AssistantOverview } from '@/components/dashboard/assistant-overview';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Bot, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Visão geral da sua plataforma AIDA
          </p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<LoadingSpinner />}>
          <DashboardStats />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Conversas Recentes</CardTitle>
            <CardDescription>
              Últimas interações com seus assistentes
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <Suspense fallback={<LoadingSpinner />}>
              <RecentConversations />
            </Suspense>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Assistentes Ativos</CardTitle>
            <CardDescription>
              Visão geral dos seus assistentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LoadingSpinner />}>
              <AssistantOverview />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Criar Assistente
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+</div>
            <p className="text-xs text-muted-foreground">
              Configure um novo assistente IA
            </p>
            <Link href="/assistants/new">
              <Button className="w-full mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Criar Agora
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversas
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ver Todas</div>
            <p className="text-xs text-muted-foreground">
              Gerencie todas as conversas
            </p>
            <Link href="/conversations">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Acessar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gerenciar</div>
            <p className="text-xs text-muted-foreground">
              Base de conhecimento dos clientes
            </p>
            <Link href="/customers">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Ver Lista
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Análises
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Relatórios</div>
            <p className="text-xs text-muted-foreground">
              Métricas e performance
            </p>
            <Link href="/analytics">
              <Button variant="outline" className="w-full mt-4" size="sm">
                Ver Dados
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}