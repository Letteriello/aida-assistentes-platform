'use client';

import { useAuthStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Bell, Settings, User, LogOut, Sparkles, Crown, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useQuickFeedback } from '@/components/ui/feedback-system';

export function DashboardHeader() {
  const { user, logout } = useAuthStore();
  const feedback = useQuickFeedback();

  const currentDate = new Date();
  const greeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <header className="glass-header sticky top-0 z-50 w-full">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Greeting Section */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 animate-glow rounded-lg" />
                <div className="relative flex h-10 w-10 items-center justify-center rounded-lg premium-gradient border border-border/50">
                  <Crown className="h-5 w-5 text-primary animate-float" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  AIDA Platform
                </h1>
                <p className="text-xs text-muted-foreground">Premium Dashboard</p>
              </div>
            </div>
            
            <div className="hidden md:block h-6 w-px bg-border/50" />
            
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
                <span>{greeting()}, {user?.name || 'Usuário'}!</span>
                <Sparkles className="h-4 w-4 text-primary pulse-icon" />
              </h2>
              <p className="text-sm text-muted-foreground flex items-center space-x-2">
                <Zap className="h-3 w-3 text-chart-4" />
                <span>
                  {user?.name ? `${user.name} • ` : ''}
                  {formatDate(currentDate)}
                </span>
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="premium-button relative h-9 w-9 hover:bg-accent/50" 
              onClick={() => feedback.info('Notificações', 'Funcionalidade em desenvolvimento')}
              aria-label="Notificações"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </Button>
            
            <ThemeToggle />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="premium-button h-9 w-9 hover:bg-accent/50" 
              onClick={() => feedback.info('Configurações', 'Funcionalidade em desenvolvimento')}
              aria-label="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="premium-button h-9 w-9 hover:bg-accent/50" 
              onClick={() => feedback.info('Perfil', 'Funcionalidade em desenvolvimento')}
              aria-label="Perfil do usuário"
            >
              <User className="h-4 w-4" />
            </Button>
            
            <div className="hidden sm:block h-6 w-px bg-border/50 mx-2" />
            
            <Button 
              variant="ghost"
              size="icon"
              className="premium-button h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                feedback.prosperity('Até logo!', 'Esperamos vê-lo novamente em breve');
                setTimeout(logout, 1500);
              }}
              aria-label="Sair da plataforma"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}