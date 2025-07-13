# API Reference - AIDA Platform

Documentação completa da API REST da plataforma AIDA.

## 🔐 Autenticação

Todas as requisições à API devem incluir uma chave de API válida no header:

```http
X-API-Key: your-api-key-here
```

### Obter API Key

1. Faça login no dashboard da AIDA
2. Vá para **Configurações** > **API Keys**
3. Clique em **Gerar Nova Chave**
4. Copie e guarde a chave com segurança

## 🌐 Base URL

```
Production: https://api.aida-platform.com
Staging: https://api-staging.aida-platform.com
Development: http://localhost:8787
```

## 📊 Respostas Padrão

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Erro
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Paginação
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 🏥 Health Check

### GET /health

Verifica o status de saúde da API e serviços conectados.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "ai_services": "healthy",
    "evolution_api": "healthy",
    "vector_search": "healthy",
    "memory_system": "healthy"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

## 📈 Estatísticas

### GET /api/stats

Retorna estatísticas gerais da plataforma para o tenant atual.

**Headers:**
```http
X-API-Key: your-api-key
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "assistants": {
      "total": 5,
      "active": 3,
      "inactive": 2
    },
    "conversations": {
      "total": 1250,
      "active": 45,
      "today": 23
    },
    "messages": {
      "total": 15420,
      "today": 156,
      "avg_response_time": 1.2
    },
    "ai_usage": {
      "tokens_used": 125000,
      "requests_today": 89,
      "avg_tokens_per_request": 450
    }
  }
}
```

## 🤖 Assistentes

### GET /api/assistants

Lista todos os assistentes do tenant.

**Query Parameters:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 20, máx: 100)
- `status` (string): Filtrar por status (`active`, `inactive`)
- `search` (string): Buscar por nome ou descrição

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ast_123456789",
      "name": "Assistente de Vendas",
      "description": "Especialista em produtos e vendas",
      "status": "active",
      "phone_number": "+5511999999999",
      "system_prompt": "Você é um assistente especializado em vendas...",
      "knowledge_base": {
        "documents": 15,
        "last_updated": "2024-01-15T09:00:00Z"
      },
      "settings": {
        "ai_model": "gpt-4",
        "temperature": 0.7,
        "max_tokens": 1000,
        "response_format": "conversational"
      },
      "created_at": "2024-01-10T14:30:00Z",
      "updated_at": "2024-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

### GET /api/assistants/:id

Retorna detalhes de um assistente específico.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "ast_123456789",
    "name": "Assistente de Vendas",
    "description": "Especialista em produtos e vendas",
    "status": "active",
    "phone_number": "+5511999999999",
    "system_prompt": "Você é um assistente especializado em vendas...",
    "knowledge_base": {
      "documents": 15,
      "vectors": 1250,
      "last_updated": "2024-01-15T09:00:00Z",
      "size_mb": 2.5
    },
    "settings": {
      "ai_model": "gpt-4",
      "temperature": 0.7,
      "max_tokens": 1000,
      "response_format": "conversational",
      "memory_enabled": true,
      "rag_enabled": true
    },
    "stats": {
      "conversations": 45,
      "messages": 320,
      "avg_response_time": 1.1,
      "satisfaction_score": 4.2
    },
    "created_at": "2024-01-10T14:30:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
}
```

### POST /api/assistants

Cria um novo assistente.

**Body:**
```json
{
  "name": "Assistente de Suporte",
  "description": "Especialista em suporte técnico",
  "phone_number": "+5511888888888",
  "system_prompt": "Você é um assistente especializado em suporte técnico...",
  "settings": {
    "ai_model": "gpt-4",
    "temperature": 0.5,
    "max_tokens": 800,
    "response_format": "helpful",
    "memory_enabled": true,
    "rag_enabled": true
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "ast_987654321",
    "name": "Assistente de Suporte",
    "status": "inactive",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### PUT /api/assistants/:id

Atualiza um assistente existente.

**Body:** (campos opcionais)
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "system_prompt": "Novo prompt do sistema...",
  "settings": {
    "temperature": 0.8
  }
}
```

### DELETE /api/assistants/:id

Remove um assistente (soft delete).

**Resposta:**
```json
{
  "success": true,
  "message": "Assistente removido com sucesso"
}
```

### POST /api/assistants/:id/activate

Ativa um assistente.

### POST /api/assistants/:id/deactivate

Desativa um assistente.

## 💬 Conversas

### GET /api/conversations

Lista conversas do tenant.

**Query Parameters:**
- `page`, `limit`: Paginação
- `assistant_id`: Filtrar por assistente
- `status`: Filtrar por status (`active`, `closed`, `waiting`)
- `date_from`, `date_to`: Filtrar por período

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_123456789",
      "assistant_id": "ast_123456789",
      "assistant_name": "Assistente de Vendas",
      "contact": {
        "phone": "+5511777777777",
        "name": "João Silva",
        "avatar": "https://..."
      },
      "status": "active",
      "last_message": {
        "content": "Obrigado pela ajuda!",
        "timestamp": "2024-01-15T10:25:00Z",
        "from_user": true
      },
      "message_count": 12,
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T10:25:00Z"
    }
  ]
}
```

### GET /api/conversations/:id

Retorna detalhes de uma conversa específica.

### GET /api/conversations/:id/messages

Retorna mensagens de uma conversa.

**Query Parameters:**
- `page`, `limit`: Paginação
- `before`: Mensagens antes de um timestamp
- `after`: Mensagens depois de um timestamp

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123456789",
      "conversation_id": "conv_123456789",
      "content": "Olá! Como posso ajudar?",
      "from_user": false,
      "from_assistant": true,
      "message_type": "text",
      "metadata": {
        "ai_model": "gpt-4",
        "tokens_used": 45,
        "response_time": 1.2,
        "confidence": 0.95
      },
      "timestamp": "2024-01-15T09:01:00Z"
    }
  ]
}
```

### POST /api/conversations/:id/messages

Envia uma mensagem para uma conversa.

**Body:**
```json
{
  "content": "Preciso de ajuda com meu pedido",
  "message_type": "text"
}
```

## 🧠 Sistema de Memória

### GET /api/memory/nodes

Lista nós do grafo de conhecimento.

**Query Parameters:**
- `search`: Buscar por conteúdo
- `type`: Filtrar por tipo de nó
- `limit`: Limite de resultados

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "node_123",
      "type": "person",
      "name": "João Silva",
      "properties": {
        "phone": "+5511777777777",
        "preferences": ["produtos premium", "pagamento à vista"]
      },
      "created_at": "2024-01-15T09:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/memory/nodes

Cria um novo nó de conhecimento.

### GET /api/memory/relations

Lista relações entre nós.

### POST /api/memory/search

Busca semântica no grafo de conhecimento.

**Body:**
```json
{
  "query": "clientes interessados em produtos premium",
  "limit": 10,
  "include_relations": true
}
```

## 🔍 Sistema RAG

### POST /api/rag/search

Busca híbrida (vetorial + palavra-chave) na base de conhecimento.

**Body:**
```json
{
  "query": "como configurar pagamento",
  "assistant_id": "ast_123456789",
  "limit": 5,
  "threshold": 0.7,
  "search_type": "hybrid"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "doc_123",
        "content": "Para configurar pagamento, acesse...",
        "score": 0.92,
        "source": "manual_pagamentos.pdf",
        "metadata": {
          "page": 15,
          "section": "Configuração"
        }
      }
    ],
    "query_stats": {
      "vector_results": 3,
      "keyword_results": 2,
      "total_time_ms": 45
    }
  }
}
```

### POST /api/rag/documents

Adiciona documentos à base de conhecimento.

**Body (multipart/form-data):**
```
file: document.pdf
assistant_id: ast_123456789
metadata: {"category": "manual", "version": "1.0"}
```

### GET /api/rag/documents

Lista documentos da base de conhecimento.

### DELETE /api/rag/documents/:id

Remove um documento da base de conhecimento.

## 📊 Dashboard

### GET /api/dashboard/stats

Estatísticas para o dashboard.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_assistants": 5,
      "active_conversations": 23,
      "messages_today": 156,
      "avg_response_time": 1.2
    },
    "ai_performance": {
      "total_requests": 1250,
      "avg_tokens": 450,
      "success_rate": 0.98,
      "avg_confidence": 0.87
    },
    "rag_performance": {
      "searches_today": 89,
      "avg_relevance": 0.82,
      "cache_hit_rate": 0.65
    }
  }
}
```

### GET /api/dashboard/recent-activity

Atividades recentes do tenant.

### GET /api/dashboard/platform-stats

Estatísticas detalhadas da plataforma.

## 🔔 Webhooks

### POST /webhook/whatsapp

Endpoint para receber webhooks da Evolution API.

**Headers:**
```http
Content-Type: application/json
X-Evolution-Signature: sha256=...
```

**Body:**
```json
{
  "instance": "instance_name",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "message_id"
    },
    "message": {
      "conversation": "Olá, preciso de ajuda!"
    },
    "messageTimestamp": 1705312200
  }
}
```

## 🚨 Códigos de Erro

| Código | Descrição |
|--------|----------|
| `INVALID_API_KEY` | Chave de API inválida ou expirada |
| `TENANT_NOT_FOUND` | Tenant não encontrado |
| `ASSISTANT_NOT_FOUND` | Assistente não encontrado |
| `CONVERSATION_NOT_FOUND` | Conversa não encontrada |
| `VALIDATION_ERROR` | Dados de entrada inválidos |
| `RATE_LIMIT_EXCEEDED` | Limite de taxa excedido |
| `AI_SERVICE_ERROR` | Erro no serviço de IA |
| `DATABASE_ERROR` | Erro no banco de dados |
| `WEBHOOK_SIGNATURE_INVALID` | Assinatura do webhook inválida |
| `INSUFFICIENT_PERMISSIONS` | Permissões insuficientes |

## 📝 Rate Limiting

A API implementa rate limiting por tenant:

- **Requisições gerais**: 1000/hora
- **Mensagens**: 500/hora
- **Uploads**: 100/hora
- **Buscas RAG**: 200/hora

**Headers de resposta:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705315800
```

## 🔧 SDKs e Bibliotecas

### JavaScript/TypeScript
```bash
npm install @aida-platform/sdk
```

```javascript
import { AidaClient } from '@aida-platform/sdk';

const client = new AidaClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.aida-platform.com'
});

// Listar assistentes
const assistants = await client.assistants.list();

// Enviar mensagem
const response = await client.conversations.sendMessage('conv_123', {
  content: 'Olá!'
});
```

### Python
```bash
pip install aida-platform-sdk
```

```python
from aida_platform import AidaClient

client = AidaClient(
    api_key='your-api-key',
    base_url='https://api.aida-platform.com'
)

# Listar assistentes
assistants = client.assistants.list()

# Buscar na base de conhecimento
results = client.rag.search(
    query='como configurar pagamento',
    assistant_id='ast_123'
)
```

## 📚 Exemplos de Uso

### Criar Assistente Completo
```bash
curl -X POST https://api.aida-platform.com/api/assistants \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assistente E-commerce",
    "description": "Especialista em vendas online",
    "phone_number": "+5511999999999",
    "system_prompt": "Você é um assistente especializado em e-commerce. Ajude os clientes com produtos, pedidos e pagamentos.",
    "settings": {
      "ai_model": "gpt-4",
      "temperature": 0.7,
      "max_tokens": 1000,
      "memory_enabled": true,
      "rag_enabled": true
    }
  }'
```

### Busca Avançada RAG
```bash
curl -X POST https://api.aida-platform.com/api/rag/search \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "política de devolução produtos eletrônicos",
    "assistant_id": "ast_123456789",
    "limit": 5,
    "threshold": 0.8,
    "search_type": "hybrid",
    "filters": {
      "category": "policies",
      "product_type": "electronics"
    }
  }'
```

---

**Próximo**: [Guia de Arquitetura →](architecture.md)