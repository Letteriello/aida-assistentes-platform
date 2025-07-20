/**
 * AIDA Platform Design System
 * Combina Origin UI com características específicas do projeto
 * Inspirado em Oxum: riqueza, prosperidade e elegância
 */

export const aidaTokens = {
  // Cores primárias do sistema AIDA (preservando a paleta dourada de Oxum)
  colors: {
    // Paleta dourada principal (inspirada em Oxum)
    gold: {
      50: '#FFFBEB',
      100: '#FEF3C7', 
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Cor principal
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    
    // Status específicos da plataforma
    status: {
      connected: '#10B981',    // Verde para WhatsApp conectado
      disconnected: '#EF4444', // Vermelho para desconectado
      connecting: '#F59E0B',    // Dourado para conectando
      warning: '#F59E0B',       // Dourado para avisos
      error: '#EF4444',         // Vermelho para erros
    },
    
    // Billing/usage colors
    usage: {
      safe: '#10B981',      // < 70% usage
      warning: '#F59E0B',   // 70-90% usage  
      critical: '#EF4444',  // > 90% usage
      exceeded: '#DC2626',  // > 100% usage
    }
  },
  
  // Espaçamentos consistentes
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Tipografia (seguindo hierarquia clara)
  typography: {
    heading: {
      h1: 'text-3xl font-bold tracking-tight',
      h2: 'text-2xl font-semibold tracking-tight', 
      h3: 'text-xl font-semibold',
      h4: 'text-lg font-semibold',
    },
    body: {
      large: 'text-lg',
      default: 'text-base',
      small: 'text-sm',
      tiny: 'text-xs',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }
  },
  
  // Bordas e radius seguindo padrão Origin UI
  borders: {
    radius: {
      none: '0',
      sm: 'calc(var(--radius) - 4px)',
      md: 'calc(var(--radius) - 2px)', 
      lg: 'var(--radius)',
      full: '9999px',
    },
    width: {
      thin: '1px',
      thick: '2px',
    }
  },
  
  // Sombras elegantes (inspiração Apple/Premium)
  shadows: {
    subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    soft: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    large: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    premium: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Animações suaves (marca registrada Apple)
  animations: {
    fast: '150ms ease-out',
    normal: '250ms ease-out', 
    slow: '350ms ease-out',
    spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
} as const;

// Componentes específicos da plataforma AIDA
export const aidaComponents = {
  // Status indicator variants
  statusIndicator: {
    connected: 'bg-green-100 text-green-800 border-green-200',
    disconnected: 'bg-red-100 text-red-800 border-red-200', 
    connecting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
  },
  
  // Progress bar variants para usage meters
  usageProgress: {
    safe: 'bg-green-500',      // < 70%
    warning: 'bg-yellow-500',  // 70-90%
    critical: 'bg-red-500',    // 90-100% 
    exceeded: 'bg-red-600',    // > 100%
  },
  
  // Card variants específicos
  cardVariants: {
    default: 'bg-card border border-border',
    premium: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    gold: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
    connected: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  },
  
  // Button variants AIDA - Sincronizado com button.tsx (9 variantes)
  buttonVariants: {
    // Variante padrão (default) - tema dourado AIDA
    primary: 'bg-gradient-golden text-primary-foreground shadow-sm hover:shadow-golden hover:scale-[1.02] luxury-button rounded-flowing',
    // Variante destrutiva com contraste melhorado
    destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md rounded-lg focus-visible:ring-destructive/50',
    // Variante outline com efeito glass
    outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground glass-golden rounded-liquid backdrop-blur-sm',
    // Variante secundária
    secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md rounded-organic',
    // Variante ghost
    ghost: 'hover:bg-accent hover:text-accent-foreground rounded-lg focus-visible:ring-accent/50',
    // Variante link
    link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-primary/50',
    // Variante luxury com animações aprimoradas
    luxury: 'bg-gradient-flow text-primary-foreground shadow-lg hover:shadow-depth hover:scale-[1.05] luxury-button animate-float rounded-liquid',
    // Variante golden
    golden: 'bg-golden-300 text-primary-foreground shadow-sm hover:bg-golden-400 hover:shadow-golden hover:scale-[1.02] rounded-flowing',
    // Variante glass com backdrop blur
    glass: 'glass-golden text-foreground shadow-soft hover:shadow-md hover:scale-[1.01] rounded-organic backdrop-blur-xl border border-white/10',
  }
} as const;

// Utilitários para uso consistente
export const cn = (...inputs: (string | undefined)[]) => {
  return inputs.filter(Boolean).join(' ');
};

// Helper para combinar classes condicionalmente  
export const cva = (base: string, variants?: Record<string, Record<string, string>>) => {
  return (props?: Record<string, string>) => {
    if (!props || !variants) return base;
    
    const variantClasses = Object.entries(props).map(([key, value]) => {
      return variants[key]?.[value] || '';
    });
    
    return cn(base, ...variantClasses);
  };
};

// Types para type safety
export type StatusType = keyof typeof aidaComponents.statusIndicator;
export type UsageLevel = keyof typeof aidaComponents.usageProgress;
export type CardVariant = keyof typeof aidaComponents.cardVariants;
// ButtonVariant agora inclui todas as 9 variantes sincronizadas com button.tsx
export type ButtonVariant = keyof typeof aidaComponents.buttonVariants;