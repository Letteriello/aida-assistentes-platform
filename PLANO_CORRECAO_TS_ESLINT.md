# 🔧 Plano de Correção - TypeScript e ESLint
## AIDA Platform - Bug Fix & Code Quality Plan

### 📋 Visão Geral
Este plano detalha a estratégia para identificar e corrigir todos os problemas de TypeScript e ESLint no projeto AIDA Platform, garantindo código limpo, tipado e seguindo as melhores práticas.

---

## 🎯 Objetivos
- ✅ Corrigir 100% dos erros de TypeScript
- ✅ Resolver todos os warnings de ESLint
- ✅ Implementar configurações rigorosas de qualidade de código
- ✅ Configurar hooks de pre-commit para prevenir regressões
- ✅ Documentar padrões de código do projeto

---

## 📊 Fase 1: Diagnóstico Completo

### 1.1 Auditoria TypeScript
```bash
# Backend
cd aida-platform/backend
npm run type-check 2>&1 | tee typescript-errors.log

# Frontend  
cd ../frontend
npm run type-check 2>&1 | tee typescript-errors.log

# Shared
cd ../shared
npx tsc --noEmit 2>&1 | tee typescript-errors.log
```

### 1.2 Auditoria ESLint
```bash
# Backend
cd aida-platform/backend
npm run lint 2>&1 | tee eslint-errors.log

# Frontend
cd ../frontend  
npm run lint 2>&1 | tee eslint-errors.log
```

### 1.3 Categorização de Problemas
- **Críticos**: Erros que impedem build/deploy
- **Altos**: Problemas de type safety
- **Médios**: Warnings e code smells
- **Baixos**: Formatação e estilo

---

## 🔨 Fase 2: Configuração Base

### 2.1 Atualizar Configurações TypeScript

#### Backend - `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "skipLibCheck": false,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"],
      "@tests/*": ["./tests/*"]
    },
    "types": ["@cloudflare/workers-types", "node", "vitest/globals"]
  },
  "include": [
    "src/**/*",
    "tests/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

#### Frontend - `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": false,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/*"]
    }
  },
  "include": [
    "src",
    "app",
    "components",
    "lib"
  ],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2.2 Configurar ESLint Rigoroso

#### Backend - `.eslintrc.json`
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-imports": "error",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error",
    "no-console": "warn"
  },
  "ignorePatterns": ["dist", "node_modules", "coverage"]
}
```

#### Frontend - `.eslintrc.json`
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "next/core-web-vitals"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-imports": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": "error",
    "no-console": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

---

## 🚀 Fase 3: Correção Sistemática

### 3.1 Prioridade 1 - Erros Críticos

#### Problemas Típicos e Soluções:

**1. Tipos ausentes ou incorretos**
```typescript
// ❌ Problema
const data = await fetch('/api/data');
const result = data.json(); // any type

// ✅ Solução
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const data = await fetch('/api/data');
const result: ApiResponse<AssistantData> = await data.json();
```

**2. Imports/Exports inconsistentes**
```typescript
// ❌ Problema
import { something } from './module'; // module não exporta 'something'

// ✅ Solução
import type { SomethingType } from './types';
import { something } from './module';
```

**3. Props não tipadas (React)**
```typescript
// ❌ Problema
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ Solução
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ onClick, children, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

### 3.2 Prioridade 2 - Type Safety

**1. Definir tipos para dados da API**
```typescript
// types/api.ts
export interface Business {
  id: string;
  name: string;
  email: string;
  contact_name: string;
  phone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Assistant {
  id: string;
  business_id: string;
  name: string;
  description: string;
  personality: string;
  system_prompt: string;
  model_config: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
  evolution_config?: {
    instance_id: string;
    instance_name: string;
    status: 'connected' | 'disconnected' | 'connecting';
    phone_number?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

**2. Tipar hooks customizados**
```typescript
// hooks/useAuth.ts
interface UseAuthReturn {
  business: Business | null;
  apiKey: ApiKeyAuth | null;
  loading: boolean;
  signIn: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  isAuthenticated: boolean;
}

export function useAuth(): UseAuthReturn {
  // Implementation
}
```

### 3.3 Prioridade 3 - ESLint Warnings

**1. Unused variables**
```typescript
// ❌ Problema
function processData(data: any, unusedParam: string) {
  return data.map(item => item.id);
}

// ✅ Solução
function processData(data: DataItem[], _unusedParam: string) {
  return data.map(item => item.id);
}
```

**2. Missing awaits**
```typescript
// ❌ Problema
async function saveData() {
  const promise = api.save(data); // Promise não awaited
  return promise;
}

// ✅ Solução
async function saveData(): Promise<SaveResult> {
  const result = await api.save(data);
  return result;
}
```

---

## 🛠️ Fase 4: Automação e Prevenção

### 4.1 Pre-commit Hooks

#### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running type check..."
npm run type-check

echo "🔍 Running ESLint..."
npm run lint

echo "🔍 Running tests..."
npm run test:unit

echo "✅ Pre-commit checks passed!"
```

### 4.2 Prettier Configuration

#### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 4.3 VS Code Settings

#### `.vscode/settings.json`
```json
{
  "typescript.preferences.strictNullChecks": true,
  "typescript.preferences.noImplicitAny": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 📝 Fase 5: Cronograma de Execução

### Semana 1: Setup e Configuração
- [ ] **Dia 1-2**: Auditoria completa e categorização
- [ ] **Dia 3-4**: Atualizar configurações TS/ESLint
- [ ] **Dia 5**: Configurar ferramentas de automação

### Semana 2: Correções Backend
- [ ] **Dia 1-2**: Corrigir erros críticos TypeScript
- [ ] **Dia 3-4**: Resolver warnings ESLint
- [ ] **Dia 5**: Testes e validação

### Semana 3: Correções Frontend
- [ ] **Dia 1-2**: Corrigir erros críticos TypeScript
- [ ] **Dia 3-4**: Resolver warnings ESLint
- [ ] **Dia 5**: Testes e validação

### Semana 4: Refinamento e Documentação
- [ ] **Dia 1-2**: Ajustes finais e otimizações
- [ ] **Dia 3-4**: Documentação de padrões
- [ ] **Dia 5**: Validação final e deploy

---

## 🎯 Scripts de Validação

### Validation Script - `scripts/validate-code-quality.sh`
```bash
#!/bin/bash

echo "🔍 AIDA Platform - Code Quality Validation"
echo "========================================"

ERRORS=0

# TypeScript Check
echo "📋 Checking TypeScript..."
cd backend && npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Backend TypeScript errors found"
    ERRORS=$((ERRORS + 1))
fi

cd ../frontend && npm run type-check  
if [ $? -ne 0 ]; then
    echo "❌ Frontend TypeScript errors found"
    ERRORS=$((ERRORS + 1))
fi

# ESLint Check
echo "📋 Checking ESLint..."
cd ../backend && npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Backend ESLint errors found"
    ERRORS=$((ERRORS + 1))
fi

cd ../frontend && npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Frontend ESLint errors found"
    ERRORS=$((ERRORS + 1))
fi

# Test Coverage
echo "📋 Running Tests..."
cd ../backend && npm run test:coverage
if [ $? -ne 0 ]; then
    echo "❌ Backend tests failed"
    ERRORS=$((ERRORS + 1))
fi

cd ../frontend && npm run test
if [ $? -ne 0 ]; then
    echo "❌ Frontend tests failed"
    ERRORS=$((ERRORS + 1))
fi

# Final Report
if [ $ERRORS -eq 0 ]; then
    echo "✅ All code quality checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS issue(s). Please fix before proceeding."
    exit 1
fi
```

---

## 📚 Padrões de Código Estabelecidos

### TypeScript Guidelines
1. **Sempre usar interfaces em vez de types** para objetos
2. **Evitar `any`** - usar `unknown` quando necessário
3. **Usar strict null checks** sempre
4. **Prefixar unused parameters** com underscore
5. **Importar types separadamente** com `import type`

### React Guidelines
1. **Props sempre tipadas** com interfaces
2. **Usar `React.FC` apenas quando necessário**
3. **Hooks customizados tipados** com return types
4. **Event handlers tipados** corretamente
5. **Ref types explícitos** quando usar useRef

### Code Style
1. **Prettier para formatação** automática
2. **ESLint para qualidade** de código
3. **Nomenclatura consistente** (camelCase, PascalCase)
4. **Imports organizados** automaticamente
5. **Comments em português** para lógica de negócio

---

## 🎉 Critérios de Sucesso

### Métricas Obrigatórias:
- ✅ **0 erros de TypeScript** em todos os projetos
- ✅ **0 warnings de ESLint** críticos ou de erro
- ✅ **Cobertura de testes >80%** mantida
- ✅ **Build/deploy sem erros** em todos os ambientes
- ✅ **Pre-commit hooks** funcionando corretamente

### Métricas de Qualidade:
- ✅ **Code complexity** dentro dos limites
- ✅ **Bundle size** otimizado
- ✅ **Performance** não degradada
- ✅ **Documentação** atualizada

---

## 🔄 Monitoramento Contínuo

### Daily Checks:
```bash
# Executar diariamente
npm run type-check && npm run lint && npm run test
```

### Weekly Reports:
- Revisão de métricas de código
- Análise de debt técnico
- Planejamento de melhorias

### Tools:
- **SonarQube** para análise contínua
- **CodeClimate** para métricas
- **GitHub Actions** para CI/CD

---

Este plano garante que o projeto AIDA Platform tenha código limpo, tipado e seguindo as melhores práticas, com prevenção automática de regressões.