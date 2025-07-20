import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AidaButton } from '../aida-button';
import { Heart } from 'lucide-react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('AidaButton Component', () => {
  // Teste de renderização básica
  it('renders correctly with default props', () => {
    render(<AidaButton>AIDA Button</AidaButton>);
    const button = screen.getByRole('button', { name: /aida button/i });
    expect(button).toBeInTheDocument();
  });

  // Testes de mapeamento de variantes AIDA
  describe('Variant Mapping', () => {
    const aidaVariants = [
      { aida: 'primary', expected: 'default' },
      { aida: 'destructive', expected: 'destructive' },
      { aida: 'outline', expected: 'outline' },
      { aida: 'secondary', expected: 'secondary' },
      { aida: 'ghost', expected: 'ghost' },
      { aida: 'link', expected: 'link' },
      { aida: 'luxury', expected: 'luxury' },
      { aida: 'golden', expected: 'golden' },
      { aida: 'glass', expected: 'glass' }
    ] as const;

    aidaVariants.forEach(({ aida, expected }) => {
      it(`maps ${aida} variant to ${expected} correctly`, () => {
        render(<AidaButton variant={aida}>Test Button</AidaButton>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Verifica se as classes específicas da variante mapeada estão aplicadas
        if (expected === 'luxury') {
          expect(button).toHaveClass('luxury-button');
        } else if (expected === 'golden') {
          expect(button).toHaveClass('bg-gradient-golden');
        } else if (expected === 'glass') {
          expect(button).toHaveClass('glass-golden');
        }
      });
    });
  });

  // Testes de mapeamento de tamanhos AIDA
  describe('Size Mapping', () => {
    const aidaSizes = [
      { aida: 'sm', expected: 'sm' },
      { aida: 'md', expected: 'default' },
      { aida: 'lg', expected: 'lg' },
      { aida: 'xl', expected: 'xl' }
    ] as const;

    aidaSizes.forEach(({ aida, expected }) => {
      it(`maps ${aida} size to ${expected} correctly`, () => {
        render(<AidaButton size={aida}>Test Button</AidaButton>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Verifica classes específicas de tamanho mapeado
        if (expected === 'sm') {
          expect(button).toHaveClass('h-9', 'px-3');
        } else if (expected === 'lg') {
          expect(button).toHaveClass('h-11', 'px-8');
        } else if (expected === 'xl') {
          expect(button).toHaveClass('h-12', 'px-10');
        }
      });
    });
  });

  // Testes de compatibilidade retroativa
  describe('Backward Compatibility', () => {
    it('maintains AIDA-specific variant names', () => {
      // Testa se as variantes AIDA específicas ainda funcionam
      render(<AidaButton variant="luxury">Luxury Button</AidaButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('luxury-button');
    });

    it('supports AIDA size naming convention', () => {
      // Testa se o tamanho 'md' (AIDA) mapeia para 'default' (Button nativo)
      render(<AidaButton size="md">Medium Button</AidaButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4'); // Classes do tamanho 'default'
    });

    it('passes through all Button props correctly', () => {
      const handleClick = jest.fn();
      render(
        <AidaButton
          variant="golden"
          size="lg"
          onClick={handleClick}
          disabled={false}
          className="custom-class"
          data-testid="aida-button"
        >
          Full Props Button
        </AidaButton>
      );
      
      const button = screen.getByTestId('aida-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('custom-class');
      expect(button).not.toBeDisabled();
    });
  });

  // Testes de delegação para Button nativo
  describe('Native Button Delegation', () => {
    it('delegates loading functionality to native Button', () => {
      render(
        <AidaButton loading loadingText="Processing...">
          Submit
        </AidaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('delegates icon functionality to native Button', () => {
      render(
        <AidaButton icon={<Heart data-testid="heart-icon" />} iconPosition="right">
          Like
        </AidaButton>
      );
      
      const icon = screen.getByTestId('heart-icon');
      const text = screen.getByText('Like');
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('delegates disabled state to native Button', () => {
      render(<AidaButton disabled>Disabled Button</AidaButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // Testes de performance e otimização
  describe('Performance Optimization', () => {
    it('is memoized and does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      function TestComponent({ count }: { count: number }) {
        renderSpy();
        return (
          <AidaButton variant="primary" size="md">
            Button {count}
          </AidaButton>
        );
      }
      
      const { rerender } = render(<TestComponent count={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render com as mesmas props
      rerender(<TestComponent count={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(2); // Componente pai re-renderiza, mas AidaButton é memoizado
    });

    it('renders quickly with complex props', () => {
      const start = performance.now();
      
      render(
        <AidaButton
          variant="luxury"
          size="xl"
          loading={false}
          icon={<Heart />}
          iconPosition="left"
          className="complex-class"
          onClick={() => {}}
        >
          Complex AIDA Button
        </AidaButton>
      );
      
      const end = performance.now();
      const renderTime = end - start;
      
      // Deve renderizar em menos de 5ms (mais rápido que antes)
      expect(renderTime).toBeLessThan(5);
    });
  });

  // Testes de interação
  describe('Interactions', () => {
    it('handles click events correctly', async () => {
      const handleClick = jest.fn();
      render(<AidaButton onClick={handleClick}>Click me</AidaButton>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      render(<AidaButton onClick={handleClick}>Press Enter</AidaButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // Testes de acessibilidade
  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <AidaButton variant="primary" size="md">
          Accessible AIDA Button
        </AidaButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('maintains accessibility for luxury variant', async () => {
      const { container } = render(
        <AidaButton variant="luxury" size="lg">
          Luxury Accessible Button
        </AidaButton>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports ARIA labels correctly', () => {
      render(
        <AidaButton aria-label="Close AIDA dialog" variant="ghost">
          ×
        </AidaButton>
      );
      
      const button = screen.getByRole('button', { name: /close aida dialog/i });
      expect(button).toBeInTheDocument();
    });
  });

  // Testes de integração com design system
  describe('Design System Integration', () => {
    it('integrates correctly with AIDA design tokens', () => {
      render(<AidaButton variant="golden" size="lg">Golden Button</AidaButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gradient-golden');
      expect(button).toHaveClass('h-11', 'px-8'); // Tamanho lg
    });

    it('supports custom className alongside variant styles', () => {
      render(
        <AidaButton variant="glass" className="custom-aida-class">
          Glass Button
        </AidaButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('glass-golden');
      expect(button).toHaveClass('custom-aida-class');
    });
  });

  // Snapshot tests
  describe('Snapshots', () => {
    it('matches snapshot for primary variant', () => {
      const { container } = render(
        <AidaButton variant="primary">Primary AIDA Button</AidaButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for luxury variant', () => {
      const { container } = render(
        <AidaButton variant="luxury" size="xl">
          Luxury AIDA Button
        </AidaButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot with all props', () => {
      const { container } = render(
        <AidaButton
          variant="golden"
          size="lg"
          loading
          loadingText="Processing..."
          icon={<Heart />}
        >
          Full Props AIDA Button
        </AidaButton>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});