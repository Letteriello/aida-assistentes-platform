# AIDA PLATFORM - PLANO MVP SIMPLIFICADO

## 🎯 VISÃO GERAL
Sistema de assistentes IA para WhatsApp com **ZERO custos** além de Supabase e EasyPanel.

## 💰 MODELO DE NEGÓCIO SIMPLIFICADO
- **R$ 250/mês por instância WhatsApp**
- **1.000 mensagens/mês** por instância
- **10 documentos máximo** por instância
- **LLMs**: GPT-4 Turbo Mini ou Gemini 2.5 Flash (mais baratos)

## 🏗️ ARQUITETURA 100% GRATUITA

### Backend
- ✅ **Node.js + Express** (substitui Cloudflare Workers)
- ✅ **Supabase** (PostgreSQL + Auth + Vector embeddings)
- ✅ **Neo4j Community** (Knowledge Graph - gratuito)
- ✅ **Evolution API** (integração WhatsApp)

### Frontend
- ✅ **Next.js** (gratuito)
- ✅ **Tailwind CSS** (gratuito)
- ✅ **ShadcnUI** ou **Origin UI** (componentes gratuitos)

### Deploy
- ✅ **EasyPanel** (seu servidor VPS)
- ✅ **Docker** (containerização)

## 📱 INTERFACE SIMPLIFICADA (3 PÁGINAS)

### 1. **Conectar WhatsApp**
- QR Code da Evolution API
- Status da conexão
- Informações da instância

### 2. **Configurar Assistente** (Engenharia de Contexto)
- **Dados da Empresa**: Nome, tipo, descrição, público-alvo
- **Produtos/Serviços**: Catálogo estruturado
- **Políticas**: Atendimento, privacidade, etc.
- **Personalidade**: Tom de voz, estilo de comunicação
- **Instruções Personalizadas**: Campo livre para ajustes

### 3. **Dashboard de Uso** (Opcional)
- Mensagens enviadas/recebidas
- Documentos carregados
- Status de cobrança
- Estatísticas básicas

## 🔐 AUTENTICAÇÃO VIA WHATSAPP

### Sistema Simplificado
1. **Usuário digita número de telefone**
2. **Sistema envia código de 6 dígitos via WhatsApp**
3. **Usuário confirma código**
4. **Acesso liberado**

### Configuração Admin
- Uma instância WhatsApp dedicada para envio de códigos
- Configurada pelo administrador da plataforma

## 💾 BANCO DE DADOS OTIMIZADO

### Tabelas Principais
```sql
-- Usuários (autenticação simples)
users (id, phone_number, verification_code, is_verified)

-- Instâncias WhatsApp (produto principal)
whatsapp_instances (
  id, user_id, instance_name, status, 
  assistant_name, messages_used, documents_used,
  subscription_status, next_billing_date
)

-- Contexto do Negócio (engenharia de contexto)
business_context (
  instance_id, business_name, business_type,
  products_services, policies, tone_of_voice
)

-- Documentos (max 10 por instância)
documents (instance_id, filename, content, embeddings)

-- Conversas e Mensagens
conversations (instance_id, customer_phone, context_summary)
messages (conversation_id, content, sender_type, embeddings)

-- Grafo de Conhecimento
knowledge_entities (instance_id, entity_type, entity_name, properties)
knowledge_relationships (source_entity_id, target_entity_id, relationship_type)
```

## 🤖 SISTEMA RAG HÍBRIDO

### Busca Vetorial (Supabase)
- Embeddings dos documentos
- Embeddings das mensagens
- Busca por similaridade semântica

### Grafo de Conhecimento (Neo4j)
- Entidades: Produtos, Serviços, Políticas, Pessoas
- Relacionamentos: "produto X relacionado_com política Y"
- Busca por relacionamentos complexos

### Integração
1. **Query do usuário** → Busca vetorial (similaridade)
2. **Entidades encontradas** → Busca no grafo (relacionamentos)
3. **Contexto completo** → LLM para resposta

## 📦 DEPLOY NO EASYPANEL

### Dockerfile Unificado
```dockerfile
# Multi-stage build
# Stage 1: Build frontend e backend
# Stage 2: Neo4j setup
# Stage 3: Runtime com Nginx reverse proxy
# Stage 4: Supervisor para gerenciar todos os serviços
```

### Serviços no Container
- **Frontend** (Next.js) - porta 3000
- **Backend** (Express) - porta 8787
- **Neo4j** - porta 7687/7474
- **Nginx** - porta 80 (proxy reverso)

## 🚀 PLANO DE IMPLEMENTAÇÃO

### Fase 1: Backend Básico ✅
- [x] Migração do banco simplificada
- [x] Dockerfile para EasyPanel
- [x] Express server
- [ ] Rotas de autenticação via WhatsApp
- [ ] Integração Evolution API

### Fase 2: Frontend Simplificado
- [ ] 3 páginas principais
- [ ] Autenticação via telefone
- [ ] Interface para conectar WhatsApp
- [ ] Formulários de contexto estruturado

### Fase 3: Sistema RAG
- [ ] Processamento de documentos
- [ ] Embeddings no Supabase
- [ ] Grafo de conhecimento no Neo4j
- [ ] Query engine híbrido

### Fase 4: Cobrança
- [ ] Sistema de billing simplificado
- [ ] Controle de limites (1000 msg, 10 docs)
- [ ] Renovação automática

### Fase 5: Deploy
- [ ] Testes no ambiente local
- [ ] Deploy no EasyPanel
- [ ] Configuração Evolution API
- [ ] Instância admin para auth

## 📊 LIMITES E CONTROLES

### Por Instância (R$ 250/mês)
- **Mensagens**: 1.000/mês (reset automático)
- **Documentos**: 10 máximo (sem reset)
- **Storage**: Limitado pelo Supabase free tier
- **Processing**: Sem limite (CPU do EasyPanel)

### Monitoramento
- Contador de mensagens em tempo real
- Bloqueio automático ao atingir limite
- Notificações de renovação

## 🔧 CONFIGURAÇÕES OBRIGATÓRIAS

### Variáveis de Ambiente
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_secure_neo4j_password

# Evolution API
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_global_api_key

# OpenAI/Gemini
OPENAI_API_KEY=your_openai_key
# ou
GOOGLE_API_KEY=your_google_key

# Admin WhatsApp Instance (para auth)
ADMIN_INSTANCE_NAME=admin-auth-instance
ADMIN_PHONE_NUMBER=+5511999999999
```

## ✅ PRÓXIMOS PASSOS

1. **Finalizar migração do backend** para Express.js
2. **Criar interface de 3 páginas** no frontend
3. **Implementar autenticação via WhatsApp**
4. **Integrar Evolution API** para gerenciar instâncias
5. **Desenvolver sistema RAG híbrido**
6. **Configurar cobrança e limites**
7. **Deploy no EasyPanel** com Docker
8. **Testes e validação** do MVP

## 🎯 MÉTRICAS DE SUCESSO

- **Tempo de onboarding**: < 5 minutos
- **Uptime**: > 99.5%
- **Latência de resposta**: < 2 segundos
- **Satisfação do cliente**: > 4.5/5
- **Churn rate**: < 5% ao mês
- **Revenue per user**: R$ 250/mês

---

**Status**: 🚧 Em desenvolvimento
**Última atualização**: Janeiro 2025
**Responsável**: Equipe AIDA Platform