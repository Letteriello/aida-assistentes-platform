import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Heart, Download, ArrowRight, Plus, Settings, Star } from 'lucide-react';
import React from 'react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Componente Button refatorado com melhorias da Origin UI, incluindo 9 variantes, estados de loading, suporte a ícones e acessibilidade WCAG 2.1 AA.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'luxury', 'golden', 'glass'],
      description: 'Variante visual do botão'
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'xl'],
      description: 'Tamanho do botão'
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carregamento'
    },
    loadingText: {
      control: 'text',
      description: 'Texto exibido durante carregamento'
    },
    disabled: {
      control: 'boolean',
      description: 'Estado desabilitado'
    },
    iconPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição do ícone'
    },
    asChild: {
      control: 'boolean',
      description: 'Renderizar como elemento filho (Radix UI)'
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

// História principal com todas as variantes
export const AllVariants: Story = {
  name: 'Todas as Variantes',
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Variantes Padrão</h3>
        <div className="space-y-2">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Variantes AIDA</h3>
        <div className="space-y-2">
          <Button variant="luxury">Luxury</Button>
          <Button variant="golden">Golden</Button>
          <Button variant="glass">Glass</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Tamanhos</h3>
        <div className="space-y-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
          <Button size="icon"><Settings className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração de todas as 9 variantes e 5 tamanhos disponíveis no componente Button.'
      }
    }
  }
};

// História padrão
export const Default: Story = {
  args: {
    children: 'Button'
  }
};

// Variantes individuais
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Account'
  }
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancel'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button'
  }
};

// Variantes AIDA especiais
export const Luxury: Story = {
  name: 'Luxury (AIDA)',
  args: {
    variant: 'luxury',
    children: 'Luxury Experience'
  },
  parameters: {
    docs: {
      description: {
        story: 'Variante luxury com efeitos especiais e animações premium da plataforma AIDA.'
      }
    }
  }
};

export const Golden: Story = {
  name: 'Golden (AIDA)',
  args: {
    variant: 'golden',
    children: 'Golden Action'
  },
  parameters: {
    docs: {
      description: {
        story: 'Variante golden com gradiente dourado característico da identidade visual AIDA.'
      }
    }
  }
};

export const Glass: Story = {
  name: 'Glass (AIDA)',
  args: {
    variant: 'glass',
    children: 'Glass Effect'
  },
  parameters: {
    docs: {
      description: {
        story: 'Variante glass com efeito de vidro e transparência elegante.'
      }
    }
  }
};

// Estados especiais
export const LoadingState: Story = {
  name: 'Estado de Loading',
  render: () => (
    <div className="space-x-4">
      <Button loading>Loading...</Button>
      <Button loading loadingText="Saving..." variant="golden">
        Save Changes
      </Button>
      <Button loading variant="luxury" size="lg">
        Processing
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração dos estados de loading com spinner e texto customizado.'
      }
    }
  }
};

export const DisabledState: Story = {
  name: 'Estado Desabilitado',
  render: () => (
    <div className="space-x-4">
      <Button disabled>Disabled</Button>
      <Button disabled variant="destructive">Delete</Button>
      <Button disabled variant="golden">Golden Disabled</Button>
      <Button disabled variant="luxury">Luxury Disabled</Button>
    </div>
  )
};

// Botões com ícones
export const WithIcons: Story = {
  name: 'Com Ícones',
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Ícone à Esquerda</h4>
        <div className="space-x-2">
          <Button icon={<Heart className="h-4 w-4" />}>Like</Button>
          <Button icon={<Download className="h-4 w-4" />} variant="outline">
            Download
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} variant="golden">
            Add Item
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Ícone à Direita</h4>
        <div className="space-x-2">
          <Button icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
            Continue
          </Button>
          <Button 
            icon={<Star className="h-4 w-4" />} 
            iconPosition="right" 
            variant="luxury"
          >
            Premium
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Botões com ícones posicionados à esquerda ou direita do texto.'
      }
    }
  }
};

// Tamanhos
export const Sizes: Story = {
  name: 'Tamanhos',
  render: () => (
    <div className="flex items-center space-x-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="icon" variant="outline">
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  )
};

// Playground interativo
export const Playground: Story = {
  name: 'Playground',
  args: {
    children: 'Playground Button',
    variant: 'default',
    size: 'default',
    loading: false,
    disabled: false,
    loadingText: 'Loading...',
    iconPosition: 'left'
  },
  render: (args) => (
    <Button {...args}>
      {args.children}
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use os controles abaixo para experimentar diferentes combinações de props.'
      }
    }
  }
};

// Casos de uso reais
export const RealWorldExamples: Story = {
  name: 'Casos de Uso Reais',
  render: () => (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Header Actions</h4>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            Profile
          </Button>
          <Button variant="outline" size="sm">
            Settings
          </Button>
          <Button variant="golden" size="sm">
            Upgrade
          </Button>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Form Actions</h4>
        <div className="flex space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button variant="default" loading>
            Save Changes
          </Button>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Call to Action</h4>
        <div className="space-y-2">
          <Button variant="luxury" size="lg" className="w-full">
            Start Your AIDA Journey
          </Button>
          <Button variant="link" size="sm" className="w-full">
            Learn more about our features
          </Button>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-red-600">Danger Zone</h4>
        <Button variant="destructive" size="sm">
          Delete Account
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Exemplos de como o componente Button é usado em contextos reais da plataforma AIDA.'
      }
    }
  }
};

// Teste de acessibilidade
export const AccessibilityDemo: Story = {
  name: 'Demonstração de Acessibilidade',
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Navegação por Teclado</h4>
        <p className="text-xs text-gray-600">
          Use Tab para navegar, Enter ou Espaço para ativar
        </p>
        <div className="space-x-2">
          <Button>First Button</Button>
          <Button variant="outline">Second Button</Button>
          <Button variant="golden">Third Button</Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">ARIA Labels</h4>
        <div className="space-x-2">
          <Button aria-label="Close dialog">×</Button>
          <Button aria-label="Add to favorites" variant="ghost">
            <Heart className="h-4 w-4" />
          </Button>
          <Button aria-describedby="help-text" variant="outline">
            Help
          </Button>
        </div>
        <p id="help-text" className="text-xs text-gray-600">
          This button opens the help documentation
        </p>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Estados para Screen Readers</h4>
        <div className="space-x-2">
          <Button loading aria-label="Saving your changes">
            Save
          </Button>
          <Button disabled aria-label="Feature not available">
            Premium Feature
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração das funcionalidades de acessibilidade implementadas no componente Button, incluindo navegação por teclado, ARIA labels e suporte a screen readers.'
      }
    }
  }
};

// Integração com Radix UI
export const RadixIntegration: Story = {
  name: 'Integração Radix UI',
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">asChild - Renderizar como Link</h4>
        <Button asChild variant="outline">
          <a href="#" className="no-underline">
            External Link
          </a>
        </Button>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">asChild - Renderizar como Div</h4>
        <Button asChild variant="ghost">
          <div role="button" tabIndex={0}>
            Custom Element
          </div>
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstração da integração com Radix UI usando a prop asChild para renderizar o componente como diferentes elementos HTML.'
      }
    }
  }
};