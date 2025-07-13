# AIDA Assistentes - Frontend

Frontend da plataforma AIDA Assistentes, construído com Next.js 14, React 18, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: React Query (TanStack Query)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Charts**: Recharts
- **Testing**: Vitest + Playwright

## 📦 Instalação

1. **Clone o repositório e navegue para o frontend**:
```bash
cd frontend
```

2. **Instale as dependências**:
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API Configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
```

4. **Execute o servidor de desenvolvimento**:
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000).

## 🏗️ Estrutura do Projeto

```
frontend/
├── app/                    # App Router (Next.js 14)
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial (Dashboard)
├── components/            # Componentes React
│   ├── ui/               # Componentes base (Shadcn/UI)
│   ├── dashboard/        # Componentes do dashboard
│   └── providers.tsx     # Provedores de contexto
├── lib/                  # Utilitários e configurações
│   ├── utils.ts         # Funções utilitárias
│   └── supabase.ts      # Cliente Supabase
├── shared/              # Tipos e schemas compartilhados
│   └── types/           # Definições TypeScript
└── public/              # Arquivos estáticos
```

## 🎨 Componentes UI

O projeto utiliza o **Shadcn/UI**, uma coleção de componentes reutilizáveis construídos com Radix UI e Tailwind CSS.

### Componentes Disponíveis:
- `Button` - Botões com variantes e tamanhos
- `Card` - Cards para organizar conteúdo
- `Badge` - Badges para status e categorias
- `Avatar` - Avatares de usuário
- `Toast` - Notificações temporárias
- `LoadingSpinner` - Indicadores de carregamento

### Adicionando Novos Componentes:
```bash
npx shadcn-ui@latest add [component-name]
```

## 📊 Dashboard

O dashboard principal inclui:

- **Header**: Saudação personalizada e ações rápidas
- **Estatísticas**: Métricas em tempo real dos assistentes
- **Conversas Recentes**: Lista das últimas interações
- **Visão Geral dos Assistentes**: Status e performance
- **Ações Rápidas**: Shortcuts para funcionalidades principais

## 🔐 Autenticação

A autenticação é gerenciada pelo Supabase Auth com:

- Login/Registro por email e senha
- Sessões persistentes
- Proteção de rotas
- Gerenciamento de perfis de usuário

## 📱 Responsividade

O design é totalmente responsivo, otimizado para:

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com navegação colapsável
- **Mobile**: Interface otimizada para toque

## 🧪 Testes

### Testes Unitários (Vitest):
```bash
npm run test
```

### Testes E2E (Playwright):
```bash
npm run test:e2e
```

### Coverage:
```bash
npm run test:coverage
```

## 🚀 Build e Deploy

### Build de Produção:
```bash
npm run build
```

### Preview Local:
```bash
npm run start
```

### Deploy:
O projeto está configurado para deploy em:
- **Vercel** (recomendado para Next.js)
- **Netlify**
- **Docker** (Dockerfile incluído)

## 🔧 Configuração Avançada

### Customização do Tema:
Edite `tailwind.config.js` para personalizar cores, fontes e espaçamentos.

### Variáveis CSS:
O arquivo `globals.css` contém variáveis CSS para temas claro/escuro.

### TypeScript:
Configuração estrita habilitada em `tsconfig.json` com paths absolutos.

## 📚 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting com ESLint
npm run lint:fix     # Fix automático de lint
npm run type-check   # Verificação de tipos
npm run test         # Testes unitários
npm run test:e2e     # Testes E2E
npm run test:coverage # Coverage dos testes
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](../LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:
- Abra uma [issue](https://github.com/seu-usuario/aida-platform/issues)
- Entre em contato via email: suporte@aida-assistentes.com

---

**AIDA Assistentes** - Transformando atendimento com IA 🤖✨