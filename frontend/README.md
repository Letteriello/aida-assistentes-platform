# AIDA Platform - Frontend

## 🚀 Overview

The AIDA Platform frontend is a modern, responsive web application built with Next.js 14, providing an intuitive interface for managing AI-powered WhatsApp assistants.

## ✨ Features

- **🔐 WhatsApp Authentication**: Secure phone-based login system
- **📱 WhatsApp Integration**: QR code scanning and instance management
- **🤖 Assistant Configuration**: Intuitive forms for setting up AI assistants
- **📊 Dashboard**: Real-time analytics and usage monitoring
- **🎨 Modern UI**: Beautiful interface with Tailwind CSS and shadcn/ui
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile
- **⚡ Performance**: Optimized with Next.js 14 App Router

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query
- **Authentication**: Supabase Auth
- **Icons**: Lucide React + Remix Icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
frontend/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── login/           # Login page
│   │   └── register/        # Registration page
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── assistants/      # Assistant management
│   │   ├── conversations/   # Conversation history
│   │   ├── settings/        # User settings
│   │   └── analytics/       # Usage analytics
│   ├── api/                 # API routes
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # Reusable components
│   ├── ui/                  # shadcn/ui components
│   ├── forms/               # Form components
│   ├── dashboard/           # Dashboard-specific components
│   └── auth/                # Authentication components
├── lib/                     # Utilities and configurations
│   ├── supabase.ts          # Supabase client
│   ├── utils.ts             # Utility functions
│   └── validations.ts       # Zod schemas
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand stores
├── types/                   # TypeScript definitions
└── public/                  # Static assets
```

## 🎨 UI Components

### Available Components
- **Forms**: Input, Textarea, Select, Checkbox, Radio
- **Navigation**: Navbar, Sidebar, Breadcrumbs
- **Feedback**: Toast, Alert, Modal, Loading
- **Data Display**: Table, Card, Badge, Avatar
- **Layout**: Container, Grid, Flex, Spacer

### Component Usage
```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text" />
      <Button>Submit</Button>
    </Card>
  )
}
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript check

# Testing
npm run test             # Run tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report
```

### Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787

# Optional
NEXT_PUBLIC_APP_NAME=AIDA Assistentes
NEXT_PUBLIC_APP_DESCRIPTION=Plataforma de Assistentes IA
```

## 📱 Pages Overview

### Authentication
- **Login** (`/login`): Phone-based authentication
- **Register** (`/register`): New user registration

### Dashboard
- **Overview** (`/dashboard`): Main dashboard with metrics
- **Assistants** (`/dashboard/assistants`): Manage AI assistants
- **Conversations** (`/dashboard/conversations`): View chat history
- **Settings** (`/dashboard/settings`): User preferences
- **Analytics** (`/dashboard/analytics`): Usage statistics

### WhatsApp Integration
- **Connect** (`/dashboard/whatsapp/connect`): QR code scanning
- **Instances** (`/dashboard/whatsapp/instances`): Manage instances

## 🎯 Key Features

### WhatsApp Authentication
```tsx
// Phone number input with validation
const { register, handleSubmit } = useForm({
  resolver: zodResolver(phoneSchema)
})

const onSubmit = async (data) => {
  await sendVerificationCode(data.phone)
}
```

### Assistant Configuration
```tsx
// Structured form for assistant setup
const assistantForm = {
  businessInfo: { name, type, description },
  products: [{ name, price, description }],
  personality: { tone, style, instructions }
}
```

### Real-time Updates
```tsx
// Using TanStack Query for real-time data
const { data: conversations } = useQuery({
  queryKey: ['conversations'],
  queryFn: fetchConversations,
  refetchInterval: 5000
})
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Configure environment variables**
3. **Deploy automatically on push**

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

### Unit Tests
```bash
# Run component tests
npm run test

# Watch mode
npm run test -- --watch
```

### E2E Tests
```bash
# Run Playwright tests
npm run test:e2e

# Run in headed mode
npm run test:e2e -- --headed
```

## 📊 Performance

### Optimization Features
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Bundle Analysis**: Built-in bundle analyzer
- **Caching**: Aggressive caching strategies
- **Lazy Loading**: Component and route lazy loading

### Performance Monitoring
```bash
# Analyze bundle size
npm run build -- --analyze

# Lighthouse audit
npm run lighthouse
```

## 🔒 Security

- **CSP Headers**: Content Security Policy
- **HTTPS Only**: Secure connections only
- **Input Validation**: Zod schema validation
- **XSS Protection**: Built-in Next.js protection
- **CSRF Protection**: Token-based protection

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**AIDA Platform Frontend** - Beautiful interfaces for AI assistants 🎨