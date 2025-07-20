/**
 * AIDA Platform - Test Utilities
 * Helper functions and setup for testing UI components
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/ui/theme-provider';

// Custom render function that includes providers
function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider defaultTheme="light" storageKey="aida-theme">
        {children}
      </ThemeProvider>
    ),
    ...options
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Setup user-event
export const setupUser = () => userEvent.setup();

// Mock IntersectionObserver
export function mockIntersectionObserver() {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  });
  
  window.IntersectionObserver = mockIntersectionObserver as any;
  
  return mockIntersectionObserver;
}

// Mock ResizeObserver
export function mockResizeObserver() {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  });
  
  window.ResizeObserver = mockResizeObserver as any;
  
  return mockResizeObserver;
}

// Mock window.matchMedia
export function mockMatchMedia(matches: boolean = true) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock Next.js router
export function mockNextRouter(pathname: string = '/') {
  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }),
    usePathname: () => pathname,
    useSearchParams: () => new URLSearchParams(),
  }));
}

// Mock Framer Motion
export function mockFramerMotion() {
  jest.mock('framer-motion', () => {
    const actual = jest.requireActual('framer-motion');
    return {
      ...actual,
      motion: {
        div: 'div',
        span: 'span',
        button: 'button',
        a: 'a',
        ul: 'ul',
        li: 'li',
        // Add more HTML elements as needed
      },
      AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
  });
}

// Create a custom matcher for accessibility testing
expect.extend({
  toBeAccessible(received) {
    const { axe } = require('jest-axe');
    
    return axe(received).then((results: any) => {
      const violations = results.violations;
      
      if (violations.length === 0) {
        return {
          message: () => 'Expected component to not be accessible, but it is',
          pass: true,
        };
      } else {
        return {
          message: () => `Expected component to be accessible, but found violations:\n${violations
            .map((v: any) => `${v.impact} - ${v.description}\n${v.nodes.map((n: any) => `  ${n.html}`).join('\n')}`)
            .join('\n\n')}`,
          pass: false,
        };
      }
    });
  },
});

// Mock window.scrollTo
export function mockScrollTo() {
  window.scrollTo = jest.fn();
}

// Mock localStorage
export function mockLocalStorage() {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: Object.keys(store).length,
      key: (index: number) => Object.keys(store)[index] || null,
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
}

// Create a test ID generator to avoid hardcoding test IDs
export function createTestId(component: string, element: string) {
  return `${component}-${element}`;
}

// Helper to wait for animations to complete
export function waitForAnimations() {
  return new Promise(resolve => setTimeout(resolve, 300));
}