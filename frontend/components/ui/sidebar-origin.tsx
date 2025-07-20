/**
 * AIDA Platform - Origin UI Sidebar with AI Context Navigation
 * Intelligent sidebar with contextual navigation for AI assistant management
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Home,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
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
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Star,
  Play,
  Pause,
  Square,
  MoreHorizontal,
  Cpu,
  Globe,
  Shield,
  Sparkles,
  Code,
  FileText,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  description?: string;
  children?: NavigationItem[];
  isNew?: boolean;
}

interface AssistantData {
  id: string;
  name: string;
  avatar?: string;
  status: 'active' | 'training' | 'idle' | 'error' | 'paused';
  conversations: number;
  accuracy: number;
  lastActive: string;
  category: 'customer-support' | 'sales' | 'technical' | 'general';
  model: string;
  isOnline: boolean;
}

interface AssistantCardProps {
  assistant: AssistantData;
  isCompact: boolean;
  onClick: () => void;
  isSelected: boolean;
}

interface QuickStatsProps {
  isCollapsed: boolean;
}

const AssistantCard: React.FC<AssistantCardProps> = ({ assistant, isCompact, onClick, isSelected }) => {
  const statusConfig = {
    active: { 
      label: 'Active', 
      color: 'bg-accent-cyan-500', 
      textColor: 'text-accent-cyan-500',
      icon: Activity 
    },
    training: { 
      label: 'Training', 
      color: 'bg-accent-orange-500', 
      textColor: 'text-accent-orange-500',
      icon: Brain 
    },
    idle: { 
      label: 'Idle', 
      color: 'bg-secondary-400', 
      textColor: 'text-secondary-400',
      icon: Clock 
    },
    error: { 
      label: 'Error', 
      color: 'bg-destructive', 
      textColor: 'text-destructive',
      icon: AlertCircle 
    },
    paused: { 
      label: 'Paused', 
      color: 'bg-yellow-500', 
      textColor: 'text-yellow-500',
      icon: Pause 
    }
  };

  const config = statusConfig[assistant.status];
  const StatusIcon = config.icon;

  const categoryIcons = {
    'customer-support': Users,
    'sales': TrendingUp,
    'technical': Code,
    'general': Bot
  };

  const CategoryIcon = categoryIcons[assistant.category];

  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              className={cn(
                "w-full p-2 rounded-lg transition-all duration-200 hover:bg-sidebar-accent group relative",
                isSelected && "bg-sidebar-primary"
              )}
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={assistant.avatar} />
                  <AvatarFallback className="text-xs">
                    {assistant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-background",
                  config.color
                )} />
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="w-64">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-4 w-4" />
                <span className="font-medium">{assistant.name}</span>
                <Badge variant="outline" className="text-xs">
                  {config.label}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {assistant.conversations} conversations • {assistant.accuracy}% accuracy
              </div>
              <div className="text-xs text-muted-foreground">
                Model: {assistant.model}
              </div>
              <div className="text-xs text-muted-foreground">
                Last active: {assistant.lastActive}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent text-left group",
        isSelected && "bg-sidebar-primary text-sidebar-primary-foreground"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={assistant.avatar} />
            <AvatarFallback className="text-xs">
              {assistant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar-background",
            config.color
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{assistant.name}</span>
            <CategoryIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <StatusIcon className={cn("h-3 w-3", config.textColor)} />
            <span>{config.label}</span>
            {assistant.isOnline && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>Online</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="text-xs">
            {assistant.conversations}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {assistant.accuracy}%
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Performance</span>
          <span className={config.textColor}>{assistant.accuracy}%</span>
        </div>
        <Progress value={assistant.accuracy} className="h-1" />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
        <span>{assistant.model}</span>
        <span>{assistant.lastActive}</span>
      </div>
    </button>
  );
};

const QuickStats: React.FC<QuickStatsProps> = ({ isCollapsed }) => {
  const stats = [
    { label: 'Active', value: 4, color: 'text-accent-cyan-500' },
    { label: 'Training', value: 2, color: 'text-accent-orange-500' },
    { label: 'Idle', value: 3, color: 'text-secondary-400' }
  ];

  if (isCollapsed) {
    return (
      <div className="px-2 py-4 space-y-2">
        {stats.map((stat) => (
          <TooltipProvider key={stat.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-8 bg-sidebar-accent rounded-lg flex items-center justify-center">
                  <span className={cn("font-bold text-sm", stat.color)}>{stat.value}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {stat.value} {stat.label} assistants
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 bg-sidebar-accent/50 rounded-lg">
      <h4 className="text-sm font-medium text-sidebar-foreground mb-3">Quick Stats</h4>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className={cn("text-lg font-bold", stat.color)}>{stat.value}</div>
            <div className="text-xs text-sidebar-foreground/60">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SidebarOrigin: React.FC<SidebarProps> = ({ isCollapsed, onToggle, className }) => {
  const [activeItem, setActiveItem] = React.useState('dashboard');
  const [selectedAssistant, setSelectedAssistant] = React.useState<string | null>(null);
  const [assistantsExpanded, setAssistantsExpanded] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      description: 'Overview and metrics'
    },
    {
      id: 'assistants',
      label: 'AI Assistants',
      icon: Bot,
      href: '/dashboard/assistants',
      badge: '9',
      description: 'Manage your AI assistants',
      children: [
        {
          id: 'assistants-overview',
          label: 'Overview',
          icon: BarChart3,
          href: '/dashboard/assistants',
          description: 'All assistants overview'
        },
        {
          id: 'assistants-create',
          label: 'Create New',
          icon: Plus,
          href: '/dashboard/assistants/create',
          description: 'Create new assistant',
          isNew: true
        },
        {
          id: 'assistants-models',
          label: 'AI Models',
          icon: Brain,
          href: '/dashboard/assistants/models',
          description: 'Manage AI models'
        }
      ]
    },
    {
      id: 'conversations',
      label: 'Conversations',
      icon: MessageSquare,
      href: '/dashboard/conversations',
      badge: '1.2k',
      description: 'Chat history and analytics'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/dashboard/analytics',
      description: 'Performance insights',
      children: [
        {
          id: 'analytics-performance',
          label: 'Performance',
          icon: TrendingUp,
          href: '/dashboard/analytics/performance',
          description: 'Response times and accuracy'
        },
        {
          id: 'analytics-usage',
          label: 'Usage',
          icon: Activity,
          href: '/dashboard/analytics/usage',
          description: 'Usage patterns and trends'
        },
        {
          id: 'analytics-satisfaction',
          label: 'Satisfaction',
          icon: Star,
          href: '/dashboard/analytics/satisfaction',
          description: 'User satisfaction metrics'
        }
      ]
    },
    {
      id: 'knowledge',
      label: 'Knowledge Base',
      icon: Database,
      href: '/dashboard/knowledge',
      description: 'Document management',
      children: [
        {
          id: 'knowledge-documents',
          label: 'Documents',
          icon: FileText,
          href: '/dashboard/knowledge/documents',
          description: 'Uploaded documents'
        },
        {
          id: 'knowledge-vectors',
          label: 'Vector Store',
          icon: Cpu,
          href: '/dashboard/knowledge/vectors',
          description: 'Vector embeddings'
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      description: 'Platform configuration',
      children: [
        {
          id: 'settings-general',
          label: 'General',
          icon: Settings,
          href: '/dashboard/settings/general',
          description: 'General settings'
        },
        {
          id: 'settings-security',
          label: 'Security',
          icon: Shield,
          href: '/dashboard/settings/security',
          description: 'Security and privacy'
        },
        {
          id: 'settings-integrations',
          label: 'Integrations',
          icon: Globe,
          href: '/dashboard/settings/integrations',
          description: 'Third-party integrations'
        }
      ]
    }
  ];

  const mockAssistants: AssistantData[] = [
    {
      id: '1',
      name: 'Customer Support AI',
      status: 'active',
      conversations: 247,
      accuracy: 96,
      lastActive: '2 min ago',
      category: 'customer-support',
      model: 'GPT-4 Turbo',
      isOnline: true
    },
    {
      id: '2',
      name: 'Sales Assistant',
      status: 'training',
      conversations: 89,
      accuracy: 78,
      lastActive: '1 hour ago',
      category: 'sales',
      model: 'Claude 3',
      isOnline: false
    },
    {
      id: '3',
      name: 'Technical Support',
      status: 'active',
      conversations: 156,
      accuracy: 94,
      lastActive: 'Just now',
      category: 'technical',
      model: 'GPT-4 Turbo',
      isOnline: true
    },
    {
      id: '4',
      name: 'Product Guide',
      status: 'idle',
      conversations: 45,
      accuracy: 92,
      lastActive: '30 min ago',
      category: 'general',
      model: 'Gemini Pro',
      isOnline: false
    },
    {
      id: '5',
      name: 'HR Assistant',
      status: 'paused',
      conversations: 23,
      accuracy: 88,
      lastActive: '2 hours ago',
      category: 'general',
      model: 'Claude 3',
      isOnline: false
    },
    {
      id: '6',
      name: 'Marketing Bot',
      status: 'error',
      conversations: 0,
      accuracy: 0,
      lastActive: '1 day ago',
      category: 'sales',
      model: 'GPT-4',
      isOnline: false
    }
  ];

  const filteredAssistants = mockAssistants.filter(assistant =>
    assistant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavigationItem = ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleClick = () => {
      setActiveItem(item.id);
      if (hasChildren) {
        setIsExpanded(!isExpanded);
      }
    };

    if (isCollapsed && level === 0) {
      return (
        <TooltipProvider key={item.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleClick}
                className={cn(
                  "w-full p-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent group relative",
                  isActive && "bg-sidebar-primary text-sidebar-primary-foreground"
                )}
              >
                <Icon className="h-5 w-5 mx-auto" />
                {item.badge && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                    {item.badge}
                  </div>
                )}
                {item.isNew && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-accent-orange-500 rounded-full" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="w-56">
              <div className="space-y-1">
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                )}
                {item.badge && (
                  <Badge variant="outline" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div key={item.id}>
        <button
          onClick={handleClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground",
            level > 0 && "ml-6"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          
          {item.isNew && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
          
          {item.badge && !item.isNew && (
            <Badge variant="outline" className="text-xs">
              {item.badge}
            </Badge>
          )}
          
          {hasChildren && (
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )} />
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => <NavigationItem key={child.id} item={child} level={level + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out h-full",
      isCollapsed ? "w-16" : "w-80",
      className
    )}>
      {/* Header */}
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
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            !isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <Button className="w-full justify-start tech-glow" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Assistant
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-b border-sidebar-border">
          <QuickStats isCollapsed={isCollapsed} />
        </div>

        {/* Main Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => <NavigationItem key={item.id} item={item} />)}
        </nav>

        {/* Active Assistants Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <Collapsible open={assistantsExpanded} onOpenChange={setAssistantsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <h3 className="text-sm font-medium text-sidebar-foreground">
                    Active Assistants ({filteredAssistants.length})
                  </h3>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    !assistantsExpanded && "-rotate-90"
                  )} />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 mt-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search assistants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-sidebar-accent border border-sidebar-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Assistants List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredAssistants.map((assistant) => (
                    <AssistantCard
                      key={assistant.id}
                      assistant={assistant}
                      isCompact={false}
                      onClick={() => setSelectedAssistant(assistant.id)}
                      isSelected={selectedAssistant === assistant.id}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Collapsed Assistants */}
        {isCollapsed && (
          <div className="p-2 border-t border-sidebar-border space-y-2">
            {filteredAssistants.slice(0, 5).map((assistant) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                isCompact={true}
                onClick={() => setSelectedAssistant(assistant.id)}
                isSelected={selectedAssistant === assistant.id}
              />
            ))}
          </div>
        )}

        {/* Help Section */}
        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SidebarOrigin;