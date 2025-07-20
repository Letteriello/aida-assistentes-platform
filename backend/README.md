# AIDA Platform - Backend

## 🚀 Overview

The AIDA Platform backend is a robust, scalable system built for managing AI-powered WhatsApp assistants. It provides a comprehensive API for authentication, assistant management, conversation handling, and advanced RAG (Retrieval Augmented Generation) capabilities.

## ✨ Features

- **🔐 WhatsApp Authentication**: Secure phone-based authentication system
- **🤖 Assistant Management**: Create and configure AI assistants with custom personalities
- **💬 Conversation Handling**: Real-time message processing with Evolution API integration
- **🧠 Hybrid RAG System**: Combines vector search and knowledge graphs for intelligent responses
- **📊 Analytics**: Comprehensive usage tracking and performance metrics
- **🔒 Multi-tenant Security**: Complete data isolation between organizations
- **⚡ High Performance**: Optimized for low latency and high concurrency

## 🏗️ Architecture

### Core Services
- **Authentication Service**: WhatsApp-based user verification
- **Assistant Service**: AI assistant configuration and management
- **Conversation Service**: Message processing and response generation
- **RAG Engine**: Hybrid search combining vectors and knowledge graphs
- **Evolution API Integration**: WhatsApp Business API management

### Data Layer
- **Supabase PostgreSQL**: Primary database with vector extensions
- **Neo4j**: Knowledge graph for complex relationship queries
- **Redis**: Caching and session management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Evolution API instance
- OpenAI API key

### Installation

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

3. **Start development server**
```bash
# For MVP Express server
npm run dev:mvp

# For Cloudflare Workers (production)
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/                   # API route handlers
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── assistants.ts     # Assistant management
│   │   ├── conversations.ts  # Conversation handling
│   │   └── webhooks.ts       # Webhook endpoints
│   ├── services/             # Business logic
│   │   ├── auth/             # Authentication services
│   │   ├── assistants/       # Assistant management
│   │   ├── conversations/    # Message processing
│   │   ├── rag/              # RAG engine
│   │   └── evolution-api/    # WhatsApp integration
│   ├── database/             # Database utilities
│   │   ├── supabase.ts       # Supabase client
│   │   ├── neo4j.ts          # Neo4j driver
│   │   └── migrations/       # Database migrations
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utility functions
├── tests/                    # Test suites
├── scripts/                  # Development scripts
├── wrangler.toml            # Cloudflare Workers config
└── package.json             # Dependencies and scripts
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev:mvp          # Start MVP Express server
npm run dev              # Start Cloudflare Workers dev
npm run build            # Build for production

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # TypeScript check
```

### Environment Variables

See `.env.example` for all required environment variables. Key configurations:

- **Supabase**: Database and authentication
- **Evolution API**: WhatsApp integration
- **OpenAI**: AI model access
- **Neo4j**: Knowledge graph database

## 🧪 Testing

### Test Structure
```bash
tests/
├── unit/                # Unit tests
├── integration/         # Integration tests
├── e2e/                # End-to-end tests
└── fixtures/           # Test data
```

### Running Tests
```bash
# All tests
npm run test:all

# Specific test suites
npm run test:auth
npm run test:assistants
npm run test:conversations

# Load testing
npm run test:load

# Security testing
npm run test:security
```

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Cloudflare resources created
- [ ] Evolution API configured
- [ ] Monitoring setup

### Cloudflare Workers Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### MVP Express Server Deployment

```bash
# Build for production
npm run build:mvp

# Start production server
npm run start:mvp
```

## 📊 Monitoring

### Health Checks
```bash
# Check service health
curl http://localhost:8787/health

# MVP server health
curl http://localhost:3000/health
```

### Logging
```bash
# View logs (Cloudflare)
npm run logs

# Production logs
npm run logs:production
```

## 🔒 Security

- **Authentication**: JWT-based with WhatsApp verification
- **Authorization**: Role-based access control
- **Data Encryption**: End-to-end encryption for sensitive data
- **Rate Limiting**: Configurable rate limits per endpoint
- **Input Validation**: Zod schema validation
- **CORS**: Configured for frontend domains only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 📞 Support

For issues and questions:
- Check the logs for error details
- Review the test suite for examples
- Open an issue on GitHub

---

**AIDA Platform Backend** - Powering intelligent WhatsApp assistants 🚀