'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, 
  Home, 
  Bot, 
  MessageSquare, 
  Settings, 
  Brain, 
  CreditCard, 
  Crown, 
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface NavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// Navigation items configuration
const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    description: "Visão geral da plataforma"
  },
  {
    title: "Assistentes",
    href: "/assistants",
    icon: Bot,
    description: "Gerencie seus assistentes IA"
  },
  {
    title: "Cérebro do Agente",
    href: "/brain",
    icon: Brain,
    description: "Base de conhecimento e treinamento"
  },
  {
    title: "Conversas",
    href: "/conversations",
    icon: MessageSquare,
    description: "Histórico e monitoramento"
  },
  {
    title: "Conta & Cobrança",
    href: "/billing",
    icon: CreditCard,
    description: "Assinatura e pagamentos"
  },
  {
    title: "Configurações",
    href: "/settings",
    icon: Settings,
    description: "Configurações da conta"
  }
];

function NavigationItem({ item, isActive }: { item: NavigationItem, isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group hover-lift",
        isActive 
          ? "glass-card premium-gradient text-white shadow-lg border border-primary/20" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:backdrop-blur-sm"
      )}
    >
      <item.icon className={cn(
        "h-5 w-5 transition-all duration-300",
        isActive ? "text-white animate-glow" : "text-muted-foreground group-hover:text-foreground pulse-icon"
      )} />
      <span className="flex-1 font-medium">{item.title}</span>
      {isActive && (
        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg" />
      )}
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      {/* Sidebar - Navegação lateral sempre visível */}
      <div className="hidden border-r border-border/50 glass-card md:block">
        <div className="flex h-full max-h-screen flex-col">
          {/* Header da Sidebar */}
          <div className="flex h-16 items-center border-b border-border/50 px-6 glass-header">
            <Link href="/" className="flex items-center gap-3 font-semibold hover-lift">
              <div className="relative w-10 h-10 premium-gradient rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-white animate-glow" />
                <div className="absolute inset-0 premium-gradient rounded-xl opacity-50 blur-sm -z-10"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">AIDA</span>
                <span className="text-xs text-muted-foreground font-medium -mt-1">Platform Premium</span>
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 premium-button relative">
                <Bell className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="sr-only">Notificações</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
          {/* Navigation Menu */}
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-3">
              {navigationItems.map((item, index) => (
                <div 
                  key={item.href} 
                  className="stagger-fade-in" 
                  style={{animationDelay: `${index * 100}ms`}}
                >
                  <NavigationItem
                    item={item}
                    isActive={pathname === item.href}
                  />
                </div>
              ))}
            </nav>

            <Separator className="my-6 opacity-50" />

            {/* Status Section */}
            <div className="space-y-4">
              <div className="px-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Status do Sistema
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg" />
                    <span className="text-muted-foreground font-medium">WhatsApp conectado</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg" />
                    <span className="text-muted-foreground font-medium">IA funcionando</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg" />
                    <span className="text-muted-foreground font-medium">Sync em tempo real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom Section - Plano e Upgrade */}
          <div className="mt-auto p-4">
            <Card className="glass-card premium-gradient border border-primary/20 hover-lift">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4 text-white animate-glow" />
                    Plano Premium
                  </CardTitle>
                  <Badge className="pill-badge bg-white/20 text-white border-white/30">
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80 font-medium">Mensagens</span>
                    <span className="font-bold text-white">782/1000</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="progress-gradient h-2 rounded-full transition-all duration-500" style={{width: '78%'}} />
                  </div>
                  <Button size="sm" className="w-full text-sm premium-button bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Crown className="w-4 h-4 mr-2" />
                    Expandir Plano
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col">
        {/* Top Bar - Mobile responsivo */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 glass-header px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" className="premium-button">
              <Bot className="h-5 w-5 pulse-icon" />
            </Button>
            <span className="font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">AIDA Platform</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden premium-button relative">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 stagger-fade-in">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
