'use client';

import { useAuthStore } from '@/lib/stores';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Server, 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Shield,
  Plus,
  Download,
  Calendar,
  Clock,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';

export function BillingDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-aida-gold-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Crown className="w-8 h-8 text-aida-gold-600" />
            <div>
              <h1 className="text-3xl font-bold text-aida-neutral-800">
                Conta & Cobrança
              </h1>
              <p className="text-aida-neutral-600">
                Gerencie sua assinatura e faturas
              </p>
            </div>
          </div>
          <Sparkles className="w-8 h-8 text-aida-gold-600" />
        </div>

        {/* Current Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-aida-gold-100 to-aida-gold-50 border-aida-gold-200">
            <CardHeader>
              <CardTitle className="text-aida-gold-800">Plano Atual</CardTitle>
              <CardDescription className="text-aida-gold-700">
                Plano Flexível Ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-aida-gold-800">R$ 99,00/mês</div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-aida-gold-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    1.000 mensagens incluídas
                  </div>
                  <div className="flex items-center text-sm text-aida-gold-700">
                    <FileText className="w-4 h-4 mr-2" />
                    10 documentos na base
                  </div>
                  <div className="flex items-center text-sm text-aida-gold-700">
                    <Server className="w-4 h-4 mr-2" />
                    1 instância WhatsApp
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uso Atual</CardTitle>
              <CardDescription>
                Consumo do período atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Mensagens</span>
                  <span className="font-semibold">782 / 1.000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Documentos</span>
                  <span className="font-semibold">9 / 10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Instâncias</span>
                  <span className="font-semibold">1 / 1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próxima Fatura</CardTitle>
              <CardDescription>
                Vencimento em 15 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl font-bold text-aida-neutral-800">R$ 99,00</div>
                <div className="text-sm text-aida-neutral-600">
                  Será cobrado em 30/01/2024
                </div>
                <Button className="w-full bg-aida-gold-500 hover:bg-aida-gold-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pagar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add-ons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Comprar Mensagens</CardTitle>
              <CardDescription>
                Adicione mais mensagens ao seu plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                +1.000 mensagens - R$ 25,00
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expandir Base de Conhecimento</CardTitle>
              <CardDescription>
                Adicione mais documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                +10 documentos - R$ 39,90/mês
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            <CardDescription>
              Suas últimas faturas e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: '01/01/2024', amount: 'R$ 99,00', status: 'Pago' },
                { date: '01/12/2023', amount: 'R$ 99,00', status: 'Pago' },
                { date: '01/11/2023', amount: 'R$ 99,00', status: 'Pago' },
              ].map((invoice, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="w-5 h-5 text-aida-neutral-500" />
                    <div>
                      <div className="font-medium">{invoice.date}</div>
                      <div className="text-sm text-aida-neutral-600">{invoice.amount}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{invoice.status}</span>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}