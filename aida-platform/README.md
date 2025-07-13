# AIDA Platform - AI-Powered WhatsApp Assistant Platform

🤖 **AIDA** (AI-Driven Assistant) é uma plataforma completa para criação e gerenciamento de assistentes de IA integrados ao WhatsApp, com arquitetura multi-tenant, RAG híbrido e processamento avançado de contexto.

## 🚀 Características Principais

### 🏗️ Arquitetura Multi-Tenant
- **Isolamento completo** entre diferentes negócios
- **Autenticação baseada em API Key** com escopo por tenant
- **Recursos dedicados** por inquilino (banco de dados, cache, filas)

### 🧠 Sistema RAG Híbrido
- **Busca Vetorial** com embeddings OpenAI/Anthropic
- **Busca por Palavras-chave** para consultas específicas
- **Sistema de Memória** com grafos de conhecimento
- **Processamento LangChain** para contexto avançado

### 📱 Integração WhatsApp
- **Evolution API** para comunicação com WhatsApp
- **Webhooks em tempo real** para mensagens
- **Formatação automática** de respostas
- **Suporte a mídia** (imagens, documentos, áudio)

### ⚡ Performance e Escalabilidade
- **Cloudflare Workers** para edge computing
- **Processamento assíncrono** com filas
- **Cache distribuído** com KV Store
- **Analytics em tempo real** com Analytics Engine

## 🏛️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   WhatsApp      │
│   (Next.js)     │◄──►│ (Cloudflare     │◄──►│ (Evolution API) │
│                 │    │  Workers)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Cloudflare    │    │   AI Services   │
│   (Database)    │    │   (KV, R2, AI)  │    │ (OpenAI/Claude) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Estrutura do Projeto

```
aida-platform/
├── backend/                 # Cloudflare Workers API
│   ├── src/
│   │   ├── ai/             # Processamento de IA
│   │   ├── api/            # Endpoints da API
│   │   ├── auth/           # Autenticação multi-tenant
│   │   ├── evolution-api/  # Integração WhatsApp
│   │   ├── memory/         # Sistema de memória
│   │   ├── rag/            # RAG híbrido
│   │   └── supabase/       # Cliente Supabase
│   ├── tests/              # Testes automatizados
│   └── wrangler.toml       # Configuração Cloudflare
├── frontend/               # Interface Next.js
│   ├── app/
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── assistants/     # Gerenciamento de assistentes
│   │   └── conversations/  # Visualização de conversas
│   └── components/         # Componentes reutilizáveis
├── shared/                 # Tipos e utilitários compartilhados
│   └── types/              # Definições TypeScript
├── supabase/               # Configuração do banco
│   ├── migrations/         # Migrações SQL
│   └── seed.sql           # Dados iniciais
└── docs/                   # Documentação
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Cloudflare Workers** - Edge computing e APIs
- **Hono** - Framework web rápido e leve
- **Supabase** - Banco de dados PostgreSQL
- **LangChain** - Processamento de IA
- **Zod** - Validação de schemas

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Shadcn/ui** - Componentes de interface

### Infraestrutura
- **Cloudflare KV** - Cache distribuído
- **Cloudflare R2** - Armazenamento de objetos
- **Cloudflare Queues** - Processamento assíncrono
- **Cloudflare Analytics** - Métricas em tempo real

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+
- npm ou yarn
- Conta Cloudflare
- Conta Supabase
- Chaves de API (OpenAI/Anthropic, Evolution API)

### 1. Clone o Repositório
```bash
git clone https://github.com/your-org/aida-platform.git
cd aida-platform
```

### 2. Configure o Backend
```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Configure os secrets do Cloudflare
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put EVOLUTION_API_KEY
```

### 3. Configure o Frontend
```bash
cd ../frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### 4. Configure o Banco de Dados
```bash
cd ../supabase

# Execute as migrações
supabase db reset

# Ou aplique manualmente
psql -h your-supabase-host -U postgres -d postgres -f migrations/001_initial_schema.sql
psql -h your-supabase-host -U postgres -d postgres -f seed.sql
```

### 5. Execute em Desenvolvimento
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

### 6. Deploy para Produção
```bash
# Backend
cd backend
npm run deploy

# Frontend
cd frontend
npm run build
npx wrangler pages deploy out --project-name aida-platform-frontend
```

## 📊 Monitoramento e Analytics

### Métricas Disponíveis
- **Performance de IA**: Tempo de resposta, tokens utilizados
- **Uso do Sistema**: Mensagens processadas, assistentes ativos
- **Qualidade RAG**: Relevância de busca, hits de cache
- **Saúde da API**: Uptime, latência, erros

### Dashboards
- **Cloudflare Analytics**: Métricas de infraestrutura
- **Supabase Dashboard**: Métricas de banco de dados
- **AIDA Dashboard**: Métricas de negócio personalizadas

## 🔒 Segurança

### Autenticação
- **API Keys** com escopo por tenant
- **Rate limiting** por negócio
- **Validação de origem** para webhooks

### Isolamento de Dados
- **Row Level Security (RLS)** no Supabase
- **Namespaces separados** no KV Store
- **Filas dedicadas** por tenant

### Compliance
- **LGPD/GDPR** ready
- **Logs auditáveis**
- **Criptografia em trânsito e repouso**

## 🧪 Testes

### Executar Testes
```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Cobertura de testes
npm run test:coverage
```

### Tipos de Teste
- **Unitários**: Lógica de negócio isolada
- **Integração**: APIs e banco de dados
- **E2E**: Fluxos completos de usuário
- **Carga**: Performance sob stress
- **Segurança**: Isolamento de tenants

## 📚 Documentação

- [**Guia de Instalação**](docs/installation.md)
- [**API Reference**](docs/api-reference.md)
- [**Arquitetura**](docs/architecture.md)
- [**Configuração Multi-Tenant**](docs/multi-tenant.md)
- [**Sistema RAG**](docs/rag-system.md)
- [**Integração WhatsApp**](docs/whatsapp-integration.md)
- [**Deploy e CI/CD**](docs/deployment.md)
- [**Troubleshooting**](docs/troubleshooting.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Padrões de Código
- **TypeScript** obrigatório
- **ESLint + Prettier** para formatação
- **Conventional Commits** para mensagens
- **Testes** obrigatórios para novas features

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/your-org/aida-platform/issues)
- **Discussões**: [GitHub Discussions](https://github.com/your-org/aida-platform/discussions)
- **Email**: support@aida-platform.com
- **Discord**: [AIDA Community](https://discord.gg/aida-platform)

## 🎯 Roadmap

### v1.1 (Q2 2024)
- [ ] Suporte a múltiplos canais (Telegram, Discord)
- [ ] Interface de treinamento de IA visual
- [ ] Analytics avançados com ML
- [ ] Marketplace de assistentes

### v1.2 (Q3 2024)
- [ ] Integração com CRMs populares
- [ ] Automações visuais (no-code)
- [ ] Suporte a voz (STT/TTS)
- [ ] Mobile app nativo

### v2.0 (Q4 2024)
- [ ] Multi-modal AI (imagem, vídeo)
- [ ] Edge AI com Cloudflare AI
- [ ] Blockchain para auditoria
- [ ] Enterprise features

---

**Desenvolvido com ❤️ pela equipe AIDA**

*Transformando conversas em experiências inteligentes*