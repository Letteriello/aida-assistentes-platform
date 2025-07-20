/**
 * AIDA Assistentes - Settings Page
 * Página de configurações da conta e preferências
 * PATTERN: Settings page with form sections
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores';
import { useBusiness } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Key,
  Crown,
  Save,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const business = useBusiness();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferencias de notificacao atualizadas!');
    } catch (error) {
      toast.error('Erro ao atualizar notificacoes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferencias e configuracoes da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificacoes
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguranca
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informacoes Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informacoes pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input 
                    id="name" 
                    defaultValue={user?.name || ''} 
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue={user?.email || ''} 
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alteracoes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informacoes da Empresa
              </CardTitle>
              <CardDescription>
                Gerencie as informacoes da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input 
                    id="company-name" 
                    defaultValue={business?.name || ''} 
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Setor</Label>
                  <Input 
                    id="industry" 
                    defaultValue={business?.industry || ''} 
                    placeholder="Setor de atuacao"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Plano Atual</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Professional
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Renovacao em 30 dias
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferencias de Notificacao
              </CardTitle>
              <CardDescription>
                Configure como voce deseja receber notificacoes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificacoes por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba atualizacoes importantes por email
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked: boolean) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificacoes Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificacoes no navegador
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked: boolean) => 
                      setNotifications(prev => ({ ...prev, push: checked }))
                    }
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificacoes SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas criticos por SMS
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.sms}
                    onCheckedChange={(checked: boolean) => 
                      setNotifications(prev => ({ ...prev, sms: checked }))
                    }
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Preferencias'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguranca da Conta
              </CardTitle>
              <CardDescription>
                Gerencie a seguranca e acesso da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Senha Atual</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    placeholder="Digite sua senha atual"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    placeholder="Digite sua nova senha"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    placeholder="Confirme sua nova senha"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <Label>Chave API</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    value="********************************"
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" size="sm">
                    Regenerar
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Regenerar a chave API invalidara a chave atual</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Atualizar Senha'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}