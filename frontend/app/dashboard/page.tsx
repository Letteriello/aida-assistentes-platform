'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/origin/card';
import { Button } from '@/components/ui/origin/button';
import { 
  MessageSquare, 
  Smartphone, 
  Bot, 
  BarChart3, 
  Settings,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        router.push('/onboarding');
      }
    };

    verifyAuth();
  }, [checkAuth, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo ao AIDA Dashboard
          </h1>
          <p className="text-gray-600">
            Ola, {user?.name || 'Usuario'}! Gerencie seus assistentes de IA e instancias WhatsApp.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">WhatsApp Business</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Conecte e gerencie suas instancias WhatsApp Business para comecar a atender clientes.
              </p>
              <Button 
                onClick={() => router.push('/dashboard/whatsapp')}
                className="w-full"
                variant="outline"
              >
                Gerenciar Instancias
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Assistentes IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Configure e personalize seus assistentes de IA para diferentes tipos de atendimento.
              </p>
              <Button className="w-full" variant="outline" disabled>
                Em Breve
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Acompanhe metricas de desempenho, satisfacao e estatisticas de uso.
              </p>
              <Button className="w-full" variant="outline" disabled>
                Em Breve
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Conecte seu WhatsApp Business</h4>
                  <p className="text-gray-600 text-sm">
                    Crie uma instancia WhatsApp e conecte usando o QR Code. Isso permitira que voce receba e envie mensagens.
                  </p>
                  <Button 
                    onClick={() => router.push('/dashboard/whatsapp')}
                    className="mt-2" 
                    size="sm"
                  >
                    Conectar Agora
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Configure seu Assistente IA</h4>
                  <p className="text-gray-600 text-sm">
                    Personalize a personalidade, respostas e conhecimento do seu assistente de IA.
                  </p>
                  <Button className="mt-2" size="sm" disabled>
                    Em Breve
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-60">
                <div className="w-6 h-6 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Comece a Atender Clientes</h4>
                  <p className="text-gray-600 text-sm">
                    Seu assistente estara pronto para responder mensagens automaticamente no WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Logado como: {user?.phone}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              // Implement logout
              window.location.href = '/onboarding';
            }}
            className="mt-2"
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}