/**
 * AIDA Platform - Origin UI Dashboard Layout
 * Bento Box grid layout with technology-themed sidebar
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Home,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  User,
  Bell,
  Search,
  Plus,
  Activity,
  Zap,
  Brain,
  Database,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Cpu,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface HeaderProps {
  onMenuToggle: () => void;
}

interface AssistantCardProps {
  name: string;
  status: 'active' | 'training' | 'idle' | 'error';
  conversations: number;
  accuracy: number;
  lastActive: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [activeItem, setActiveItem] = React.useState('dashboard');

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      description: 'Visão geral do sistema'
    },
    {
      id: 'assistants',
      label: 'Assistants',
      icon: Bot,
      href: '/dashboard/assistants',
      badge: '24',
      description: 'Gerenciar assistentes AI'
    },
    {
      id: 'conversations',
      label: 'Conversations',
      icon: MessageSquare,
      href: '/dashboard/conversations',
      badge: '1.2k',
      description: 'Histórico de conversas'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      description: 'Métricas e relatórios'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      description: 'Configurações'
    }
  ];

  const assistants = [
    { name: 'Customer Support', status: 'active' as const, conversations: 247 },
    { name: 'Sales Assistant', status: 'training' as const, conversations: 89 },
    { name: 'Technical Help', status: 'idle' as const, conversations: 156 },
    { name: 'Product Guide', status: 'error' as const, conversations: 0 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-accent-cyan-500 bg-accent-cyan-500/10';
      case 'training': return 'text-accent-orange-500 bg-accent-orange-500/10';
      case 'idle': return 'text-secondary-400 bg-secondary-400/10';
      case 'error': return 'text-destructive bg-destructive/10';
      default: return 'text-secondary-400 bg-secondary-400/10';
    }
  };

  return (
    <div className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sidebar-foreground">AIDA Platform</h2>
              <p className="text-xs text-sidebar-foreground/60">AI Assistant Manager</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <Button className="w-full justify-start tech-glow" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Assistant
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <div key={item.id}>
              <button
                onClick={() => setActiveItem(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
              {!isCollapsed && item.description && (
                <p className="text-xs text-sidebar-foreground/60 ml-11 mt-1">
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
      </nav>

      {/* Assistants Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <h3 className="text-sm font-medium text-sidebar-foreground mb-3">
            Active Assistants
          </h3>
          <div className="space-y-2">
            {assistants.slice(0, 3).map((assistant, index) => (
              <div
                key={assistant.name}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <div className={cn("h-2 w-2 rounded-full", getStatusColor(assistant.status))} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {assistant.name}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60">
                    {assistant.conversations} conversations
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="md:hidden h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's what's happening with your AI assistants.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <Button variant="ghost" size="sm" className="hidden md:flex h-8 w-8 p-0">
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent-orange-500 rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 p-0"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.png" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, changeType, icon: Icon, description }) => {
  const changeColor = {
    positive: 'text-accent-lime-500',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  }[changeType];

  return (
    <Card className="bento-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs">
          <span className={changeColor}>{change}</span>
          <span className="text-muted-foreground">from last month</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const AssistantCard: React.FC<AssistantCardProps> = ({ name, status, conversations, accuracy, lastActive }) => {
  const statusConfig = {
    active: { label: 'Active', color: 'ai-status-active', icon: Activity },
    training: { label: 'Training', color: 'ai-status-warning', icon: Brain },
    idle: { label: 'Idle', color: 'ai-status-neutral', icon: Clock },
    error: { label: 'Error', color: 'ai-status-error', icon: AlertCircle }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="bento-card hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge className={config.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{conversations}</div>
            <div className="text-xs text-muted-foreground">Conversations</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Performance</span>
            <span>{accuracy}%</span>
          </div>
          <Progress value={accuracy} className="h-2" />
        </div>
        
        <div className="text-xs text-muted-foreground">
          Last active: {lastActive}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardLayoutOrigin: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Mock data for demonstration
  const metrics = [
    {
      title: 'Total Assistants',
      value: '24',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Bot,
      description: '4 active, 2 training'
    },
    {
      title: 'Conversations Today',
      value: '1,247',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: MessageSquare,
      description: 'Peak: 156/hour at 2pm'
    },
    {
      title: 'Avg Response Time',
      value: '0.8s',
      change: '-15.3%',
      changeType: 'positive' as const,
      icon: Zap,
      description: 'Target: <1s achieved'
    },
    {
      title: 'Satisfaction Rate',
      value: '98.5%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: '4.9/5 average rating'
    },
    {
      title: 'System Load',
      value: '45%',
      change: '+5.2%',
      changeType: 'neutral' as const,
      icon: Cpu,
      description: 'Normal operational range'
    },
    {
      title: 'Data Processed',
      value: '12.4GB',
      change: '+23.1%',
      changeType: 'positive' as const,
      icon: Database,
      description: 'Vector embeddings updated'
    }
  ];

  const assistants = [
    {
      name: 'Customer Support AI',
      status: 'active' as const,
      conversations: 247,
      accuracy: 96,
      lastActive: '2 minutes ago'
    },
    {
      name: 'Sales Assistant',
      status: 'training' as const,
      conversations: 89,
      accuracy: 78,
      lastActive: '1 hour ago'
    },
    {
      name: 'Technical Support',
      status: 'active' as const,
      conversations: 156,
      accuracy: 94,
      lastActive: 'Just now'
    },
    {
      name: 'Product Guide',
      status: 'idle' as const,
      conversations: 45,
      accuracy: 92,
      lastActive: '30 minutes ago'
    }
  ];

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full">
            <Sidebar isCollapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 overflow-auto p-6">
          {/* Bento Grid Layout */}
          <div className="space-y-6">
            {/* Metrics Grid */}
            <section>
              <h2 className="text-xl font-semibold mb-4">System Overview</h2>
              <div className="bento-grid bento-grid-lg">
                {metrics.map((metric, index) => (
                  <div
                    key={metric.title}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <MetricCard {...metric} />
                  </div>
                ))}
              </div>
            </section>

            {/* Assistants Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Active Assistants</h2>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assistant
                </Button>
              </div>
              <div className="bento-grid bento-grid-md">
                {assistants.map((assistant, index) => (
                  <div
                    key={assistant.name}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <AssistantCard {...assistant} />
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <Card className="bento-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    System Activity Feed
                  </CardTitle>
                  <CardDescription>
                    Real-time updates from your AI assistants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: 'New conversation started', assistant: 'Customer Support AI', time: '2 min ago', type: 'info' },
                      { action: 'Training completed successfully', assistant: 'Sales Assistant', time: '15 min ago', type: 'success' },
                      { action: 'High response time detected', assistant: 'Technical Support', time: '1 hour ago', type: 'warning' },
                      { action: 'Assistant deployed to production', assistant: 'Product Guide', time: '2 hours ago', type: 'success' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          activity.type === 'success' && "bg-accent-lime-500",
                          activity.type === 'warning' && "bg-accent-orange-500",
                          activity.type === 'info' && "bg-accent-cyan-500"
                        )} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.assistant}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Custom Children Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayoutOrigin;