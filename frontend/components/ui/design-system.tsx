'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  Star, 
  Award,
  Gem,
  Shield,
  Heart,
  Diamond
} from 'lucide-react';

// Componente principal do Design System AIDA
export function DesignSystemShowcase() {
  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-light tracking-tight">
          AIDA Design System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Sistema de design inspirado na Orixá Oxum, focado em prosperidade, elegância e minimalismo
        </p>
      </div>

      {/* Paleta de Cores */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">Paleta de Cores</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cores Douradas */}
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-golden-600" />
                Dourado Oxum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Golden 50', color: 'bg-golden-50', value: '50' },
                  { name: 'Golden 100', color: 'bg-golden-100', value: '100' },
                  { name: 'Golden 500', color: 'bg-golden-500', value: '500' },
                  { name: 'Golden 900', color: 'bg-golden-900', value: '900' },
                ].map((color) => (
                  <div key={color.name} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-md border", color.color)} />
                    <div>
                      <p className="text-sm font-medium">{color.name}</p>
                      <p className="text-xs text-muted-foreground">oklch(...)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cores Neutras */}
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-neutral-600" />
                Neutras Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Neutral 100', color: 'bg-neutral-100', value: '100' },
                  { name: 'Neutral 400', color: 'bg-neutral-400', value: '400' },
                  { name: 'Neutral 700', color: 'bg-neutral-700', value: '700' },
                  { name: 'Neutral 900', color: 'bg-neutral-900', value: '900' },
                ].map((color) => (
                  <div key={color.name} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-md border", color.color)} />
                    <div>
                      <p className="text-sm font-medium">{color.name}</p>
                      <p className="text-xs text-muted-foreground">oklch(...)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cores Semânticas */}
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-success-600" />
                Semânticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Success', color: 'bg-success-DEFAULT', value: 'success' },
                  { name: 'Warning', color: 'bg-warning-DEFAULT', value: 'warning' },
                  { name: 'Danger', color: 'bg-danger-DEFAULT', value: 'danger' },
                  { name: 'Primary', color: 'bg-primary', value: 'primary' },
                ].map((color) => (
                  <div key={color.name} className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-md border", color.color)} />
                    <div>
                      <p className="text-sm font-medium">{color.name}</p>
                      <p className="text-xs text-muted-foreground">oklch(...)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Componentes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">Componentes</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Botões */}
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle>Botões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Primary
              </Button>
              <Button variant="outline" className="w-full">
                <Star className="w-4 h-4 mr-2" />
                Outline
              </Button>
              <Button variant="ghost" className="w-full">
                <Award className="w-4 h-4 mr-2" />
                Ghost
              </Button>
            </CardContent>
          </Card>

          {/* Badges */}
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle>Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success-DEFAULT text-white">
                  <Zap className="w-3 h-3 mr-1" />
                  Conectado
                </Badge>
                <Badge className="bg-warning-DEFAULT text-white">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Processando
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <Card className="glass-golden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gem className="w-4 h-4 text-golden-600" />
                    Card Exemplo
                  </CardTitle>
                  <CardDescription>
                    Descrição do card com estilo elegante
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Conteúdo do card com tipografia consistente
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tipografia */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">Tipografia</h2>
        
        <Card className="glass-golden">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-light tracking-tight">
                  Heading 1 - Light
                </h1>
                <p className="text-sm text-muted-foreground">4xl / font-light</p>
              </div>
              <div>
                <h2 className="text-2xl font-light">
                  Heading 2 - Light
                </h2>
                <p className="text-sm text-muted-foreground">2xl / font-light</p>
              </div>
              <div>
                <h3 className="text-xl font-medium">
                  Heading 3 - Medium
                </h3>
                <p className="text-sm text-muted-foreground">xl / font-medium</p>
              </div>
              <div>
                <p className="text-base">
                  Corpo do texto - Regular
                </p>
                <p className="text-sm text-muted-foreground">base / font-normal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Texto secundário - Muted
                </p>
                <p className="text-sm text-muted-foreground">sm / text-muted-foreground</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Animações */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">Animações</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-golden">
            <CardHeader>
              <CardTitle>Animações de Entrada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-fade-in-slide">
                <Badge>Fade In Slide</Badge>
              </div>
              <div className="animate-slide-in">
                <Badge>Slide In</Badge>
              </div>
              <div className="animate-scale-in">
                <Badge>Scale In</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-golden">
            <CardHeader>
              <CardTitle>Animações Contínuas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-prosperity-pulse">
                <Badge className="bg-golden-500 text-white">
                  <Diamond className="w-3 h-3 mr-1" />
                  Prosperity Pulse
                </Badge>
              </div>
              <div className="animate-shimmer bg-gradient-to-r from-golden-100 via-golden-200 to-golden-100 bg-[length:200%_100%] p-2 rounded">
                <Badge variant="outline">Shimmer Effect</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sombras */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">Sombras</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-center text-sm font-medium">Soft Shadow</p>
              <p className="text-center text-xs text-muted-foreground">shadow-soft</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-golden">
            <CardContent className="pt-6">
              <p className="text-center text-sm font-medium">Golden Shadow</p>
              <p className="text-center text-xs text-muted-foreground">shadow-golden</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-elegant">
            <CardContent className="pt-6">
              <p className="text-center text-sm font-medium">Elegant Shadow</p>
              <p className="text-center text-xs text-muted-foreground">shadow-elegant</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-luxury">
            <CardContent className="pt-6">
              <p className="text-center text-sm font-medium">Luxury Shadow</p>
              <p className="text-center text-xs text-muted-foreground">shadow-luxury</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Separador */}
      <Separator className="my-8" />

      {/* Responsividade */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">Responsividade</h2>
        
        <Card className="glass-golden">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-golden-100 rounded-lg">
                <p className="text-sm font-medium">Mobile First</p>
                <p className="text-xs text-muted-foreground">Base styles</p>
              </div>
              <div className="p-4 bg-golden-100 rounded-lg">
                <p className="text-sm font-medium">Tablet (md:)</p>
                <p className="text-xs text-muted-foreground">≥ 768px</p>
              </div>
              <div className="p-4 bg-golden-100 rounded-lg">
                <p className="text-sm font-medium">Desktop (lg:)</p>
                <p className="text-xs text-muted-foreground">≥ 1024px</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// Componente para demonstrar o uso do Design System
export function DesignSystemDemo() {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-light tracking-tight">
          Design System em Ação
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Exemplo de como usar o Design System AIDA na prática
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dashboard Card */}
        <Card className="glass-golden shadow-golden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-golden-600" />
              Dashboard Principal
            </CardTitle>
            <CardDescription>
              Exemplo de card do dashboard com design system aplicado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className="bg-success-DEFAULT text-white">
                <Zap className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">68%</span>
            </div>
            <div className="w-full bg-golden-100 rounded-full h-2">
              <div 
                className="bg-golden-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: '68%' }}
              />
            </div>
            <Button className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Ação Principal
            </Button>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="glass-golden shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-golden-600" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-light text-golden-600">2.4K</p>
                <p className="text-sm text-muted-foreground">Mensagens</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-golden-600">95%</p>
                <p className="text-sm text-muted-foreground">Satisfação</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-golden-600">12</p>
                <p className="text-sm text-muted-foreground">Assistentes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-golden-600">24/7</p>
                <p className="text-sm text-muted-foreground">Disponível</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}