'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/stores';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  BarChart3, 
  Bot, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Brain,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    badge: string | null;
  }

  interface QuickAction {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const navigationItems: NavigationItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: BarChart3,
      description: 'Visão geral e métricas',
      badge: null
    },
    { 
      name: 'Assistentes', 
      href: '/assistants', 
      icon: Bot,
      description: 'Gerencie seus assistentes IA',
      badge: '3'
    },
    { 
      name: 'Conversas', 
      href: '/conversations', 
      icon: MessageSquare,
      description: 'Monitore todas as conversas',
      badge: '12'
    },
    { 
      name: 'Base de Conhecimento', 
      href: '/knowledge', 
      icon: Brain,
      description: 'Documentos e treinamento',
      badge: null
    },
    { 
      name: 'Análises', 
      href: '/analytics', 
      icon: TrendingUp,
      description: 'Relatórios e insights',
      badge: null
    },
    { 
      name: 'Cobrança', 
      href: '/billing', 
      icon: CreditCard,
      description: 'Planos e faturas',
      badge: null
    },
    { 
      name: 'Configurações', 
      href: '/settings', 
      icon: Settings,
      description: 'Preferências da conta',
      badge: null
    },
  ];

  const quickActions: QuickAction[] = [
    { name: 'Novo Assistente', href: '/assistants/new', icon: Bot },
    { name: 'Ver Conversas', href: '/conversations', icon: MessageSquare },
    { name: 'Adicionar Documentos', href: '/knowledge', icon: FileText },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-64px)] border-r border-aida-gold-200 bg-white/95 backdrop-blur-md",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-aida-gold-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-aida-gold-600" />
              <span className="font-semibold text-aida-neutral-800">Menu</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hover:bg-aida-gold-50"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Business Status */}
        {!isCollapsed && (
          <div className="p-4 border-b border-aida-gold-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-aida-neutral-800">
                  {user?.name || 'Minha Empresa'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-aida-neutral-600">Plano Essencial</span>
                  <Badge variant="outline" className="text-xs border-aida-gold-200 text-aida-gold-700">
                    <Zap className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-aida-neutral-600">Mensagens</span>
                    <span className="text-aida-neutral-800 font-medium">782/1000</span>
                  </div>
                  <div className="w-full bg-aida-gold-100 rounded-full h-1">
                    <div 
                      className="bg-aida-gold-500 h-1 rounded-full transition-all duration-300" 
                      style={{ width: '78.2%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto p-3 transition-all duration-200",
                      active 
                        ? "bg-aida-gold-100 text-aida-gold-800 hover:bg-aida-gold-200" 
                        : "text-aida-neutral-700 hover:text-aida-gold-800 hover:bg-aida-gold-50",
                      isCollapsed ? "px-2" : "px-3"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.name}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-aida-gold-100 text-aida-gold-800"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-aida-neutral-500 mt-1">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 border-t border-aida-gold-200">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-aida-gold-600" />
                <span className="text-sm font-medium text-aida-neutral-800">Ações Rápidas</span>
              </div>
              
              <div className="space-y-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.name} href={action.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-aida-neutral-600 hover:text-aida-gold-800 hover:bg-aida-gold-50"
                      >
                        <Icon className="w-3 h-3 mr-2" />
                        {action.name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {!isCollapsed && (
          <div className="p-4 border-t border-aida-gold-200">
            <div className="bg-gradient-to-br from-aida-gold-50 to-aida-gold-100 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="w-4 h-4 text-aida-gold-600" />
                <span className="text-sm font-medium text-aida-gold-800">Upgrade</span>
              </div>
              <p className="text-xs text-aida-gold-700 mb-3">
                Desbloqueie recursos avançados com o plano Premium
              </p>
              <Button
                size="sm"
                className="w-full bg-aida-gold-600 hover:bg-aida-gold-700 text-white"
                asChild
              >
                <Link href="/billing">
                  Fazer Upgrade
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}