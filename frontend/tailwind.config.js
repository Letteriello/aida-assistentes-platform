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
  				// AIDA Premium Color Scheme
  				primary: '#6366f1',
  				secondary: '#8b5cf6', 
  				accent: '#06b6d4',
  				success: '#10b981',
  				warning: '#f59e0b',
  				error: '#ef4444',
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
  			danger: {
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
  			golden: {
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
			'tech-blue': {
				'50': 'oklch(var(--tech-blue-50))',
				'100': 'oklch(var(--tech-blue-100))',
				'200': 'oklch(var(--tech-blue-200))',
				'300': 'oklch(var(--tech-blue-300))',
				'400': 'oklch(var(--tech-blue-400))',
				'500': 'oklch(var(--tech-blue-500))',
				'600': 'oklch(var(--tech-blue-600))',
				'700': 'oklch(var(--tech-blue-700))',
				'800': 'oklch(var(--tech-blue-800))',
				'900': 'oklch(var(--tech-blue-900))',
				DEFAULT: 'oklch(var(--tech-blue-500))'
			},
			'tech-dark': {
				'50': 'oklch(var(--tech-dark-50))',
				'100': 'oklch(var(--tech-dark-100))',
				'200': 'oklch(var(--tech-dark-200))',
				'300': 'oklch(var(--tech-dark-300))',
				'400': 'oklch(var(--tech-dark-400))',
				'500': 'oklch(var(--tech-dark-500))',
				'600': 'oklch(var(--tech-dark-600))',
				'700': 'oklch(var(--tech-dark-700))',
				'800': 'oklch(var(--tech-dark-800))',
				'900': 'oklch(var(--tech-dark-900))',
				DEFAULT: 'oklch(var(--tech-dark-800))'
			},
  			chart: {
  				'1': 'oklch(var(--chart-1))',
  				'2': 'oklch(var(--chart-2))',
  				'3': 'oklch(var(--chart-3))',
  				'4': 'oklch(var(--chart-4))',
  				'5': 'oklch(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'oklch(var(--sidebar))',
  				foreground: 'oklch(var(--sidebar-foreground))',
  				primary: 'oklch(var(--sidebar-primary))',
  				'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
  				accent: 'oklch(var(--sidebar-accent))',
  				'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
  				border: 'oklch(var(--sidebar-border))',
  				ring: 'oklch(var(--sidebar-ring))'
  			}
  		},
  		backgroundImage: {
  			'aida-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  			'aida-ai-gradient': 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
  			'premium-gradient': 'linear-gradient(135deg, #f59e0b, #f97316)',
  		},
  		boxShadow: {
  			'aida-soft': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  			'aida-premium': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  			'premium-glow': '0 0 20px rgb(99 102 241 / 0.3)',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
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
  					height: 0
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
  			'fade-in-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-right': {
  				'0%': {
  					transform: 'translateX(100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			'slide-in-left': {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'golden-pulse': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.8'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-10px)'
  				}
  			},
  			'prosperity-pulse': {
  				'0%, 100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'50%': {
  					transform: 'scale(1.05)',
  					opacity: '0.8'
  				}
  			},
  			'text-glow': {
  				'0%, 100%': {
  					'text-shadow': '0 0 5px rgba(245, 158, 11, 0.5)'
  				},
  				'50%': {
  					'text-shadow': '0 0 20px rgba(245, 158, 11, 0.8), 0 0 30px rgba(245, 158, 11, 0.6)'
  				}
  			},
  			'glow-rotate': {
  				'0%': {
  					transform: 'rotate(0deg)',
  					'box-shadow': '0 0 20px rgba(245, 158, 11, 0.5)'
  				},
  				'50%': {
  					'box-shadow': '0 0 40px rgba(245, 158, 11, 0.8)'
  				},
  				'100%': {
  					transform: 'rotate(360deg)',
  					'box-shadow': '0 0 20px rgba(245, 158, 11, 0.5)'
  				}
  			},
  			"pulse-aida": {
  				"0%, 100%": { opacity: 1 },
  				"50%": { opacity: .5 },
  			},
  			"slide-in": {
  				"0%": { transform: "translateX(-100%)" },
  				"100%": { transform: "translateX(0)" },
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.5s ease-out',
  			'fade-in-up': 'fade-in-up 0.5s ease-out',
  			'slide-in-right': 'slide-in-right 0.3s ease-out',
  			'slide-in-left': 'slide-in-left 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'golden-pulse': 'golden-pulse 2s ease-in-out infinite',
  			shimmer: 'shimmer 2s linear infinite',
  			float: 'float 3s ease-in-out infinite',
  			'prosperity-pulse': 'prosperity-pulse 2s ease-in-out infinite',
  			'text-glow': 'text-glow 2s ease-in-out infinite',
  			'glow-rotate': 'glow-rotate 3s linear infinite',
  			"pulse-aida": "pulse-aida 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  			"slide-in": "slide-in 0.3s ease-out"
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/container-queries'),
  ],
}