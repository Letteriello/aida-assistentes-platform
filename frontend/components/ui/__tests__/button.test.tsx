import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../button';
import { Loader2, Heart } from 'lucide-react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  // Teste de renderização básica
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  // Testes para todas as 9 variantes
  describe('Variants', () => {
    const variants = [
      'default', 'destructive', 'outline', 'secondary', 
      'ghost', 'link', 'luxury', 'golden', 'glass'
    ] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>Test Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Verifica se as classes específicas da variante estão aplicadas
        if (variant === 'luxury') {
          expect(button).toHaveClass('luxury-button');
        } else if (variant === 'golden') {
          expect(button).toHaveClass('bg-gradient-golden');
        } else if (variant === 'glass') {
          expect(button).toHaveClass('glass-golden');
        }
      });
    });
  });

  // Testes para tamanhos
  describe('Sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon', 'xl'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>Test Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Verifica classes específicas de tamanho
        if (size === 'sm') {
          expect(button).toHaveClass('h-9', 'px-3');
        } else if (size === 'lg') {
          expect(button).toHaveClass('h-11', 'px-8');
        } else if (size === 'icon') {
          expect(button).toHaveClass('h-10', 'w-10');
        } else if (size === 'xl') {
          expect(button).toHaveClass('h-12', 'px-10');
        }
      });
    });
  });

  // Testes de estado de loading
  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(
        <Button loading>
          Submit
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      // Verifica se o spinner está presente
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('shows custom loading text when provided', () => {
      render(
        <Button loading loadingText="Processing...">
          Submit
        </Button>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      render(
        <Button loading icon={<Heart data-testid="heart-icon" />}>
          Like
        </Button>
      );
      
      expect(screen.queryByTestId('heart-icon')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  // Testes de ícones
  describe('Icons', () => {
    it('renders icon on the left by default', () => {
      render(
        <Button icon={<Heart data-testid="heart-icon" />}>
          Like
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('heart-icon');
      const text = screen.getByText('Like');
      
      expect(icon).toBeInTheDocument();
      expect(text).toBeInTheDocument();
      
      // Verifica ordem dos elementos
      const buttonChildren = Array.from(button.children);
      const iconIndex = buttonChildren.findIndex(child => child.contains(icon));
      const textIndex = buttonChildren.findIndex(child => child.contains(text));
      
      expect(iconIndex).toBeLessThan(textIndex);
    });

    it('renders icon on the right when iconPosition is right', () => {
      render(
        <Button icon={<Heart data-testid="heart-icon" />} iconPosition="right">
          Like
        </Button>
      );
      
      const button = screen.getByRole('button');
      const icon = screen.getByTestId('heart-icon');
      const text = screen.getByText('Like');
      
      // Verifica ordem dos elementos
      const buttonChildren = Array.from(button.children);
      const iconIndex = buttonChildren.findIndex(child => child.contains(icon));
      const textIndex = buttonChildren.findIndex(child => child.contains(text));
      
      expect(textIndex).toBeLessThan(iconIndex);
    });
  });

  // Testes de estado disabled
  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('is disabled when loading is true', () => {
      render(<Button loading>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  // Testes de interação
  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Press Enter</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  // Testes de acessibilidade (WCAG 2.1 AA)
  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Button variant="default" size="default">
          Accessible Button
        </Button>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes for loading state', () => {
      render(
        <Button loading loadingText="Saving...">
          Save
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('maintains focus visibility', () => {
      render(<Button>Focus me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('supports screen readers with proper labels', () => {
      render(
        <Button aria-label="Close dialog">
          ×
        </Button>
      );
      
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });
  });

  // Testes de performance
  describe('Performance', () => {
    it('renders quickly with many props', () => {
      const start = performance.now();
      
      render(
        <Button
          variant="luxury"
          size="lg"
          loading={false}
          icon={<Heart />}
          iconPosition="left"
          className="custom-class"
          onClick={() => {}}
        >
          Complex Button
        </Button>
      );
      
      const end = performance.now();
      const renderTime = end - start;
      
      // Deve renderizar em menos de 10ms
      expect(renderTime).toBeLessThan(10);
    });
  });

  // Testes de integração com Radix UI
  describe('Radix UI Integration', () => {
    it('works with asChild prop', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      expect(link).toHaveClass('inline-flex', 'items-center');
    });
  });

  // Snapshot tests
  describe('Snapshots', () => {
    it('matches snapshot for default variant', () => {
      const { container } = render(
        <Button variant="default">Default Button</Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for luxury variant with icon', () => {
      const { container } = render(
        <Button variant="luxury" icon={<Heart />}>
          Luxury Button
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for loading state', () => {
      const { container } = render(
        <Button loading loadingText="Loading...">
          Submit
        </Button>
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});