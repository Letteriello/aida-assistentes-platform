name: "AIDA - WhatsApp AI Assistant SaaS Platform"
description: |

## Purpose
Comprehensive PRP for implementing AIDA (Assistente de Inteligência Artificial Dinâmico e Adaptativo) - a complete SaaS platform enabling non-technical users to create and manage advanced AI assistants for WhatsApp business automation.

## Core Principles
1. **Context is King**: Leverage existing codebase patterns for rapid development
2. **Validation Loops**: Multi-layer testing strategy with executable validation
3. **Information Dense**: Use proven patterns from MCP server implementation
4. **Progressive Success**: Build MVP, validate, then scale with advanced features
5. **Global rules**: Follow all CLAUDE.md conventions and architecture guidelines

---

## Goal
Build a production-ready SaaS platform where businesses can create intelligent WhatsApp assistants without technical knowledge, featuring dual-memory architecture (business knowledge graphs + conversation history), Evolution API integration, and advanced RAG capabilities.

## Why
- **Business Value**: Democratize AI assistant creation for small-medium businesses
- **Market Gap**: No-code WhatsApp AI assistant platform with advanced memory systems
- **Technical Innovation**: Hybrid RAG system combining vector search with knowledge graphs
- **Scalability**: Multi-tenant SaaS architecture supporting thousands of businesses

## What
A complete platform featuring:
- Web interface for assistant configuration (Next.js + Shadcn/UI)
- WhatsApp integration via Evolution API
- Dual-memory system (knowledge graphs + conversation history)
- Advanced RAG with pgvector and GraphRAG/Neo4j
- Multi-tenant security and isolation

### Success Criteria
- [ ] Users can create WhatsApp assistants via web interface without coding
- [ ] Assistants handle complex business queries using knowledge graphs
- [ ] Conversation memory persists and improves responses over time
- [ ] Platform supports multiple businesses with complete data isolation
- [ ] Real-time message processing with <2 second response times
- [ ] Comprehensive testing coverage (>80%) with validation loops
- [ ] Production deployment on serverless infrastructure

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://doc.evolution-api.com/
  why: WhatsApp API integration patterns, webhook configuration, remoteJid usage
  critical: Authentication API key patterns, message format structure
  
- url: https://supabase.com/docs/guides/database/extensions/pgvector
  why: Vector storage and similarity search implementation
  critical: Embeddings storage patterns, performance considerations, query optimization

- url: https://github.com/microsoft/graphrag
  why: Knowledge graph construction and hybrid RAG architecture
  critical: Cost management, prompt tuning requirements, graph construction patterns

- url: https://python.langchain.com/v0.2/docs/integrations/graphs/neo4j_cypher/
  why: Graph database integration with LLM query translation
  critical: Cypher generation patterns, schema design, performance optimization

- url: https://nextjs.org/docs
  why: Frontend architecture and API routes
  section: App Router, Server Components, API routes

- url: https://ui.shadcn.com/
  why: Component library patterns matching project aesthetic
  critical: Form components for assistant configuration

- file: C:\Users\gabri\OneDrive\Área de Trabalho\aida-assistentes\Context-Engineering-Intro\use-cases\mcp-server\src\database\connection.ts
  why: PostgreSQL connection pooling patterns for Supabase
  critical: Singleton pattern, cleanup mechanisms, Cloudflare Workers compatibility

- file: C:\Users\gabri\OneDrive\Área de Trabalho\aida-assistentes\Context-Engineering-Intro\use-cases\mcp-server\src\database\security.ts
  why: SQL injection protection and input validation patterns
  critical: validateSqlQuery(), isWriteOperation(), formatDatabaseError()

- file: C:\Users\gabri\OneDrive\Área de Trabalho\aida-assistentes\Context-Engineering-Intro\use-cases\mcp-server\src\auth\github-handler.ts
  why: OAuth authentication flow patterns for multi-tenant security
  critical: Session management, role-based access, secure token handling

- file: C:\Users\gabri\OneDrive\Área de Trabalho\aida-assistentes\Context-Engineering-Intro\use-cases\mcp-server\src\tools\register-tools.ts
  why: Modular tool registration system for AI assistant capabilities
  critical: Permission-based access, input validation with Zod, error handling

- file: C:\Users\gabri\OneDrive\Área de Trabalho\aida-assistentes\Context-Engineering-Intro\use-cases\mcp-server\tests\
  why: Comprehensive testing patterns with Vitest, mocks, and fixtures
  critical: Database testing, authentication flow testing, mock patterns
```

### Current Codebase Tree
```bash
Context-Engineering-Intro/
├── CLAUDE.md                          # Project conventions and rules
├── INITIAL.md                         # Project blueprint and requirements
├── PRPs/                              # Project Requirement Prompts
│   ├── templates/prp_base.md          # PRP template
│   └── EXAMPLE_multi_agent_prp.md     # Example PRP
├── examples/                          # Empty - needs Evolution API examples
└── use-cases/
    └── mcp-server/                     # Existing MCP server implementation
        ├── src/
        │   ├── database/               # PostgreSQL patterns (REUSE)
        │   │   ├── connection.ts       # Connection pooling
        │   │   ├── security.ts         # SQL protection
        │   │   └── utils.ts            # DB operations
        │   ├── auth/                   # OAuth patterns (ADAPT)
        │   │   ├── github-handler.ts   # Session management
        │   │   └── oauth-utils.ts      # Token handling
        │   ├── tools/                  # Tool architecture (EXTEND)
        │   │   └── register-tools.ts   # Permission system
        │   ├── index.ts                # Server structure
        │   └── types.ts                # Type definitions
        ├── tests/                      # Testing patterns (MIRROR)
        ├── package.json                # Dependencies
        └── wrangler.jsonc              # Cloudflare deployment
```

### Desired Codebase Tree with Files to Add
```bash
aida-platform/
├── backend/                           # Serverless backend (Cloudflare Workers)
│   ├── src/
│   │   ├── evolution-api/             # WhatsApp integration
│   │   │   ├── client.ts              # Evolution API wrapper
│   │   │   ├── webhook-handler.ts     # Message processing
│   │   │   ├── message-formatter.ts   # WhatsApp message formatting
│   │   │   └── conversation-manager.ts # remoteJid conversation tracking
│   │   ├── rag/                       # Hybrid RAG system
│   │   │   ├── vector-search.ts       # pgvector integration
│   │   │   ├── graph-search.ts        # Knowledge graph queries
│   │   │   ├── hybrid-query.ts        # Combined vector + graph search
│   │   │   └── embedding-service.ts   # Text embedding generation
│   │   ├── ai/                        # AI orchestration
│   │   │   ├── langchain-setup.ts     # LangChain configuration
│   │   │   ├── prompt-templates.ts    # Business assistant prompts
│   │   │   └── response-generator.ts  # AI response synthesis
│   │   ├── memory/                    # Dual memory system
│   │   │   ├── business-knowledge.ts  # Knowledge graph operations
│   │   │   ├── conversation-history.ts # Chat history management
│   │   │   └── memory-integrator.ts   # Combine knowledge sources
│   │   ├── database/                  # Database layer (extend existing)
│   │   │   ├── supabase-client.ts     # Supabase connection with pgvector
│   │   │   ├── migrations/            # Database schema
│   │   │   └── models/                # Data models (Pydantic equivalent in TS)
│   │   ├── api/                       # API endpoints
│   │   │   ├── assistants.ts          # Assistant CRUD operations
│   │   │   ├── conversations.ts       # Conversation management
│   │   │   └── webhooks.ts            # Evolution API webhooks
│   │   └── auth/                      # Multi-tenant authentication
│   │       ├── business-auth.ts       # Business account management
│   │       └── tenant-isolation.ts    # Data isolation between businesses
│   ├── tests/                         # Mirror existing test patterns
│   └── wrangler.jsonc                 # Cloudflare deployment config
├── frontend/                          # Next.js web application
│   ├── app/                           # App Router structure
│   │   ├── dashboard/                 # Business dashboard
│   │   ├── assistants/                # Assistant configuration
│   │   ├── conversations/             # Conversation monitoring
│   │   └── settings/                  # Business settings
│   ├── components/                    # Shadcn/UI components
│   │   ├── ui/                        # Base UI components
│   │   ├── forms/                     # Assistant configuration forms
│   │   └── dashboard/                 # Dashboard-specific components
│   └── lib/                           # Utility functions and API clients
├── shared/                            # Shared types and utilities
│   ├── types/                         # TypeScript definitions
│   └── schemas/                       # Zod validation schemas
└── docs/                              # Project documentation
    ├── api.md                         # API documentation
    ├── deployment.md                  # Deployment guide
    └── architecture.md                # System architecture
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Evolution API requires specific authentication patterns
// Always include API key in headers: { 'Authorization': `Bearer ${apiKey}` }
// WhatsApp instances need proper lifecycle management (create -> connect -> monitor)

// CRITICAL: Supabase pgvector limitations
// IVFFlat and HNSW indexes may return fewer rows than requested
// Use iterative search for complete results: implement fallback queries

// CRITICAL: GraphRAG cost management
// "GraphRAG indexing can be an expensive operation"
// Always start with small datasets and implement cost monitoring

// CRITICAL: LangChain Neo4j integration
// Cypher generation depends heavily on prompt engineering
// Use enhanced schema option for better context: enhanced_schema=True

// CRITICAL: Cloudflare Workers limitations
// 10MB request/response limit affects large knowledge graph operations
// Use Durable Objects for stateful conversation management

// CRITICAL: Multi-tenancy security
// NEVER mix tenant data - implement strict RLS (Row Level Security)
// Use tenant_id in ALL database queries
// Validate tenant access on EVERY request

// CRITICAL: WhatsApp conversation tracking
// Use remoteJid as unique conversation identifier
// Format: phone_number@s.whatsapp.net or group_id@g.us
// Store conversation context by remoteJid for memory continuity
```

## Implementation Blueprint

### Data Models and Structure

Create type-safe data models ensuring multi-tenant isolation and conversation tracking:

```typescript
// Core business and assistant models
interface Business {
  id: string;
  name: string;
  industry: string;
  created_at: Date;
  subscription_plan: 'free' | 'pro' | 'enterprise';
}

interface Assistant {
  id: string;
  business_id: string; // Foreign key for tenant isolation
  name: string;
  description: string;
  whatsapp_instance_id: string; // Evolution API instance
  knowledge_graph_id: string;
  personality_prompt: string;
  is_active: boolean;
}

interface Conversation {
  id: string;
  assistant_id: string;
  remote_jid: string; // WhatsApp conversation identifier
  customer_name?: string;
  last_message_at: Date;
  context_summary: string;
  embeddings: number[]; // pgvector for semantic search
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_type: 'customer' | 'assistant';
  message_type: 'text' | 'media' | 'location';
  timestamp: Date;
  embeddings: number[];
}

interface KnowledgeNode {
  id: string;
  business_id: string;
  entity_type: string; // 'product', 'service', 'policy', 'procedure'
  entity_name: string;
  properties: Record<string, any>;
  embeddings: number[];
}
```

### List of Tasks to be Completed (in order)

```yaml
Task 1: Setup Project Structure and Database Foundation
MODIFY existing database patterns from use-cases/mcp-server/src/database/:
  - EXTEND connection.ts for Supabase integration with pgvector
  - ADAPT security.ts for multi-tenant Row Level Security
  - PRESERVE existing connection pooling and error handling patterns

CREATE backend/src/database/supabase-client.ts:
  - MIRROR pattern from: use-cases/mcp-server/src/database/connection.ts
  - ADD pgvector configuration and embedding operations
  - IMPLEMENT tenant isolation with RLS policies

CREATE backend/src/database/migrations/:
  - DESIGN multi-tenant schema with businesses, assistants, conversations
  - ENABLE pgvector extension and create embedding columns
  - IMPLEMENT RLS policies for complete tenant data isolation

Task 2: Evolution API Integration Layer
CREATE backend/src/evolution-api/client.ts:
  - IMPLEMENT HTTP client for Evolution API with retry logic
  - ADD authentication header management with API keys
  - HANDLE instance lifecycle (create, connect, status, delete)
  - INCLUDE rate limiting to respect API constraints

CREATE backend/src/evolution-api/webhook-handler.ts:
  - PROCESS incoming WhatsApp messages from Evolution API webhooks
  - EXTRACT remoteJid and message content for conversation tracking
  - IMPLEMENT message type detection (text, media, location)
  - ROUTE messages to appropriate AI processing pipeline

CREATE backend/src/evolution-api/message-formatter.ts:
  - FORMAT AI responses for WhatsApp message sending
  - HANDLE different message types (text, media, lists)
  - IMPLEMENT message splitting for long responses
  - ADD emoji and formatting for better UX

Task 3: Hybrid RAG System Implementation
CREATE backend/src/rag/vector-search.ts:
  - IMPLEMENT pgvector similarity search for conversations and knowledge
  - ADD embedding generation using Supabase's AI functions
  - OPTIMIZE queries with proper indexing and filtering
  - HANDLE iterative search for complete results

CREATE backend/src/rag/graph-search.ts:
  - INTEGRATE with Neo4j or implement GraphRAG knowledge graphs
  - BUILD Cypher query generation using LangChain patterns
  - IMPLEMENT entity relationship traversal for business knowledge
  - ADD graph schema optimization for business domains

CREATE backend/src/rag/hybrid-query.ts:
  - COMBINE vector and graph search results intelligently
  - IMPLEMENT relevance scoring and result ranking
  - ADD context window management for LLM input
  - OPTIMIZE for response time and accuracy balance

Task 4: Memory System and AI Orchestration
CREATE backend/src/memory/conversation-history.ts:
  - TRACK conversation context by remoteJid
  - IMPLEMENT conversation summarization for long chats
  - STORE and retrieve relevant conversation history
  - ADD conversation state management (active, resolved, escalated)

CREATE backend/src/memory/business-knowledge.ts:
  - MANAGE business-specific knowledge graphs
  - IMPLEMENT knowledge ingestion from various sources
  - ADD real-time knowledge updates via APIs
  - HANDLE knowledge versioning and updates

CREATE backend/src/ai/langchain-setup.ts:
  - CONFIGURE LangChain with OpenAI/Anthropic integration
  - IMPLEMENT conversation chains with memory
  - ADD prompt template management for different business types
  - OPTIMIZE token usage and response quality

Task 5: API Layer and Business Logic
CREATE backend/src/api/assistants.ts:
  - IMPLEMENT CRUD operations for assistant management
  - ADD assistant configuration validation with Zod
  - INTEGRATE with Evolution API for WhatsApp instance management
  - INCLUDE assistant testing and validation endpoints

CREATE backend/src/api/conversations.ts:
  - PROVIDE conversation monitoring and analytics
  - IMPLEMENT conversation search and filtering
  - ADD conversation export and reporting features
  - INCLUDE real-time conversation status updates

CREATE backend/src/api/webhooks.ts:
  - HANDLE Evolution API webhook registration and management
  - PROCESS incoming messages with proper error handling
  - IMPLEMENT message queuing for high-volume scenarios
  - ADD webhook security validation

Task 6: Authentication and Multi-Tenancy
EXTEND use-cases/mcp-server/src/auth/ patterns:
  - ADAPT OAuth flow for business account registration
  - IMPLEMENT tenant-aware authentication middleware
  - ADD subscription plan enforcement
  - PRESERVE existing security patterns

CREATE backend/src/auth/tenant-isolation.ts:
  - ENFORCE strict tenant data separation
  - IMPLEMENT middleware for tenant context injection
  - ADD database query filters for all tenant data
  - VALIDATE tenant permissions on all operations

Task 7: Frontend Dashboard Implementation
CREATE frontend/app/dashboard/ with Next.js App Router:
  - IMPLEMENT business dashboard with real-time metrics
  - ADD assistant performance monitoring
  - INCLUDE conversation analytics and insights
  - USE Shadcn/UI components following project aesthetic

CREATE frontend/app/assistants/ for assistant management:
  - BUILD assistant configuration forms with validation
  - ADD knowledge base management interface
  - IMPLEMENT assistant testing and preview features
  - INCLUDE WhatsApp QR code generation for connection

CREATE frontend/components/forms/ for assistant configuration:
  - DESIGN intuitive forms for non-technical users
  - IMPLEMENT guided setup wizard for assistant creation
  - ADD real-time validation and preview features
  - FOLLOW accessibility best practices

Task 8: Testing and Validation Implementation
MIRROR test patterns from use-cases/mcp-server/tests/:
  - CREATE unit tests for all core functionality
  - IMPLEMENT integration tests for API endpoints
  - ADD end-to-end tests for complete user workflows
  - INCLUDE load testing for message processing

CREATE backend/tests/integration/:
  - TEST Evolution API integration with mocked responses
  - VALIDATE database operations with tenant isolation
  - TEST AI pipeline with known inputs and expected outputs
  - INCLUDE error handling and edge case scenarios

CREATE frontend/tests/ for UI testing:
  - IMPLEMENT component testing with React Testing Library
  - ADD user interaction testing for critical workflows
  - TEST responsive design and accessibility
  - INCLUDE visual regression testing for UI consistency

Task 9: Deployment and Production Setup
EXTEND use-cases/mcp-server/wrangler.jsonc for production:
  - CONFIGURE Cloudflare Workers for backend deployment
  - ADD environment variable management for different stages
  - IMPLEMENT monitoring and logging with structured data
  - INCLUDE database migration automation

CREATE deployment configuration for frontend:
  - SETUP Vercel deployment for Next.js application
  - CONFIGURE environment variables and API endpoints
  - IMPLEMENT CDN optimization for global performance
  - ADD monitoring for frontend performance metrics

Task 10: Documentation and Final Validation
CREATE comprehensive documentation:
  - WRITE API documentation with OpenAPI/Swagger
  - DOCUMENT deployment procedures and environment setup
  - CREATE user guides for assistant configuration
  - INCLUDE troubleshooting guides and FAQ

IMPLEMENT final validation pipeline:
  - RUN complete test suite with coverage reporting
  - VALIDATE security with penetration testing
  - TEST performance under realistic load scenarios
  - VERIFY multi-tenant isolation and data security
```

### Per Task Pseudocode

```typescript
// Task 1: Database Foundation
async function setupSupabaseWithPgvector() {
  // PATTERN: Mirror existing connection.ts singleton pattern
  const supabase = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false }, // Stateless for Workers
    realtime: { params: { eventsPerSecond: 10 } }
  });
  
  // CRITICAL: Enable pgvector and create tables with RLS
  await supabase.sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await supabase.sql`
    CREATE TABLE businesses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    -- RLS for tenant isolation
    ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY business_isolation ON businesses 
      USING (id = get_current_business_id());
  `;
}

// Task 2: Evolution API Integration
async function handleWhatsAppMessage(webhook: EvolutionWebhook) {
  // PATTERN: Extract remoteJid for conversation tracking
  const { remoteJid, message, instanceId } = webhook.data;
  
  // GOTCHA: Validate webhook signature for security
  if (!validateWebhookSignature(webhook)) {
    throw new Error('Invalid webhook signature');
  }
  
  // CRITICAL: Get business context from instance mapping
  const assistant = await getAssistantByInstance(instanceId);
  const conversation = await getOrCreateConversation(
    assistant.id, 
    remoteJid
  );
  
  // Process message through AI pipeline
  const response = await processMessageWithAI(
    message.content, 
    conversation.context,
    assistant.knowledge_graph_id
  );
  
  // Send response via Evolution API
  await sendWhatsAppMessage(instanceId, remoteJid, response);
}

// Task 3: Hybrid RAG Implementation  
async function hybridQuery(query: string, businessId: string) {
  // PATTERN: Combine vector and graph search results
  const [vectorResults, graphResults] = await Promise.all([
    // Vector search in conversation history and documents
    supabase.rpc('vector_search', { 
      query_embedding: await generateEmbedding(query),
      business_id: businessId,
      limit: 10 
    }),
    
    // Graph search for business knowledge
    neo4j.run(`
      MATCH (n:Knowledge)-[:RELATES_TO*1..2]-(related)
      WHERE n.business_id = $businessId 
        AND n.content CONTAINS $query
      RETURN n, related
      LIMIT 5
    `, { businessId, query })
  ]);
  
  // CRITICAL: Rank and combine results by relevance
  const combinedContext = rankAndCombine(vectorResults, graphResults);
  return combinedContext;
}

// Task 4: AI Response Generation
async function generateAssistantResponse(
  message: string, 
  context: ConversationContext,
  businessKnowledge: BusinessKnowledge
) {
  // PATTERN: Use LangChain with conversation memory
  const chain = ConversationalRetrievalQAChain.fromLLM(
    llm,
    vectorStore.asRetriever(),
    {
      memory: new ConversationBufferWindowMemory({
        k: 5, // Keep last 5 exchanges
        memoryKey: 'chat_history',
        returnMessages: true
      }),
      questionGeneratorTemplate: BUSINESS_PROMPT_TEMPLATE
    }
  );
  
  // GOTCHA: Manage token limits and context window
  const truncatedContext = truncateToTokenLimit(
    combinedContext, 
    MAX_CONTEXT_TOKENS
  );
  
  const response = await chain.call({
    question: message,
    context: truncatedContext
  });
  
  return formatResponseForWhatsApp(response.text);
}
```

### Integration Points
```yaml
DATABASE:
  - migration: "Enable pgvector extension and create embedding columns"
  - RLS: "Implement Row Level Security for complete tenant isolation"
  - indexes: "CREATE INDEX ON conversations USING ivfflat (embeddings vector_cosine_ops)"
  
CONFIG:
  - add to: backend/src/config/settings.ts
  - pattern: "EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''"
  - pattern: "SUPABASE_URL = process.env.SUPABASE_URL || ''"
  - pattern: "NEO4J_URI = process.env.NEO4J_URI || ''"
  
ROUTES:
  - add to: backend/src/api/routes.ts  
  - pattern: "router.post('/webhook/whatsapp', handleWhatsAppWebhook)"
  - pattern: "router.get('/assistants/:id/conversations', getConversations)"

FRONTEND:
  - add to: frontend/app/layout.tsx
  - pattern: "Provider wrapping for authentication and tenant context"
  - pattern: "Shadcn/UI theme configuration matching Oxum aesthetic"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# Backend validation
cd backend && npm run lint     # ESLint + Prettier
cd backend && npm run typecheck # TypeScript compilation
cd backend && npm run build    # Build verification

# Frontend validation  
cd frontend && npm run lint    # Next.js linting
cd frontend && npm run typecheck # TypeScript compilation
cd frontend && npm run build   # Production build test

# Expected: No errors. If errors, READ the error message and fix systematically.
```

### Level 2: Unit Tests for Each Module
```typescript
// Test Evolution API integration
describe('Evolution API Client', () => {
  test('sends text message successfully', async () => {
    const mockResponse = { success: true, messageId: '123' };
    vi.spyOn(fetch, 'fetch').mockResolvedValue(mockResponse);
    
    const result = await evolutionClient.sendTextMessage(
      'instance123', 
      '5511999999999@s.whatsapp.net', 
      'Hello World'
    );
    
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('123');
  });
  
  test('handles API rate limiting gracefully', async () => {
    vi.spyOn(fetch, 'fetch').mockRejectedValue(
      new Error('Rate limit exceeded')
    );
    
    await expect(
      evolutionClient.sendTextMessage('instance123', 'jid', 'text')
    ).rejects.toThrow('Rate limit exceeded');
  });
});

// Test hybrid RAG system
describe('Hybrid RAG Query', () => {
  test('combines vector and graph results', async () => {
    const mockVectorResults = [{ content: 'Product info', score: 0.9 }];
    const mockGraphResults = [{ entity: 'Product A', relation: 'HAS_PRICE' }];
    
    const results = await hybridQuery('product pricing', 'business123');
    
    expect(results).toHaveLength(2);
    expect(results[0].source).toBe('vector');
    expect(results[1].source).toBe('graph');
  });
});

// Test tenant isolation
describe('Multi-Tenancy Security', () => {
  test('prevents cross-tenant data access', async () => {
    const business1Id = 'business1';
    const business2Id = 'business2';
    
    // Create data for business1
    await createAssistant({ businessId: business1Id, name: 'Assistant 1' });
    
    // Try to access from business2 context
    await expect(
      getAssistants(business2Id)
    ).resolves.toHaveLength(0); // Should not see business1's data
  });
});
```

```bash
# Run and iterate until passing:
npm run test                    # Run all unit tests
npm run test:coverage          # Ensure >80% coverage
npm run test:integration       # Integration tests with real APIs (mocked)

# If failing: Read error, understand root cause, fix code, re-run
# NEVER mock to pass - fix the actual implementation
```

### Level 3: End-to-End Integration Test
```bash
# Start services in development mode
cd backend && npm run dev       # Start backend on localhost:8787
cd frontend && npm run dev      # Start frontend on localhost:3000

# Test complete user workflow
curl -X POST http://localhost:8787/api/assistants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  -d '{
    "name": "Test Assistant",
    "description": "Test business assistant",
    "businessId": "test-business-123",
    "personalityPrompt": "You are a helpful business assistant"
  }'

# Expected: {"success": true, "assistantId": "...", "whatsappInstanceId": "..."}

# Test WhatsApp message processing
curl -X POST http://localhost:8787/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "test-instance",
    "data": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "message": { "content": "What are your store hours?" }
    }
  }'

# Expected: 200 OK with assistant response sent to WhatsApp
```

### Level 4: Performance and Security Validation
```bash
# Load testing for message processing
npm run test:load              # Simulate high message volume

# Security testing
npm run test:security          # Check for SQL injection, XSS, etc.
npm run audit                  # Dependency vulnerability scan

# Multi-tenant isolation verification
npm run test:tenant-isolation  # Verify complete data separation

# Expected: All tests pass, no security vulnerabilities, proper isolation
```

## Final Validation Checklist
- [ ] All unit tests pass: `npm run test` in both backend and frontend
- [ ] No linting errors: `npm run lint` in both projects
- [ ] No type errors: `npm run typecheck` in both projects  
- [ ] Integration tests successful: Complete assistant creation and message flow
- [ ] Multi-tenant isolation verified: No cross-tenant data leakage
- [ ] Performance targets met: <2s message response time
- [ ] Security audit clean: No vulnerabilities in dependencies
- [ ] Evolution API integration working: Messages send/receive correctly
- [ ] Hybrid RAG system functional: Vector + graph search combined
- [ ] Frontend UI intuitive: Non-technical users can create assistants
- [ ] Documentation complete: API docs, deployment guide, user manual

---

## Anti-Patterns to Avoid
- ❌ Don't ignore tenant isolation - ALWAYS filter by business_id/tenant_id
- ❌ Don't skip Evolution API rate limiting - implement proper backoff
- ❌ Don't store API keys in frontend - use secure backend proxy
- ❌ Don't mix conversation contexts - strictly separate by remoteJid
- ❌ Don't ignore pgvector limitations - implement iterative search fallbacks
- ❌ Don't hardcode prompts - make them configurable per business
- ❌ Don't skip embedding generation - vector search requires proper embeddings
- ❌ Don't forget webhook signature validation - security is critical
- ❌ Don't ignore GraphRAG costs - implement usage monitoring and limits
- ❌ Don't create overly complex schemas - start simple and evolve

## Implementation Confidence Score: 8/10

**Rationale:** 
- Strong foundation from existing MCP server patterns (database, auth, testing)
- Comprehensive research on all required technologies (Evolution API, pgvector, GraphRAG)
- Clear implementation path with validated patterns
- Robust testing strategy with multiple validation levels
- Well-defined success criteria and anti-patterns

**Risk Mitigation:**
- Evolution API integration is new but well-documented
- Hybrid RAG complexity managed through incremental implementation
- Multi-tenancy security patterns proven in existing codebase
- Cost monitoring for GraphRAG included in design

This PRP provides sufficient context and validation mechanisms for successful one-pass implementation using Claude Code.