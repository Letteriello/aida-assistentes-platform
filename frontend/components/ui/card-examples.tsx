import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Heart, Share2, MessageCircle, MoreHorizontal } from "lucide-react";

// Exemplo 1: Card Interativo com Loading
export function InteractiveCardExample() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Card 
      variant="elevated" 
      size="md" 
      interactive 
      loading={loading}
      onClick={handleClick}
      className="w-80 cursor-pointer"
    >
      <CardHeader variant="default" align="left">
        <CardTitle>Card Interativo</CardTitle>
        <CardDescription>
          Clique para ver o estado de carregamento
        </CardDescription>
      </CardHeader>
      <CardContent variant="default">
        <p className="text-sm text-muted-foreground">
          Este card demonstra as novas funcionalidades: hover effects, 
          loading state e interatividade.
        </p>
      </CardContent>
      <CardFooter variant="default" justify="between">
        <Badge variant="secondary">Novo</Badge>
        <Button variant="ghost" size="sm">
          Ver mais
        </Button>
      </CardFooter>
    </Card>
  );
}

// Exemplo 2: Card de Produto com Variantes
export function ProductCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card Default */}
      <Card variant="default" size="md">
        <CardHeader variant="compact">
          <CardTitle className="text-lg">Produto Básico</CardTitle>
          <CardDescription>Variante padrão</CardDescription>
        </CardHeader>
        <CardContent variant="compact">
          <div className="aspect-square bg-muted rounded-lg mb-4"></div>
          <p className="text-2xl font-bold">R$ 99,90</p>
        </CardContent>
        <CardFooter variant="compact" justify="center">
          <Button className="w-full">Comprar</Button>
        </CardFooter>
      </Card>

      {/* Card Elevated */}
      <Card variant="elevated" size="md">
        <CardHeader variant="default">
          <CardTitle className="text-lg">Produto Premium</CardTitle>
          <CardDescription>Variante elevada</CardDescription>
        </CardHeader>
        <CardContent variant="default">
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4"></div>
          <p className="text-2xl font-bold">R$ 199,90</p>
        </CardContent>
        <CardFooter variant="default" justify="center">
          <Button className="w-full">Comprar</Button>
        </CardFooter>
      </Card>

      {/* Card Outlined */}
      <Card variant="outlined" size="md">
        <CardHeader variant="spacious">
          <CardTitle className="text-lg">Produto Especial</CardTitle>
          <CardDescription>Variante outlined</CardDescription>
        </CardHeader>
        <CardContent variant="spacious">
          <div className="aspect-square bg-accent/20 rounded-lg mb-4"></div>
          <p className="text-2xl font-bold">R$ 299,90</p>
        </CardContent>
        <CardFooter variant="spacious" justify="center">
          <Button variant="outline" className="w-full">Comprar</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Exemplo 3: Card de Post Social
export function SocialPostCardExample() {
  return (
    <Card variant="default" size="md" className="max-w-md">
      <CardHeader variant="compact">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full"></div>
          <div className="flex-1">
            <CardTitle className="text-base">João Silva</CardTitle>
            <CardDescription className="text-xs">há 2 horas</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent variant="flush">
        <div className="px-6 pb-4">
          <p className="text-sm">
            Acabei de implementar as novas funcionalidades do componente Card! 
            🚀 Agora temos variants, loading states e muito mais.
          </p>
        </div>
        <div className="aspect-video bg-muted"></div>
      </CardContent>
      
      <CardFooter variant="compact" justify="between">
        <div className="flex space-x-4">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4 mr-1" />
            24
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            8
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Compartilhar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Exemplo 4: Card com Conteúdo Scrollável
export function ScrollableCardExample() {
  const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);

  return (
    <Card variant="outlined" size="md" className="w-80">
      <CardHeader variant="compact" align="center">
        <CardTitle>Lista Scrollável</CardTitle>
        <CardDescription>Conteúdo com scroll customizado</CardDescription>
      </CardHeader>
      
      <CardContent 
        variant="compact" 
        scrollable 
        maxHeight="200px"
        className="space-y-2"
      >
        {items.map((item) => (
          <div 
            key={item} 
            className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            {item}
          </div>
        ))}
      </CardContent>
      
      <CardFooter variant="compact" justify="center">
        <Button variant="outline" size="sm">
          Ver todos
        </Button>
      </CardFooter>
    </Card>
  );
}

// Exemplo 5: Card Ghost para Dashboard
export function DashboardCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        { title: "Usuários Ativos", value: "1,234", change: "+12%" },
        { title: "Receita Mensal", value: "R$ 45,678", change: "+8%" },
        { title: "Conversões", value: "89.2%", change: "+2.1%" },
        { title: "Satisfação", value: "4.8/5", change: "+0.3" }
      ].map((metric, index) => (
        <Card key={index} variant="ghost" size="sm" interactive>
          <CardHeader variant="compact" align="left">
            <CardDescription className="text-xs uppercase tracking-wide">
              {metric.title}
            </CardDescription>
          </CardHeader>
          <CardContent variant="compact">
            <div className="flex items-baseline justify-between">
              <CardTitle className="text-2xl font-bold">
                {metric.value}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {metric.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente principal que demonstra todos os exemplos
export function CardShowcase() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Card Interativo</h2>
        <InteractiveCardExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Variantes de Produto</h2>
        <ProductCardExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Post Social</h2>
        <SocialPostCardExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Conteúdo Scrollável</h2>
        <ScrollableCardExample />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Cards de Dashboard</h2>
        <DashboardCardExample />
      </div>
    </div>
  );
}