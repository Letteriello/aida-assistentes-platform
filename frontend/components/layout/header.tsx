'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AidaButton } from '@/components/aida';
import { useAuthStore } from '@/lib/stores';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Crown, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  MessageSquare, 
  Bot, 
  BarChart3, 
  CreditCard,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    logout();
    router.push('/');
  };

  interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }

  const navigationItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: BarChart3,
      description: 'Visão geral e métricas'
    },
    { 
      name: 'Assistentes', 
      href: '/assistants', 
      icon: Bot,
      description: 'Gerencie seus assistentes IA'
    },
    { 
      name: 'Conversas', 
      href: '/conversations', 
      icon: MessageSquare,
      description: 'Monitore todas as conversas'
    },
    { 
      name: 'Cobrança', 
      href: '/billing', 
      icon: CreditCard,
      description: 'Planos e faturas'
    },
  ];

  if (!isAuthenticated) {
    return (
      <header className={`sticky top-0 z-50 w-full border-b border-aida-gold-200 bg-white/80 backdrop-blur-md ${className}`}>
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Crown className="w-8 h-8 text-aida-gold-600" />
              <span className="text-xl font-bold aida-text-gold">AIDA Platform</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/register">
                <AidaButton size="sm" className="bg-gradient-to-r from-aida-gold-600 to-aida-gold-700 hover:from-aida-gold-700 hover:to-aida-gold-800">
                  <Crown className="w-4 h-4 mr-2" />
                  Começar
                </AidaButton>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-aida-gold-200 bg-white/95 backdrop-blur-md shadow-sm ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Crown className="w-8 h-8 text-aida-gold-600" />
            <span className="text-xl font-bold aida-text-gold">AIDA Platform</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-aida-neutral-700 hover:text-aida-gold-800 hover:bg-aida-gold-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-aida-neutral-600 hover:text-aida-gold-800 hover:bg-aida-gold-50"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-aida-neutral-600 hover:text-aida-gold-800 hover:bg-aida-gold-50"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-aida-gold-500 rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.name || 'User'} />
                    <AvatarFallback className="bg-aida-gold-100 text-aida-gold-800">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'Email do usuário'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/billing')} className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Cobrança</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-aida-gold-200 bg-white py-4"
          >
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-aida-neutral-700 hover:text-aida-gold-800 hover:bg-aida-gold-50 rounded-md transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-aida-neutral-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </div>

      {/* Business Status Bar */}
      <div className="border-t border-aida-gold-200 bg-aida-gold-50/50 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-aida-neutral-600">WhatsApp conectado</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-aida-gold-600" />
                <span className="text-aida-neutral-600">Plano Essencial</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs border-aida-gold-200 text-aida-gold-700">
                782/1000 mensagens
              </Badge>
              <Badge variant="outline" className="text-xs border-aida-gold-200 text-aida-gold-700">
                9/10 documentos
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}