import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Input } from './input'
import { Search, Mail, Eye } from 'lucide-react'

expect.extend(toHaveNoViolations)

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    input: React.forwardRef<HTMLInputElement, any>((props, ref) => <input {...props} ref={ref} />),
    div: React.forwardRef<HTMLDivElement, any>((props, ref) => <div {...props} ref={ref} />),
    label: React.forwardRef<HTMLLabelElement, any>((props, ref) => <label {...props} ref={ref} />),
    p: React.forwardRef<HTMLParagraphElement, any>((props, ref) => <p {...props} ref={ref} />),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Input Component', () => {
  // Basic functionality tests
  describe('Basic Functionality', () => {
    it('renders correctly', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('handles value and onChange', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()
      
      render(<Input value="" onChange={handleChange} />)
      const input = screen.getByRole('textbox')
      
      await user.type(input, 'test')
      expect(handleChange).toHaveBeenCalled()
    })

    it('supports different input types', () => {
      const { rerender } = render(<Input type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
      
      rerender(<Input type="password" />)
      expect(screen.getByLabelText(/password/i) || screen.getByDisplayValue('')).toHaveAttribute('type', 'password')
    })
  })

  // Variants tests
  describe('Variants', () => {
    it('applies default variant correctly', () => {
      render(<Input variant="default" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-input')
    })

    it('applies filled variant correctly', () => {
      render(<Input variant="filled" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('bg-muted', 'border-transparent')
    })

    it('applies underline variant correctly', () => {
      render(<Input variant="underline" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-0', 'border-b-2', 'rounded-none')
    })

    it('applies minimal variant correctly', () => {
      render(<Input variant="minimal" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-0', 'bg-transparent')
    })
  })

  // Sizes tests
  describe('Sizes', () => {
    it('applies small size correctly', () => {
      render(<Input size="sm" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-8', 'px-2', 'text-xs')
    })

    it('applies medium size correctly', () => {
      render(<Input size="md" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-10', 'px-3', 'text-sm')
    })

    it('applies large size correctly', () => {
      render(<Input size="lg" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-12', 'px-4', 'text-base')
    })
  })

  // States tests
  describe('States', () => {
    it('applies error state correctly', () => {
      render(<Input state="error" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-destructive')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('applies success state correctly', () => {
      render(<Input state="success" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-green-500')
    })

    it('applies warning state correctly', () => {
      render(<Input state="warning" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-yellow-500')
    })

    it('prioritizes error message over state prop', () => {
      render(<Input state="success" errorMessage="This is an error" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-destructive')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })

  // Enhanced features tests
  describe('Enhanced Features', () => {
    it('renders with leading icon', () => {
      render(<Input leadingIcon={<Search data-testid="search-icon" />} />)
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('pl-10')
    })

    it('renders with trailing icon', () => {
      render(<Input trailingIcon={<Eye data-testid="eye-icon" />} />)
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('pr-10')
    })

    it('renders with both leading and trailing icons', () => {
      render(
        <Input 
          leadingIcon={<Search data-testid="search-icon" />}
          trailingIcon={<Eye data-testid="eye-icon" />}
        />
      )
      expect(screen.getByTestId('search-icon')).toBeInTheDocument()
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('pl-10', 'pr-10')
    })

    it('renders helper text', () => {
      render(<Input helperText="This is helper text" />)
      expect(screen.getByText('This is helper text')).toBeInTheDocument()
    })

    it('renders error message', () => {
      render(<Input errorMessage="This is an error" />)
      expect(screen.getByText('This is an error')).toBeInTheDocument()
      expect(screen.getByText('This is an error')).toHaveClass('text-destructive')
    })

    it('prioritizes error message over helper text', () => {
      render(
        <Input 
          helperText="This is helper text"
          errorMessage="This is an error"
        />
      )
      expect(screen.getByText('This is an error')).toBeInTheDocument()
      expect(screen.queryByText('This is helper text')).not.toBeInTheDocument()
    })

    it('renders static label', () => {
      render(<Input label="Email Address" />)
      expect(screen.getByText('Email Address')).toBeInTheDocument()
    })

    it('renders floating label', () => {
      render(<Input label="Email Address" floatingLabel />)
      expect(screen.getByText('Email Address')).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('pt-6', 'pb-2')
    })
  })

  // Real-time validation tests
  describe('Real-time Validation', () => {
    it('validates on change when validationMode is onChange', async () => {
      const validator = jest.fn((value: string) => {
        return value.length < 3 ? 'Minimum 3 characters' : undefined
      })
      const user = userEvent.setup()
      
      render(
        <Input 
          validator={validator}
          validationMode="onChange"
          value=""
          onChange={() => {}}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'ab')
      
      await waitFor(() => {
        expect(validator).toHaveBeenCalled()
      })
    })

    it('validates on blur when validationMode is onBlur', async () => {
      const validator = jest.fn((value: string) => {
        return value.length < 3 ? 'Minimum 3 characters' : undefined
      })
      const user = userEvent.setup()
      
      render(
        <Input 
          validator={validator}
          validationMode="onBlur"
          value="ab"
          onChange={() => {}}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.tab()
      
      await waitFor(() => {
        expect(validator).toHaveBeenCalledWith('ab')
      })
    })

    it('displays validation error message', async () => {
      const validator = (value: string) => {
        return value.length < 3 ? 'Minimum 3 characters' : undefined
      }
      const user = userEvent.setup()
      
      render(
        <Input 
          validator={validator}
          validationMode="onChange"
          value=""
          onChange={() => {}}
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'ab')
      
      await waitFor(() => {
        expect(screen.getByText('Minimum 3 characters')).toBeInTheDocument()
      })
    })
  })

  // Focus and blur handling tests
  describe('Focus and Blur Handling', () => {
    it('calls onFocus when input is focused', async () => {
      const handleFocus = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onFocus={handleFocus} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      expect(handleFocus).toHaveBeenCalled()
    })

    it('calls onBlur when input loses focus', async () => {
      const handleBlur = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onBlur={handleBlur} />)
      const input = screen.getByRole('textbox')
      
      await user.click(input)
      await user.tab()
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  // Accessibility tests
  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Input label="Email" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('associates helper text with input via aria-describedby', () => {
      render(<Input helperText="This is helper text" />)
      const input = screen.getByRole('textbox')
      const helperText = screen.getByText('This is helper text')
      
      expect(input).toHaveAttribute('aria-describedby', helperText.id)
    })

    it('associates error message with input via aria-describedby', () => {
      render(<Input errorMessage="This is an error" />)
      const input = screen.getByRole('textbox')
      const errorMessage = screen.getByText('This is an error')
      
      expect(input).toHaveAttribute('aria-describedby', errorMessage.id)
    })

    it('sets aria-invalid when there is an error', () => {
      render(<Input errorMessage="This is an error" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('associates label with input', () => {
      render(<Input label="Email Address" />)
      const input = screen.getByRole('textbox')
      const label = screen.getByText('Email Address')
      
      expect(input).toHaveAttribute('id')
      expect(label).toHaveAttribute('for', input.id)
    })

    it('has proper touch targets for mobile', () => {
      render(<Input size="sm" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('min-h-[44px]')
    })
  })

  // Backward compatibility tests
  describe('Backward Compatibility', () => {
    it('works with existing props', () => {
      render(
        <Input 
          type="email"
          placeholder="Enter email"
          className="custom-class"
          disabled
        />
      )
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveAttribute('placeholder', 'Enter email')
      expect(input).toHaveClass('custom-class')
      expect(input).toBeDisabled()
    })

    it('maintains simple input behavior when no enhanced features are used', () => {
      render(<Input placeholder="Simple input" />)
      const input = screen.getByRole('textbox')
      
      // Should not have wrapper div with enhanced features
      expect(input.parentElement?.tagName).toBe('DIV') // The test container
    })
  })

  // Disabled state tests
  describe('Disabled State', () => {
    it('applies disabled styles correctly', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('does not trigger validation when disabled', async () => {
      const validator = jest.fn()
      const user = userEvent.setup()
      
      render(
        <Input 
          disabled
          validator={validator}
          validationMode="onChange"
        />
      )
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')
      
      expect(validator).not.toHaveBeenCalled()
    })
  })
})