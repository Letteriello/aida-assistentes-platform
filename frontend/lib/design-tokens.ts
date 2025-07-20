/**
 * AIDA Platform Design Tokens - Origin UI System
 * Technology-themed color palette with WCAG 2.1 AA compliance
 * Based on 60-30-10 color rule and modern UI/UX trends 2025
 */

export const designTokens = {
  // === Core Technology Color Palette ===
  colors: {
    // Primary Colors - Technology & Trust (60%)
    primary: {
      50: '#f0f9ff',   // Ice blue
      100: '#e0f2fe',  // Very light blue
      200: '#bae6fd',  // Light blue
      300: '#7dd3fc',  // Medium light blue
      400: '#38bdf8',  // Medium blue
      500: '#0ea5e9',  // Base blue
      600: '#0284c7',  // Electric blue - Main action color
      700: '#0369a1',  // Dark blue
      800: '#075985',  // Darker blue
      900: '#0c4a6e',  // Deep navy
      950: '#0f172a',  // Deepest navy - Backgrounds
    },

    // Secondary Colors - Professionalism (30%)
    secondary: {
      50: '#f8fafc',   // Almost white
      100: '#f1f5f9',  // Very light gray
      200: '#e2e8f0',  // Light gray
      300: '#cbd5e1',  // Medium light gray
      400: '#94a3b8',  // Silver - Borders & secondary text
      500: '#64748b',  // Medium gray
      600: '#475569',  // Dark gray
      700: '#334155',  // Darker gray
      800: '#1e293b',  // Charcoal - Text
      900: '#0f172a',  // Deep slate
    },

    // Accent Colors - AI Status & Actions (10%)
    accent: {
      cyan: {
        50: '#ecfeff',
        500: '#06b6d4', // AI Active - Bright cyan
        600: '#0891b2',
        700: '#0e7490',
      },
      lime: {
        50: '#f7fee7',
        500: '#84cc16', // Success States - Vibrant lime
        600: '#65a30d',
        700: '#4d7c0f',
      },
      orange: {
        50: '#fff7ed',
        500: '#f97316', // Warnings - Vibrant orange
        600: '#ea580c',
        700: '#c2410c',
      },
      purple: {
        50: '#faf5ff',
        500: '#8b5cf6', // Premium Features - Rich purple
        600: '#7c3aed',
        700: '#6d28d9',
      },
    },

    // Semantic Colors
    semantic: {
      success: {
        50: '#f0fdf4',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
      },
      warning: {
        50: '#fffbeb',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
      },
      error: {
        50: '#fef2f2',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
      },
      info: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },

    // Background Colors for Technology Theme
    background: {
      primary: '#ffffff',      // Pure white
      secondary: '#f8fafc',    // Subtle gray
      tertiary: '#f1f5f9',     // Light gray
      dark: '#0f172a',         // Deep navy
      'dark-secondary': '#1e293b', // Dark gray
      'glass': 'rgba(248, 250, 252, 0.8)', // Glassmorphism
    },

    // Text Colors with High Contrast
    text: {
      primary: '#0f172a',      // Deep navy - 4.5:1 contrast
      secondary: '#475569',    // Dark gray - 4.5:1 contrast  
      tertiary: '#64748b',     // Medium gray - 4.5:1 contrast
      inverse: '#f8fafc',      // Light on dark
      'on-primary': '#ffffff', // White on primary
      'on-accent': '#ffffff',  // White on accents
    },
  },

  // === Typography Scale ===
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px
      'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px
      'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
      '5xl': ['3rem', { lineHeight: '1' }],          // 48px
      '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // === Spacing System (8px base) ===
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
  },

  // === Border Radius ===
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // === Shadow System ===
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
    // Technology-specific shadows
    'tech-glow': '0 0 20px rgb(6 182 212 / 0.3)', // Cyan glow
    'primary-glow': '0 0 20px rgb(59 130 246 / 0.3)', // Blue glow
    'glass': '0 8px 32px 0 rgb(31 38 135 / 0.37)', // Glassmorphism
  },

  // === Animation Easing ===
  easing: {
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // === Breakpoints ===
  screens: {
    sm: '640px',   // Mobile landscape
    md: '768px',   // Tablet
    lg: '1024px',  // Desktop
    xl: '1280px',  // Large desktop
    '2xl': '1536px', // Very large desktop
  },

  // === Z-Index Scale ===
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    popover: '1050',
    tooltip: '1060',
    toast: '1070',
  },

  // === Component Variants ===
  variants: {
    button: {
      sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
      variants: ['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
    },
    card: {
      variants: ['default', 'outlined', 'filled', 'glass'],
      elevations: ['flat', 'sm', 'md', 'lg', 'xl'],
    },
    input: {
      sizes: ['sm', 'md', 'lg'],
      variants: ['default', 'filled', 'outline'],
    },
  },
} as const;

// === CSS Custom Properties for Dynamic Theming ===
export const cssVariables = {
  light: {
    '--primary': '2 132 199',        // primary-600
    '--primary-foreground': '248 250 252',
    '--secondary': '148 163 184',    // secondary-400  
    '--secondary-foreground': '15 23 42',
    '--accent': '6 182 212',         // accent cyan
    '--accent-foreground': '248 250 252',
    '--background': '255 255 255',
    '--foreground': '15 23 42',
    '--card': '255 255 255',
    '--card-foreground': '15 23 42',
    '--border': '226 232 240',
    '--input': '226 232 240',
    '--ring': '59 130 246',
    '--radius': '0.5rem',
  },
  dark: {
    '--primary': '59 130 246',       // primary-500 
    '--primary-foreground': '15 23 42',
    '--secondary': '71 85 105',      // secondary-600
    '--secondary-foreground': '248 250 252', 
    '--accent': '6 182 212',         // accent cyan
    '--accent-foreground': '15 23 42',
    '--background': '15 23 42',      // Deep navy
    '--foreground': '248 250 252',
    '--card': '30 41 59',            // Dark gray
    '--card-foreground': '248 250 252',
    '--border': '51 65 85',
    '--input': '51 65 85',
    '--ring': '59 130 246',
    '--radius': '0.5rem',
  },
};

// === Utility Functions ===
export const getColorValue = (path: string): string => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '';
};

export const getSpacingValue = (key: string): string => {
  return designTokens.spacing[key as keyof typeof designTokens.spacing] || '0';
};

export const getFontSize = (size: string): [string, { lineHeight: string }] => {
  return designTokens.typography.fontSize[size as keyof typeof designTokens.typography.fontSize] || ['1rem', { lineHeight: '1.5rem' }];
};

export type DesignTokens = typeof designTokens;
export type ColorPath = keyof typeof designTokens.colors;
export type SpacingKey = keyof typeof designTokens.spacing;
export type FontSizeKey = keyof typeof designTokens.typography.fontSize;