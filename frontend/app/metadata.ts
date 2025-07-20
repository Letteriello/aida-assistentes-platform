import type { Metadata, Viewport } from 'next'

// Configuração de viewport otimizada para todos os dispositivos
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ]
}

// Metadata base para SEO e compatibilidade
export const metadata: Metadata = {
  metadataBase: new URL('https://aida-platform.com'),
  title: {
    default: 'AIDA Platform - Assistentes Inteligentes de IA',
    template: '%s | AIDA Platform'
  },
  description: 'Plataforma avancada de assistentes de IA para automacao, produtividade e transformacao digital. Crie, gerencie e implemente assistentes inteligentes personalizados.',
  keywords: [
    'assistentes de IA',
    'inteligencia artificial',
    'automacao',
    'produtividade',
    'chatbots',
    'IA empresarial',
    'transformacao digital',
    'machine learning',
    'processamento de linguagem natural',
    'AIDA'
  ],
  authors: [{ name: 'AIDA Team' }],
  creator: 'AIDA Platform',
  publisher: 'AIDA Technologies',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AIDA Platform',
    startupImage: [
      {
        url: '/apple-touch-startup-image-768x1004.png',
        media: '(device-width: 768px) and (device-height: 1024px)'
      },
      {
        url: '/apple-touch-startup-image-1536x2008.png',
        media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)'
      }
    ]
  },
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/pt-br',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://aida-platform.com',
    title: 'AIDA Platform - Assistentes Inteligentes de IA',
    description: 'Plataforma avancada de assistentes de IA para automacao e produtividade empresarial.',
    siteName: 'AIDA Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AIDA Platform - Assistentes de IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIDA Platform - Assistentes Inteligentes de IA',
    description: 'Plataforma avancada de assistentes de IA para automacao e produtividade.',
    images: ['/twitter-image.png'],
    creator: '@aida_platform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'technology',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#0066FF',
    'msapplication-config': '/browserconfig.xml',
    'format-detection': 'telephone=no'
  }
}