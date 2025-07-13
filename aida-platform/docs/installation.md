# Guia de Instalação - AIDA Platform

Este guia fornece instruções detalhadas para configurar e executar a plataforma AIDA em diferentes ambientes.

## 📋 Pré-requisitos

### Software Necessário
- **Node.js** 20.x ou superior
- **npm** 10.x ou superior (ou yarn/pnpm)
- **Git** para controle de versão
- **PostgreSQL** 15+ (ou conta Supabase)

### Contas e Serviços
- **Cloudflare Account** (Workers, KV, R2, Analytics)
- **Supabase Account** (ou PostgreSQL self-hosted)
- **OpenAI API Key** (ou Anthropic Claude)
- **Evolution API** (para WhatsApp)

## 🚀 Instalação Rápida

### 1. Clone o Repositório
```bash
git clone https://github.com/your-org/aida-platform.git
cd aida-platform
```

### 2. Instale Dependências
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Volte para a raiz
cd ..
```

### 3. Configure Variáveis de Ambiente

#### Backend (.env.local)
```bash
cd backend
cp .env.example .env.local
```

Edite `.env.local`:
```env
# Ambiente
ENVIRONMENT=development
LOG_LEVEL=debug

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# IA Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Evolution API
EVOLUTION_API_KEY=your-evolution-key
EVOLUTION_API_BASE_URL=https://api.evolution-api.com

# Webhooks
WEBHOOK_BASE_URL=http://localhost:8787
```

#### Frontend (.env.local)
```bash
cd ../frontend
cp .env.example .env.local
```

Edite `.env.local`:
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_ENVIRONMENT=development

# Supabase (público)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## 🗄️ Configuração do Banco de Dados

### Opção 1: Supabase (Recomendado)

1. **Crie um projeto no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e as chaves de API

2. **Execute as migrações**:
```bash
cd supabase

# Instale a CLI do Supabase
npm install -g supabase

# Faça login
supabase login

# Conecte ao projeto
supabase link --project-ref your-project-ref

# Execute as migrações
supabase db push

# Popule com dados iniciais
supabase db reset
```

### Opção 2: PostgreSQL Local

1. **Instale PostgreSQL**:
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Baixe do site oficial: https://www.postgresql.org/download/
```

2. **Configure o banco**:
```bash
# Crie o banco
creatdb aida_platform

# Execute as migrações
psql -d aida_platform -f supabase/migrations/001_initial_schema.sql
psql -d aida_platform -f supabase/seed.sql
```

## ☁️ Configuração do Cloudflare

### 1. Instale Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Faça Login
```bash
wrangler login
```

### 3. Configure Recursos

#### KV Namespaces
```bash
cd backend

# Crie os namespaces
wrangler kv:namespace create "CACHE_STORE"
wrangler kv:namespace create "SESSION_STORE"
wrangler kv:namespace create "RATE_LIMIT_STORE"

# Para preview
wrangler kv:namespace create "CACHE_STORE" --preview
wrangler kv:namespace create "SESSION_STORE" --preview
wrangler kv:namespace create "RATE_LIMIT_STORE" --preview
```

#### R2 Buckets
```bash
# Crie os buckets
wrangler r2 bucket create aida-platform-media
wrangler r2 bucket create aida-platform-backups
```

#### Queues
```bash
# Crie as filas
wrangler queues create embedding-queue
wrangler queues create message-queue
wrangler queues create webhook-queue
```

### 4. Configure Secrets
```bash
# Secrets do backend
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put EVOLUTION_API_KEY
```

### 5. Atualize wrangler.toml
Edite `backend/wrangler.toml` com os IDs gerados:
```toml
[[kv_namespaces]]
binding = "CACHE_STORE"
id = "your-cache-namespace-id"
preview_id = "your-cache-preview-id"

# ... outros namespaces
```

## 🔧 Configuração da Evolution API

### 1. Obtenha Acesso
- Registre-se na [Evolution API](https://evolution-api.com)
- Obtenha sua chave de API
- Configure uma instância do WhatsApp

### 2. Configure Webhooks
```bash
# Configure o webhook para sua instância
curl -X POST "https://api.evolution-api.com/instance/webhook" \
  -H "Authorization: Bearer your-evolution-key" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "url": "https://your-domain.workers.dev/webhook/whatsapp",
      "events": ["messages.upsert", "connection.update"]
    }
  }'
```

## 🏃‍♂️ Executando em Desenvolvimento

### 1. Inicie o Backend
```bash
cd backend
npm run dev
```

O backend estará disponível em `http://localhost:8787`

### 2. Inicie o Frontend
```bash
cd frontend
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

### 3. Teste a Configuração
```bash
# Teste o health check
curl http://localhost:8787/health

# Teste a API
curl http://localhost:8787/api/stats
```

## 🧪 Executando Testes

### Backend
```bash
cd backend

# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Todos os testes
npm run test:all
```

### Frontend
```bash
cd frontend

# Testes unitários
npm run test

# Testes E2E
npm run test:e2e
```

## 🚀 Deploy para Produção

### 1. Configure Ambientes

#### Staging
```bash
cd backend

# Deploy para staging
npx wrangler deploy --env staging

# Configure secrets para staging
echo "your-production-key" | wrangler secret put OPENAI_API_KEY --env staging
```

#### Production
```bash
# Deploy para produção
npx wrangler deploy --env production

# Configure secrets para produção
echo "your-production-key" | wrangler secret put OPENAI_API_KEY --env production
```

### 2. Deploy do Frontend
```bash
cd frontend

# Build para produção
npm run build

# Deploy para Cloudflare Pages
npx wrangler pages deploy out --project-name aida-platform-frontend
```

### 3. Configure Domínios Customizados

#### Backend (Workers)
1. Acesse o Cloudflare Dashboard
2. Vá para Workers & Pages > aida-platform-backend
3. Configure um domínio customizado (ex: `api.aida-platform.com`)

#### Frontend (Pages)
1. Acesse o Cloudflare Dashboard
2. Vá para Workers & Pages > aida-platform-frontend
3. Configure um domínio customizado (ex: `app.aida-platform.com`)

## 🔍 Verificação da Instalação

### 1. Health Checks
```bash
# Backend
curl https://api.aida-platform.com/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "ai_services": "healthy",
    "evolution_api": "healthy"
  }
}
```

### 2. Teste de API
```bash
# Obtenha estatísticas
curl -H "X-API-Key: your-api-key" \
     https://api.aida-platform.com/api/stats
```

### 3. Teste de Webhook
```bash
# Simule uma mensagem do WhatsApp
curl -X POST https://api.aida-platform.com/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "instance": "test",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false
      },
      "message": {
        "conversation": "Olá, preciso de ajuda!"
      }
    }
  }'
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Supabase
```bash
# Verifique as credenciais
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Teste a conexão
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/rest/v1/businesses"
```

#### 2. Erro de API Key da OpenAI
```bash
# Verifique a chave
echo $OPENAI_API_KEY

# Teste a API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### 3. Problemas com Webhooks
```bash
# Verifique se o endpoint está acessível
curl https://your-domain.workers.dev/webhook/whatsapp

# Verifique os logs do Cloudflare
wrangler tail
```

### Logs e Debugging

#### Backend Logs
```bash
# Logs em tempo real
wrangler tail

# Logs específicos
wrangler tail --format pretty
```

#### Frontend Logs
```bash
# Logs de build
npm run build 2>&1 | tee build.log

# Logs de desenvolvimento
npm run dev
```

## 📚 Próximos Passos

1. **Configure seu primeiro assistente**: [Guia de Assistentes](assistants.md)
2. **Integre com WhatsApp**: [Guia de WhatsApp](whatsapp-integration.md)
3. **Configure monitoramento**: [Guia de Monitoramento](monitoring.md)
4. **Otimize performance**: [Guia de Performance](performance.md)

## 🆘 Suporte

Se encontrar problemas durante a instalação:

- **Issues**: [GitHub Issues](https://github.com/your-org/aida-platform/issues)
- **Documentação**: [docs.aida-platform.com](https://docs.aida-platform.com)
- **Discord**: [AIDA Community](https://discord.gg/aida-platform)
- **Email**: support@aida-platform.com

---

**Próximo**: [Configuração de Assistentes →](assistants.md)