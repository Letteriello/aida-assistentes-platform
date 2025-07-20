/**
 * AIDA Assistentes - Dashboard Layout
 * Layout principal com sidebar e header para área autenticada
 * PATTERN: Responsive layout with navigation sidebar
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { useBusiness } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User, 
  Crown,
  Menu,
  ChevronLeft,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Visao geral e metricas'
  },
  {
    name: 'Assistentes',
    href: '/assistants',
    icon: Bot,
    description: 'Gerenciar assistentes de IA'
  },
  {
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: MessageCircle,
    description: 'Conectividade WhatsApp'
  },
  {
    name: 'Conversas',
    href: '/conversations',
    icon: MessageSquare,
    description: 'Historico de conversas'
  },
  {
    name: 'Configuracoes',
    href: '/settings',
    icon: Settings,
    description: 'Configuracoes da conta'
  }
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading } = useAuthStore();
  
  // Always call hooks at the top level
  let business = null;
  try {
    business = useBusiness();
  } catch (error) {
    // Auth context not available - handle gracefully
    business = null;
  }
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      logout();
      toast.success('Logout realizado com sucesso!');
      router.push('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-6 border-b border-sidebar-border",
        sidebarCollapsed && !mobile && "px-3 justify-center"
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Crown className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {(!sidebarCollapsed || mobile) && (
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-sidebar-foreground">AIDA Assistentes</h1>
            <p className="text-xs text-sidebar-foreground/60">
              {business?.name || 'Carregando...'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                sidebarCollapsed && !mobile && "justify-center px-2"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
              )} />
              {(!sidebarCollapsed || mobile) && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn(
        "border-t border-sidebar-border p-3",
        sidebarCollapsed && !mobile && "px-2"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 h-auto p-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                sidebarCollapsed && !mobile && "justify-center px-2"
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt={user?.name || ''} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {(!sidebarCollapsed || mobile) && (
                <div className="flex flex-col items-start text-left min-w-0">
                  <span className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.name || 'Usuario'}
                  </span>
                  <span className="text-xs text-sidebar-foreground/60 truncate">
                    {user?.email || 'email@exemplo.com'}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
        
        {/* Collapse button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar p-0 shadow-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-6 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Crown className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">AIDA Assistentes</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}