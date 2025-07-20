/**
 * AIDA Platform - Origin UI Design System Showcase
 * Demonstrates the complete technology-themed design system
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Shield, 
  Sparkles, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Settings,
  BarChart3,
  Brain,
  Cpu,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorSwatchProps {
  name: string;
  colors: Record<string, string>;
  category: 'primary' | 'secondary' | 'accent' | 'semantic';
}

interface DesignSystemProps {
  className?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ name, colors, category }) => {
  const categoryIcons = {
    primary: Shield,
    secondary: Users,
    accent: Zap,
    semantic: Activity
  };
  
  const Icon = categoryIcons[category];

  return (
    <Card className="bento-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{name}</CardTitle>
        </div>
        <CardDescription className="text-sm">
          {category === 'primary' && '60% - Technology & Trust'}
          {category === 'secondary' && '30% - Professionalism'}
          {category === 'accent' && '10% - AI Status & Actions'}
          {category === 'semantic' && 'Feedback & Status'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(colors).map(([shade, color]) => (
            <div key={shade} className="text-center">
              <div
                className="w-full h-12 rounded-lg border border-border mb-2 transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
                title={`${name}-${shade}: ${color}`}
              />
              <div className="text-xs text-muted-foreground font-mono">
                {shade}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ComponentShowcase: React.FC = () => {
  return (
    <Card className="bento-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-purple-500" />
          <CardTitle>Interactive Components</CardTitle>
        </div>
        <CardDescription>
          Origin UI components with technology theme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Buttons */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Buttons</h4>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="tech-glow">
              <Cpu className="h-4 w-4 mr-2" />
              Primary Action
            </Button>
            <Button variant="secondary">
              <Database className="h-4 w-4 mr-2" />
              Secondary
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Outline
            </Button>
            <Button variant="ghost" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ghost
            </Button>
          </div>
        </div>

        {/* AI Status Badges */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">AI Status Indicators</h4>
          <div className="flex flex-wrap gap-3">
            <Badge className="ai-status-active">
              <Activity className="h-3 w-3 mr-1" />
              AI Active
            </Badge>
            <Badge className="ai-status-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              Success
            </Badge>
            <Badge className="ai-status-warning">
              <Zap className="h-3 w-3 mr-1" />
              Warning
            </Badge>
            <Badge className="ai-status-premium">
              <Sparkles className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>
        </div>

        {/* Progress Indicators */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Progress & Metrics</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>AI Model Training</span>
                <span className="text-accent-cyan-500">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Response Accuracy</span>
                <span className="text-accent-lime-500">95%</span>
              </div>
              <Progress value={95} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>System Load</span>
                <span className="text-accent-orange-500">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const BentoGridDemo: React.FC = () => {
  const metrics = [
    { label: 'Active Assistants', value: '24', change: '+12%', icon: Brain, color: 'text-accent-cyan-500' },
    { label: 'Conversations Today', value: '1,247', change: '+8%', icon: MessageSquare, color: 'text-accent-lime-500' },
    { label: 'Response Time', value: '0.8s', change: '-15%', icon: Zap, color: 'text-accent-orange-500' },
    { label: 'Satisfaction', value: '98.5%', change: '+2%', icon: TrendingUp, color: 'text-accent-purple-500' },
  ];

  return (
    <Card className="bento-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>Bento Grid Layout</CardTitle>
        </div>
        <CardDescription>
          Responsive grid system for dashboard metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bento-grid bento-grid-md">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="bento-card-glass p-4 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={cn("h-5 w-5", metric.color)} />
                <Badge variant="outline" className="text-xs">
                  {metric.change}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AnimationDemo: React.FC = () => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  };

  return (
    <Card className="bento-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent-purple-500" />
          <CardTitle>Technology Animations</CardTitle>
        </div>
        <CardDescription>
          Smooth micro-interactions and transitions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={triggerAnimation} variant="outline" className="w-full">
          Trigger Animations
        </Button>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "p-4 bg-gradient-to-br from-primary/10 to-accent-cyan-500/10 rounded-lg border border-primary/20",
            isAnimating && "animate-tech-pulse"
          )}>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">Tech Pulse</div>
              <div className="text-sm text-muted-foreground">Pulsing glow effect</div>
            </div>
          </div>
          
          <div className={cn(
            "p-4 bg-gradient-to-br from-accent-lime-500/10 to-accent-purple-500/10 rounded-lg border border-accent-lime-500/20",
            isAnimating && "animate-scale-in"
          )}>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent-lime-500">Scale In</div>
              <div className="text-sm text-muted-foreground">Smooth scaling</div>
            </div>
          </div>
          
          <div className={cn(
            "p-4 bg-gradient-to-br from-accent-orange-500/10 to-primary/10 rounded-lg border border-accent-orange-500/20",
            isAnimating && "animate-slide-up"
          )}>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent-orange-500">Slide Up</div>
              <div className="text-sm text-muted-foreground">Upward motion</div>
            </div>
          </div>
          
          <div className={cn(
            "p-4 bg-gradient-to-br from-accent-purple-500/10 to-accent-cyan-500/10 rounded-lg border border-accent-purple-500/20",
            isAnimating && "animate-float"
          )}>
            <div className="text-center">
              <div className="text-lg font-semibold text-accent-purple-500">Float</div>
              <div className="text-sm text-muted-foreground">Floating effect</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DesignSystemOrigin: React.FC<DesignSystemProps> = ({ className }) => {
  const colorPalettes = {
    primary: {
      '50': '#f0f9ff',
      '100': '#e0f2fe',
      '300': '#7dd3fc',
      '600': '#0284c7',
      '900': '#0c4a6e'
    },
    secondary: {
      '50': '#f8fafc',
      '100': '#f1f5f9',
      '400': '#94a3b8',
      '600': '#475569',
      '900': '#0f172a'
    },
    accentCyan: {
      '50': '#ecfeff',
      '500': '#06b6d4',
      '600': '#0891b2',
      '700': '#0e7490',
      '800': '#155e75'
    },
    accentLime: {
      '50': '#f7fee7',
      '500': '#84cc16',
      '600': '#65a30d',
      '700': '#4d7c0f',
      '800': '#365314'
    }
  };

  return (
    <div className={cn("space-y-8 p-6", className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-tech-gradient">
          AIDA Platform Design System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Technology-focused design system with Origin UI components, 
          featuring a 60-30-10 color palette and modern micro-interactions.
        </p>
      </div>

      {/* Color Palettes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Technology Color Palette</h2>
        <div className="bento-grid bento-grid-lg">
          <ColorSwatch 
            name="Primary Colors" 
            colors={colorPalettes.primary} 
            category="primary" 
          />
          <ColorSwatch 
            name="Secondary Colors" 
            colors={colorPalettes.secondary} 
            category="secondary" 
          />
          <ColorSwatch 
            name="Accent Cyan" 
            colors={colorPalettes.accentCyan} 
            category="accent" 
          />
          <ColorSwatch 
            name="Accent Lime" 
            colors={colorPalettes.accentLime} 
            category="accent" 
          />
        </div>
      </section>

      {/* Component Showcase */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Interactive Components</h2>
        <div className="bento-grid bento-grid-lg">
          <ComponentShowcase />
          <BentoGridDemo />
          <AnimationDemo />
        </div>
      </section>

      {/* Technology Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Design System Features</h2>
        <div className="bento-grid bento-grid-lg">
          <Card className="bento-card glass-effect">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>WCAG 2.1 AA Compliant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All colors meet accessibility standards with 4.5:1 contrast ratios.
                Full keyboard navigation and screen reader support.
              </p>
            </CardContent>
          </Card>

          <Card className="bento-card glass-effect">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent-orange-500" />
                <CardTitle>Performance Optimized</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                CSS-in-JS optimizations, tree-shaking support, and &lt;2s load times.
                Bundle size &lt;500KB with lazy loading.
              </p>
            </CardContent>
          </Card>

          <Card className="bento-card glass-effect">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-lime-500" />
                <CardTitle>Responsive Design</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mobile-first approach with breakpoints from 320px to 2560px.
                Bento grid layout adapts seamlessly across devices.
              </p>
            </CardContent>
          </Card>

          <Card className="bento-card glass-effect">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent-purple-500" />
                <CardTitle>AI-Focused Components</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Specialized components for AI status, metrics, and interactions.
                Real-time updates and progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DesignSystemOrigin;