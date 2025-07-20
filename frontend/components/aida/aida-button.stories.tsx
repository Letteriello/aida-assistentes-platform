import type { Meta, StoryObj } from '@storybook/react';
import { AidaButton } from './aida-button';
import { Heart, Download, ArrowRight, Plus, Settings, Star, Sparkles } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof AidaButton> = {
  title: 'AIDA/AidaButton',
  component: AidaButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente AidaButton otimizado que delega funcionalidades para o Button nativo, mantendo compatibilidade retroativa com a nomenclatura AIDA e mapeamento inteligente de variantes.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'luxury', 'golden', 'glass'],
      description: 'Variante AIDA (mapeada para variantes nativas)'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Tamanho AIDA (mapeado para tamanhos nativos)'
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carregamento (delegado ao Button nativo)'
    },
    loadingText: {
      control: 'text',
      description: 'Texto de carregamento (delegado ao Button nativo)'
    },
    disabled: {
      control: 'boolean',
      description: 'Estado desabilitado'
    },
    icon: {
      description: 'Ícone do botão (delegado ao Button nativo)'
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição do ícone (delegado ao Button nativo)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// História principal mostrando mapeamento de variantes
export const VariantMapping: Story = {
  name: 'Mapeamento de Variantes AIDA',
  render: () => (
    <div className="grid grid-cols-2 gap-6 p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Variantes AIDA</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <AidaButton variant="primary">Primary</AidaButton>
            <span className="text-sm text-gray-500">→ default</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="destructive">Destructive</AidaButton>
            <span className="text-sm text-gray-500">→ destructive</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="outline">Outline</AidaButton>
            <span className="text-sm text-gray-500">→ outline</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="secondary">Secondary</AidaButton>
            <span className="text-sm text-gray-500">→ secondary</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="ghost">Ghost</AidaButton>
            <span className="text-sm text-gray-500">→ ghost</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="link">Link</AidaButton>
            <span className="text-sm text-gray-500">→ link</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Variantes AIDA Especiais</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <AidaButton variant="luxury">Luxury</AidaButton>
            <span className="text-sm text-gray-500">→ luxury</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="golden">Golden</AidaButton>
            <span className="text-sm text-gray-500">→ golden</span>
          </div>
          <div className="flex items-center space-x-3">
            <AidaButton variant="glass">Glass</AidaButton>
            <span className="text-sm text-gray-500">→ glass</span>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração do mapeamento inteligente entre variantes AIDA e variantes nativas do Button.'
      }
    }
  }
};

// História mostrando mapeamento de tamanhos
export const SizeMapping: Story = {
  name: 'Mapeamento de Tamanhos AIDA',
  render: () => (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold text-gray-800">Tamanhos AIDA → Nativos</h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <AidaButton size="sm" variant="primary">Small</AidaButton>
          <span className="text-sm text-gray-500">sm → sm</span>
        </div>
        <div className="flex items-center space-x-4">
          <AidaButton size="md" variant="primary">Medium</AidaButton>
          <span className="text-sm text-gray-500">md → default</span>
        </div>
        <div className="flex items-center space-x-4">
          <AidaButton size="lg" variant="primary">Large</AidaButton>
          <span className="text-sm text-gray-500">lg → lg</span>
        </div>
        <div className="flex items-center space-x-4">
          <AidaButton size="xl" variant="primary">Extra Large</AidaButton>
          <span className="text-sm text-gray-500">xl → xl</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração do mapeamento entre tamanhos AIDA (sm, md, lg, xl) e tamanhos nativos do Button.'
      }
    }
  }
};

// História padrão
export const Default: Story = {
  args: {
    children: 'AIDA Button',
    variant: 'primary',
    size: 'md'
  }
};

// Variantes AIDA especiais em destaque
export const AidaSpecialVariants: Story = {
  name: 'Variantes Especiais AIDA',
  render: () => (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Luxury Experience</h4>
        <div className="space-x-3">
          <AidaButton variant="luxury" size="sm">Small Luxury</AidaButton>
          <AidaButton variant="luxury" size="md">Medium Luxury</AidaButton>
          <AidaButton variant="luxury" size="lg">Large Luxury</AidaButton>
          <AidaButton variant="luxury" size="xl">XL Luxury</AidaButton>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Golden Actions</h4>
        <div className="space-x-3">
          <AidaButton variant="golden" size="sm">Small Golden</AidaButton>
          <AidaButton variant="golden" size="md">Medium Golden</AidaButton>
          <AidaButton variant="golden" size="lg">Large Golden</AidaButton>
          <AidaButton variant="golden" size="xl">XL Golden</AidaButton>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Glass Effects</h4>
        <div className="space-x-3">
          <AidaButton variant="glass" size="sm">Small Glass</AidaButton>
          <AidaButton variant="glass" size="md">Medium Glass</AidaButton>
          <AidaButton variant="glass" size="lg">Large Glass</AidaButton>
          <AidaButton variant="glass" size="xl">XL Glass</AidaButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração das variantes especiais da plataforma AIDA: luxury, golden e glass em todos os tamanhos.'
      }
    }
  }
};

// Delegação de funcionalidades
export const FeatureDelegation: Story = {
  name: 'Delegação de Funcionalidades',
  render: () => (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Estados de Loading (Delegados)</h4>
        <div className="space-x-3">
          <AidaButton loading variant="primary">Loading...</AidaButton>
          <AidaButton loading loadingText="Saving..." variant="golden">
            Save Changes
          </AidaButton>
          <AidaButton loading variant="luxury" size="lg">
            Processing
          </AidaButton>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Ícones (Delegados)</h4>
        <div className="space-x-3">
          <AidaButton 
            icon={<Heart className="h-4 w-4" />} 
            variant="primary"
          >
            Like
          </AidaButton>
          <AidaButton 
            icon={<Download className="h-4 w-4" />} 
            variant="outline"
          >
            Download
          </AidaButton>
          <AidaButton 
            icon={<Sparkles className="h-4 w-4" />} 
            iconPosition="right" 
            variant="luxury"
          >
            Magic
          </AidaButton>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Estados Desabilitados</h4>
        <div className="space-x-3">
          <AidaButton disabled variant="primary">Disabled</AidaButton>
          <AidaButton disabled variant="golden">Golden Disabled</AidaButton>
          <AidaButton disabled variant="luxury">Luxury Disabled</AidaButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração de como o AidaButton delega funcionalidades como loading, ícones e estados para o Button nativo.'
      }
    }
  }
};

// Compatibilidade retroativa
export const BackwardCompatibility: Story = {
  name: 'Compatibilidade Retroativa',
  render: () => (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Nomenclatura AIDA Mantida</h4>
        <p className="text-sm text-gray-600">
          O AidaButton mantém a nomenclatura familiar (primary, md) enquanto mapeia para o Button nativo (default, default)
        </p>
        <div className="space-x-3">
          <AidaButton variant="primary" size="md">
            Primary Medium (AIDA)
          </AidaButton>
          <AidaButton variant="luxury" size="lg">
            Luxury Large (AIDA)
          </AidaButton>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Todas as Props Suportadas</h4>
        <AidaButton
          variant="golden"
          size="lg"
          loading={false}
          icon={<Star className="h-4 w-4" />}
          iconPosition="left"
          className="custom-aida-class"
          onClick={() => alert('AidaButton clicked!')}
        >
          Full Props AIDA Button
        </AidaButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração da compatibilidade retroativa mantendo a API familiar do AidaButton.'
      }
    }
  }
};

// Casos de uso AIDA
export const AidaUseCases: Story = {
  name: 'Casos de Uso AIDA',
  render: () => (
    <div className="space-y-8 p-6">
      {/* Onboarding Flow */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Fluxo de Onboarding (5min)</h4>
        <div className="space-x-2">
          <AidaButton variant="outline" size="sm">Skip</AidaButton>
          <AidaButton variant="primary" size="sm">Next Step</AidaButton>
          <AidaButton variant="luxury" size="md">
            Complete Setup
          </AidaButton>
        </div>
      </div>
      
      {/* Premium Features */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Features Premium</h4>
        <div className="space-x-2">
          <AidaButton variant="golden" size="lg" className="w-full">
            Upgrade to AIDA Pro
          </AidaButton>
        </div>
        <div className="space-x-2">
          <AidaButton variant="glass" size="md">
            Try Premium Features
          </AidaButton>
          <AidaButton variant="link" size="sm">
            Learn More
          </AidaButton>
        </div>
      </div>
      
      {/* Dashboard Actions */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Dashboard Actions</h4>
        <div className="grid grid-cols-3 gap-2">
          <AidaButton variant="primary" size="sm">
            New Project
          </AidaButton>
          <AidaButton variant="outline" size="sm">
            Import Data
          </AidaButton>
          <AidaButton variant="ghost" size="sm">
            Settings
          </AidaButton>
        </div>
      </div>
      
      {/* AI Assistant Actions */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">AI Assistant</h4>
        <div className="space-x-2">
          <AidaButton 
            variant="luxury" 
            size="md"
            icon={<Sparkles className="h-4 w-4" />}
          >
            Ask AIDA
          </AidaButton>
          <AidaButton variant="secondary" size="sm">
            Clear Chat
          </AidaButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Casos de uso reais do AidaButton na plataforma AIDA, incluindo onboarding, features premium e ações do dashboard.'
      }
    }
  }
};

// Performance e otimização
export const PerformanceDemo: Story = {
  name: 'Performance e Otimização',
  render: () => (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Componente Memoizado</h4>
        <p className="text-sm text-gray-600">
          O AidaButton usa React.memo para otimização de re-renders
        </p>
        <div className="space-x-2">
          <AidaButton variant="primary">Memoized Button 1</AidaButton>
          <AidaButton variant="golden">Memoized Button 2</AidaButton>
          <AidaButton variant="luxury">Memoized Button 3</AidaButton>
        </div>
      </div>
      
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-700">Delegação Eficiente</h4>
        <p className="text-sm text-gray-600">
          Funcionalidades delegadas ao Button nativo para melhor performance
        </p>
        <div className="space-x-2">
          <AidaButton 
            variant="luxury" 
            loading 
            loadingText="Optimized loading..."
          >
            Delegated Loading
          </AidaButton>
          <AidaButton 
            variant="golden" 
            icon={<Settings className="h-4 w-4" />}
          >
            Delegated Icon
          </AidaButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração das otimizações de performance implementadas no AidaButton.'
      }
    }
  }
};

// Playground
export const Playground: Story = {
  name: 'Playground AIDA',
  args: {
    children: 'AIDA Playground',
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    loadingText: 'Loading...',
    iconPosition: 'left'
  },
  render: (args) => (
    <AidaButton {...args}>
      {args.children}
    </AidaButton>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use os controles para experimentar diferentes combinações de props do AidaButton.'
      }
    }
  }
};