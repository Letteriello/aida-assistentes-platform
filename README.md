# AIDA Platform - AI-Powered WhatsApp Assistant Platform

<div align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow" alt="Status">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp">
</div>

## 🚀 Visão Geral

A **AIDA Platform** é uma solução completa e escalável para criação e gerenciamento de assistentes de IA integrados ao WhatsApp. Desenvolvida com arquitetura moderna e foco em performance, a plataforma oferece recursos avançados de RAG (Retrieval-Augmented Generation), multi-tenancy e integração nativa com APIs do WhatsApp.

### ✨ Características Principais

- **🏢 Arquitetura Multi-Tenant**: Isolamento completo de dados entre organizações
- **🧠 RAG Híbrido**: Combinação de busca vetorial e keyword search para máxima precisão
- **📱 Integração WhatsApp**: Suporte nativo às APIs oficiais do WhatsApp Business
- **⚡ Performance**: Otimizado para alta concorrência e baixa latência
- **🔒 Segurança**: Criptografia end-to-end e compliance com LGPD/GDPR
- **📊 Analytics**: Dashboards em tempo real com métricas detalhadas
- **🔧 Extensível**: Arquitetura modular para fácil customização

## 🏗️ Arquitetura do Sistema

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js Dashboard]
        B[React Components]
        C[Tailwind CSS]
    end
    
    subgraph "API Layer"
        D[Express.js API]
        E[Authentication]
        F[Rate Limiting]
    end
    
    subgraph "Business Logic"
        G[Assistant Manager]
        H[RAG Engine]
        I[WhatsApp Handler]
    end
    
    subgraph "Data Layer"
        J[Supabase PostgreSQL]
        K[Vector Store]
        L[Redis Cache]
    end
    
    subgraph "External Services"
        M[WhatsApp API]
        N[OpenAI/Anthropic]
        O[File Storage]
    end
    
    A --> D
    D --> G
    G --> H
    G --> I
    H --> K
    I --> M
    G --> N
    D --> J
    D --> L
```

## 📁 Estrutura do Projeto

```
aida-platform/
├── 📁 frontend/                 # Interface web (Next.js)
│   ├── 📁 app/                 # App Router do Next.js 14
│   ├── 📁 components/          # Componentes React reutilizáveis
│   ├── 📁 lib/                 # Utilitários e configurações
│   └── 📁 public/              # Assets estáticos
├── 📁 backend/                  # API e lógica de negócio
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Controladores da API
│   │   ├── 📁 services/        # Lógica de negócio
│   │   ├── 📁 models/          # Modelos de dados
│   │   ├── 📁 middleware/      # Middlewares Express
│   │   └── 📁 utils/           # Utilitários
│   └── 📁 tests/               # Testes automatizados
├── 📁 shared/                   # Código compartilhado
│   ├── 📁 types/               # Definições TypeScript
│   ├── 📁 schemas/             # Schemas de validação
│   └── 📁 constants/           # Constantes globais
├── 📁 docs/                     # Documentação
└── 📁 .github/                  # Workflows CI/CD
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn/ui**: Componentes UI modernos
- **React Hook Form**: Gerenciamento de formulários
- **Zustand**: Gerenciamento de estado

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **TypeScript**: Tipagem estática
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e sessões
- **Prisma**: ORM TypeScript

### IA e ML
- **OpenAI GPT-4**: Modelo de linguagem principal
- **Anthropic Claude**: Modelo alternativo
- **LangChain**: Framework para aplicações LLM
- **Pinecone/Weaviate**: Vector database
- **Sentence Transformers**: Embeddings

### DevOps e Infraestrutura
- **Docker**: Containerização
- **Vercel**: Deploy do frontend
- **Railway/Render**: Deploy do backend
- **GitHub Actions**: CI/CD
- **Sentry**: Monitoramento de erros

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Docker (opcional)
- Conta Supabase
- Chaves API (OpenAI, WhatsApp)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/your-org/aida-platform.git
cd aida-platform
```

2. **Instale as dependências**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install

# Shared
cd ../shared
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Frontend (.env.local)
cp frontend/.env.example frontend/.env.local

# Backend (.env)
cp backend/.env.example backend/.env
```

4. **Configure o banco de dados**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

5. **Inicie os serviços**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Configuração com Docker

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Apenas desenvolvimento
docker-compose -f docker-compose.dev.yml up
```

## ⚙️ Configuração

### Variáveis de Ambiente

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aida
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# WhatsApp
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

## 📊 Monitoramento e Observabilidade

### Métricas Principais
- **Latência de resposta**: < 2s para 95% das requisições
- **Disponibilidade**: 99.9% uptime
- **Throughput**: 1000+ mensagens/minuto
- **Precisão RAG**: > 85% relevância

### Dashboards
- **Grafana**: Métricas de sistema e aplicação
- **Sentry**: Monitoramento de erros
- **Supabase**: Métricas de banco de dados
- **Custom**: Dashboard interno com KPIs

### Logs
```bash
# Logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs backend
docker-compose logs frontend
```

## 🔒 Segurança

### Autenticação e Autorização
- **JWT**: Tokens seguros com refresh
- **RBAC**: Controle baseado em roles
- **MFA**: Autenticação multi-fator
- **OAuth**: Integração com provedores externos

### Proteção de Dados
- **Criptografia**: AES-256 para dados sensíveis
- **HTTPS**: TLS 1.3 obrigatório
- **Rate Limiting**: Proteção contra abuse
- **Input Validation**: Sanitização rigorosa

### Compliance
- **LGPD**: Conformidade com lei brasileira
- **GDPR**: Conformidade europeia
- **SOC 2**: Controles de segurança
- **ISO 27001**: Gestão de segurança

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
