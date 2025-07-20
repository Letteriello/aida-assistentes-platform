import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../input';
import { Search, Mail, Eye, EyeOff } from 'lucide-react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Input Component', () => {
  describe('Basic Functionality', () => {
    it('renders correctly with default props', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('h-9'); // default size
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('accepts and displays value', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);
      const input = screen.getByPlaceholderText('Type here');
      
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('handles onChange events', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalledTimes(4);
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Input variant="default" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border', 'border-input', 'bg-transparent');
    });

    it('applies filled variant styles', () => {
      render(<Input variant="filled" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-0', 'bg-muted/50');
    });

    it('applies underline variant styles', () => {
      render(<Input variant="underline" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-0', 'border-b', 'rounded-none');
    });

    it('applies minimal variant styles', () => {
      render(<Input variant="minimal" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-0', 'bg-transparent');
    });
  });

  describe('Sizes', () => {
    it('applies small size styles', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-8', 'text-xs');
    });

    it('applies medium size styles (default)', () => {
      render(<Input size="md" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-9', 'text-sm');
    });

    it('applies large size styles', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-11', 'text-base');
    });
  });

  describe('States', () => {
    it('applies error state styles', () => {
      render(<Input state="error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
    });

    it('applies success state styles', () => {
      render(<Input state="success" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-green-500');
    });

    it('applies warning state styles', () => {
      render(<Input state="warning" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-yellow-500');
    });
  });

  describe('Enhanced Features', () => {
    it('renders with leading icon', () => {
      render(
        <Input 
          leadingIcon={<Search data-testid="search-icon" />} 
          placeholder="Search..."
        />
      );
      
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Search...');
      expect(input).toHaveClass('pl-10');
    });

    it('renders with trailing icon', () => {
      render(
        <Input 
          trailingIcon={<Eye data-testid="eye-icon" />} 
          placeholder="Password"
        />
      );
      
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveClass('pr-10');
    });

    it('renders with both leading and trailing icons', () => {
      render(
        <Input 
          leadingIcon={<Mail data-testid="mail-icon" />}
          trailingIcon={<Eye data-testid="eye-icon" />} 
          placeholder="Email"
        />
      );
      
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveClass('pl-10', 'pr-10');
    });

    it('renders helper text', () => {
      render(<Input helperText="This is helper text" />);
      expect(screen.getByText('This is helper text')).toBeInTheDocument();
      expect(screen.getByText('This is helper text')).toHaveClass('text-xs', 'text-muted-foreground');
    });

    it('renders error message', () => {
      render(<Input errorMessage="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toHaveClass('text-xs', 'text-destructive');
    });

    it('prioritizes error message over helper text', () => {
      render(
        <Input 
          helperText="Helper text" 
          errorMessage="Error message"
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <Input 
          aria-label="Test input"
          helperText="Helper text"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates helper text with input via aria-describedby', () => {
      render(<Input helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('Helper text');
      
      expect(input).toHaveAttribute('aria-describedby');
      expect(input.getAttribute('aria-describedby')).toContain(helperText.id);
    });

    it('associates error message with input via aria-describedby', () => {
      render(<Input errorMessage="Error message" />);
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByText('Error message');
      
      expect(input).toHaveAttribute('aria-describedby');
      expect(input.getAttribute('aria-describedby')).toContain(errorMessage.id);
    });

    it('sets aria-invalid when error message is present', () => {
      render(<Input errorMessage="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('combines multiple aria-describedby values', () => {
      render(
        <Input 
          helperText="Helper text"
          errorMessage="Error message"
          aria-describedby="external-description"
        />
      );
      const input = screen.getByRole('textbox');
      const ariaDescribedBy = input.getAttribute('aria-describedby');
      
      expect(ariaDescribedBy).toContain('external-description');
    });
  });

  describe('Input Types', () => {
    it('handles search input type', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('handles email input type', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('handles password input type', () => {
      render(<Input type="password" />);
      const input = screen.getByLabelText(/password/i) || screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('handles file input type', () => {
      render(<Input type="file" />);
      const input = screen.getByRole('textbox') || screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'file');
    });
  });

  describe('Backward Compatibility', () => {
    it('maintains backward compatibility with simple usage', () => {
      render(<Input className="custom-class" placeholder="Test" />);
      const input = screen.getByPlaceholderText('Test');
      
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveAttribute('data-slot', 'input');
    });

    it('works without enhanced features', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      
      expect(input).toBeInTheDocument();
      expect(container.querySelector('.space-y-1')).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('can be focused programmatically', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('applies disabled styles and behavior', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('prevents interaction when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});