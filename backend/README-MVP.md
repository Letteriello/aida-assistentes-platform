# AIDA Platform MVP Backend

This is the simplified MVP (Minimum Viable Product) version of the AIDA Platform backend, designed for rapid deployment and testing of core WhatsApp AI assistant functionality.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Supabase project with the simplified database schema
- Evolution API instance
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Start the MVP server:**
   ```bash
   npm run dev:mvp
   ```

The server will start on `http://localhost:3000`

## 📋 Environment Configuration

### Required Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# Security
JWT_SECRET=your-jwt-secret

# AI
OPENAI_API_KEY=sk-your-openai-api-key

# Server
PORT=3000
WEBHOOK_URL=http://localhost:3000/webhook/message
```

## 🗄️ Database Schema

The MVP uses a simplified database schema with these main tables:

- `users_simplified` - User accounts
- `whatsapp_instances_simplified` - WhatsApp instances
- `billing_cycles_simplified` - Billing management
- `assistant_configs_simplified` - AI assistant configurations
- `product_catalogs` - Product catalogs
- `conversations_simplified` - Customer conversations
- `messages_simplified` - Chat messages
- `auth_codes` - Authentication codes

## 🔌 API Endpoints

### Authentication
- `POST /auth/send-code` - Send WhatsApp authentication code
- `POST /auth/verify-code` - Verify authentication code

### Onboarding
- `POST /onboarding` - Complete user onboarding

### Dashboard
- `GET /dashboard` - Get user dashboard data

### WhatsApp Instances
- `GET /instances` - List user instances
- `GET /instances/:id/qr` - Get QR code
- `GET /instances/:id/status` - Get instance status
- `DELETE /instances/:id` - Delete instance

### Billing
- `GET /billing/cycles` - Get billing cycles
- `GET /billing/usage/:instanceId` - Get usage report

### Assistant Configuration
- `GET /assistant/:instanceId` - Get assistant config
- `PUT /assistant/:instanceId` - Update assistant config
- `POST /assistant/:instanceId/toggle` - Toggle assistant status

### Product Catalog
- `GET /products/:instanceId` - List products
- `POST /products/:instanceId` - Create product
- `GET /products/:instanceId/search` - Search products

### Conversations
- `GET /conversations/:instanceId` - List conversations
- `GET /conversations/:instanceId/:conversationId/messages` - Get messages

### Webhooks
- `POST /webhook/message` - Process incoming WhatsApp messages

## 🏗️ Architecture

### Core Services

1. **WhatsAppAuthService** - Handles phone-based authentication
2. **WhatsAppInstanceService** - Manages WhatsApp instances
3. **SimplifiedBillingService** - Fixed monthly billing (R$250)
4. **AssistantConfigService** - AI assistant configuration
5. **ProductCatalogService** - Product management
6. **ConversationService** - Chat management
7. **AidaMVPService** - Main orchestrator

### Key Features

- **Phone Authentication**: 6-digit codes via WhatsApp
- **One-Click Onboarding**: Complete setup in single API call
- **Fixed Billing**: R$250/month per instance
- **Usage Limits**: 1,000 messages + 10 documents per month
- **AI Responses**: OpenAI-powered customer support
- **Product Catalog**: Vector search for products
- **Conversation Management**: Full chat history

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev:mvp          # Start MVP server with hot reload
npm run start:mvp        # Start MVP server
npm run build:mvp        # Build and start MVP

# Health checks
npm run health:mvp       # Check MVP server health

# Database
npm run db:generate-types # Generate TypeScript types from Supabase

# Testing
npm run test             # Run tests
npm run lint             # Lint code
npm run type-check       # TypeScript check
```

### Project Structure

```
src/
├── services/
│   ├── whatsapp-auth.service.ts      # Phone authentication
│   ├── whatsapp-instance.service.ts  # Instance management
│   ├── simplified-billing.service.ts # Billing logic
│   ├── assistant-config.service.ts   # AI configuration
│   ├── product-catalog.service.ts    # Product management
│   ├── conversation.service.ts       # Chat management
│   └── aida-mvp.service.ts           # Main orchestrator
├── routes/
│   └── mvp.routes.ts                 # API routes
├── types/
│   └── database.ts                   # Database types
├── lib/
│   └── evolution-api.ts              # Evolution API client
└── server-mvp.ts                     # Main server file
```

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=3000
   WEBHOOK_URL=https://your-domain.com/webhook/message
   ```

2. **Build and Start:**
   ```bash
   npm run build
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Logs

The server provides structured logging for:
- Authentication attempts
- WhatsApp instance events
- Billing operations
- AI responses
- Error tracking

## 🔒 Security

- JWT-based authentication
- Rate limiting on authentication endpoints
- Input validation with Zod schemas
- Secure environment variable handling
- CORS protection

## 📈 Scaling Considerations

### Current Limitations (MVP)
- Single server instance
- Fixed billing model
- Basic AI responses
- Limited customization

### Future Enhancements
- Multi-tenant architecture
- Advanced billing plans
- Enhanced AI capabilities
- Custom integrations
- Analytics dashboard

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start:**
   - Check environment variables
   - Verify Supabase connection
   - Ensure port 3000 is available

2. **WhatsApp authentication fails:**
   - Verify Evolution API connection
   - Check admin instance configuration
   - Review webhook URL setup

3. **Database errors:**
   - Confirm Supabase service role key
   - Check database schema
   - Verify table permissions

### Debug Mode

```env
DEBUG=true
LOG_LEVEL=debug
```

## 📞 Support

For issues and questions:
- Check the logs for error details
- Verify environment configuration
- Test individual endpoints
- Review database connectivity

## 🔄 Migration from Full Platform

To migrate from the full AIDA platform:

1. Export essential data
2. Set up simplified schema
3. Configure MVP environment
4. Test core functionality
5. Deploy MVP version

---

**Note**: This MVP version is designed for rapid deployment and testing. For production use with advanced features, consider the full AIDA Platform.