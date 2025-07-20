/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: {
  			DEFAULT: '1rem',
  			sm: '2rem',
  			lg: '4rem',
  			xl: '5rem',
  			'2xl': '6rem',
  		},
  		screens: {
  			sm: '640px',
  			md: '768px',
  			lg: '1024px',
  			xl: '1280px',
  			'2xl': '1400px'
  		}
  	},
  	screens: {
  		// Mobile first approach
  		xs: '475px',
  		sm: '640px',
  		md: '768px',
  		lg: '1024px',
  		xl: '1280px',
  		'2xl': '1536px',
  		// Custom breakpoints para dispositivos específicos
  		'mobile-s': '320px',
  		'mobile-m': '375px',
  		'mobile-l': '425px',
  		'tablet': '768px',
  		'laptop': '1024px',
  		'laptop-l': '1440px',
  		'desktop': '1920px',
  		// Breakpoints para orientação
  		'portrait': {'raw': '(orientation: portrait)'},
  		'landscape': {'raw': '(orientation: landscape)'},
  		// Breakpoints para densidade de pixels
  		'retina': {'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'},
  		// Breakpoints para preferências do usuário
  		'motion-safe': {'raw': '(prefers-reduced-motion: no-preference)'},
  		'motion-reduce': {'raw': '(prefers-reduced-motion: reduce)'},
  		'dark': {'raw': '(prefers-color-scheme: dark)'},
  		'light': {'raw': '(prefers-color-scheme: light)'},
  	},
  	extend: {
  		colors: {
  			border: 'oklch(var(--border))',
  			input: 'oklch(var(--input))',
  			ring: 'oklch(var(--ring))',
  			background: 'oklch(var(--background))',
  			foreground: 'oklch(var(--foreground))',
  			'tech-slate': {
  				'800': '#1e293b',
  				'900': '#0f172a'
  			},
  			'tech-zinc': {
  				'800': '#27272a',
  				'900': '#18181b'
  			},
  			primary: {
  				DEFAULT: 'oklch(var(--primary))',
  				foreground: 'oklch(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'oklch(var(--secondary))',
  				foreground: 'oklch(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'oklch(var(--destructive))',
  				foreground: 'oklch(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'oklch(var(--muted))',
  				foreground: 'oklch(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'oklch(var(--accent))',
  				foreground: 'oklch(var(--accent-foreground))',
  				cyan: {
  					'500': '#06b6d4'
  				},
  				lime: {
  					'500': '#84cc16'
  				},
  				orange: {
  					'500': '#f97316'
  				},
  				purple: {
  					'500': '#a855f7'
  				}
  			},
  			popover: {
  				DEFAULT: 'oklch(var(--popover))',
  				foreground: 'oklch(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'oklch(var(--card))',
  				foreground: 'oklch(var(--card-foreground))'
  			},
  			text: {
  				primary: '#111827',
  				secondary: '#6B7280',
  				muted: '#9CA3AF',
  				inverse: '#F9FAFB',
  				'on-gold': '#1F2937',
  				'on-dark': '#F9FAFB'
  			},
  			aida: {
  				gold: {
  					'50': '#FFFBEB',
  					'100': '#FEF3C7',
  					'200': '#FDE68A',
  					'300': '#FCD34D',
  					'400': '#FBBF24',
  					'500': '#F59E0B',
  					'600': '#D97706',
  					'700': '#B45309',
  					'800': '#92400E',
  					'900': '#78350F',
  					'950': '#451A03'
  				},
  				amber: {
  					'50': '#FFFBEB',
  					'100': '#FEF3C7',
  					'200': '#FDE68A',
  					'300': '#FCD34D',
  					'400': '#FBBF24',
  					'500': '#F59E0B',
  					'600': '#D97706',
  					'700': '#B45309',
  					'800': '#92400E',
  					'900': '#78350F'
  				},
  				honey: {
  					'50': '#FFF7ED',
  					'100': '#FFEDD5',
  					'200': '#FED7AA',
  					'300': '#FDBA74',
  					'400': '#FB923C',
  					'500': '#F97316',
  					'600': '#EA580C',
  					'700': '#C2410C',
  					'800': '#9A3412',
  					'900': '#7C2D12'
  				},
  				bronze: {
  					'50': '#FDF4FF',
  					'100': '#FAE8FF',
  					'200': '#F5D0FE',
  					'300': '#F0ABFC',
  					'400': '#E879F9',
  					'500': '#D946EF',
  					'600': '#C026D3',
  					'700': '#A21CAF',
  					'800': '#86198F',
  					'900': '#701A75'
  				},
  				neutral: {
  					'50': '#F8F9FA',
  					'100': '#F1F3F4',
  					'200': '#E8EAED',
  					'300': '#DADCE0',
  					'400': '#BDC1C6',
  					'500': '#9AA0A6',
  					'600': '#80868B',
  					'700': '#5F6368',
  					'800': '#3C4043',
  					'900': '#202124'
  				}
  			},
  			success: {
  				'50': '#ECFDF5',
  				'100': '#D1FAE5',
  				'200': '#A7F3D0',
  				'300': '#6EE7B7',
  				'400': '#34D399',
  				'500': '#10B981',
  				'600': '#059669',
  				'700': '#047857',
  				'800': '#065F46',
  				'900': '#064E3B',
  				DEFAULT: '#059669'
  			},
  			warning: {
  				'50': '#FFFBEB',
  				'100': '#FEF3C7',
  				'200': '#FDE68A',
  				'300': '#FCD34D',
  				'400': '#FBBF24',
  				'500': '#F59E0B',
  				'600': '#D97706',
  				'700': '#B45309',
  				'800': '#92400E',
  				'900': '#78350F',
  				DEFAULT: '#D97706'
  			},
  			error: {
  				'50': '#FEF2F2',
  				'100': '#FEE2E2',
  				'200': '#FECACA',
  				'300': '#FCA5A5',
  				'400': '#F87171',
  				'500': '#EF4444',
  				'600': '#DC2626',
  				'700': '#B91C1C',
  				'800': '#991B1B',
  				'900': '#7F1D1D',
  				DEFAULT: '#DC2626'
  			},
  			info: {
  				'50': '#EFF6FF',
  				'100': '#DBEAFE',
  				'200': '#BFDBFE',
  				'300': '#93C5FD',
  				'400': '#60A5FA',
  				'500': '#3B82F6',
  				'600': '#2563EB',
  				'700': '#1D4ED8',
  				'800': '#1E40AF',
  				'900': '#1E3A8A',
  				DEFAULT: '#2563EB'
  			},
  			gray: {
  				'50': '#F9FAFB',
  				'100': '#F3F4F6',
  				'200': '#E5E7EB',
  				'300': '#D1D5DB',
  				'400': '#9CA3AF',
  				'500': '#6B7280',
  				'600': '#4B5563',
  				'700': '#374151',
  				'800': '#1F2937',
  				'900': '#111827'
  			},
  			white: '#FFFFFF',
  			black: '#000000',
  			transparent: 'transparent',
  			current: 'currentColor'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-out': {
  				'0%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				},
  				'100%': {
  					opacity: '0',
  					transform: 'translateY(-10px)'
  				}
  			},
  			'slide-in-from-top': {
  				'0%': {
  					transform: 'translateY(-100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-from-bottom': {
  				'0%': {
  					transform: 'translateY(100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-from-left': {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			'slide-in-from-right': {
  				'0%': {
  					transform: 'translateX(100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			'pulse-slow': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.5'
  				}
  			},
  			'bounce-gentle': {
  				'0%, 100%': {
  					transform: 'translateY(0)',
  					'animation-timing-function': 'cubic-bezier(0.8, 0, 1, 1)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)',
  					'animation-timing-function': 'cubic-bezier(0, 0, 0.2, 1)'
  				}
  			},
  			'shimmer': {
  				'0%': {
  					'background-position': '-200% 0'
  				},
  				'100%': {
  					'background-position': '200% 0'
  				}
  			},
  			'glow': {
  				'0%, 100%': {
  					'box-shadow': '0 0 5px rgba(59, 130, 246, 0.5)'
  				},
  				'50%': {
  					'box-shadow': '0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.5s ease-out',
  			'fade-out': 'fade-out 0.3s ease-in',
  			'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
  			'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
  			'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
  			'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
  			'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'bounce-gentle': 'bounce-gentle 2s infinite',
  			'shimmer': 'shimmer 2s linear infinite',
  			'glow': 'glow 2s ease-in-out infinite alternate'
  		},
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  			mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  			heading: ['Inter', 'system-ui', 'sans-serif']
  		},
  		fontSize: {
  			'xs': ['0.75rem', { lineHeight: '1rem' }],
  			'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  			'base': ['1rem', { lineHeight: '1.5rem' }],
  			'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  			'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  			'2xl': ['1.5rem', { lineHeight: '2rem' }],
  			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  			'5xl': ['3rem', { lineHeight: '1' }],
  			'6xl': ['3.75rem', { lineHeight: '1' }],
  			'7xl': ['4.5rem', { lineHeight: '1' }],
  			'8xl': ['6rem', { lineHeight: '1' }],
  			'9xl': ['8rem', { lineHeight: '1' }]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  			'144': '36rem'
  		},
  		boxShadow: {
  			'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  			'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  			'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
  			'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
  			'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}