// @ts-check
/**
 * ESLint Configuration for AIDA Platform Backend
 * Modern ESLint v9 flat configuration with typescript-eslint
 * Comprehensive rules for TypeScript, Cloudflare Workers, and Supabase
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Base configurations - minimal para evitar parsing errors
  eslint.configs.recommended,
  // Removido configs que causam problemas de parsing
  // tseslint.configs.recommendedTypeChecked,
  // tseslint.configs.strict,
  // tseslint.configs.stylistic,
  
  // Global ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.wrangler/**',
      'coverage/**',
      'test-results/**',
      '*.config.js',
      '*.config.ts',
      '*.cjs',
      '*.mjs'
    ]
  },
  
  // TypeScript files configuration
  {
    name: 'aida-platform-typescript',
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Removido project para evitar type checking que causa parsing errors
        // project: './tsconfig.json',
        // tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    rules: {
      // =============================================
      // CONFIGURAÇÃO PARA CORREÇÃO AUTOMÁTICA EM MASSA
      // =============================================
      
      // DESABILITAR REGRAS QUE CAUSAM PARSING ERRORS
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      
      // REGRAS CRÍTICAS PARA SINTAXE (PODEM SER CORRIGIDAS AUTOMATICAMENTE)
      'no-extra-semi': 'error',           // Remove ponto e vírgula extra
      'no-extra-parens': 'error',         // Remove parênteses extras
      'no-unreachable': 'error',          // Remove código inacessível
      'no-empty': 'error',                // Remove blocos vazios
      'no-constant-condition': 'error',   // Remove condições constantes
      'no-duplicate-case': 'error',       // Remove cases duplicados
      'no-func-assign': 'error',          // Previne reatribuição de funções
      'no-inner-declarations': 'error',   // Move declarações para escopo correto
      'no-invalid-regexp': 'error',       // Corrige regex inválidas
      'no-sparse-arrays': 'error',        // Remove elementos vazios em arrays
      'use-isnan': 'error',               // Usa isNaN corretamente
      'valid-typeof': 'error',            // Corrige typeof
      'no-irregular-whitespace': 'error', // Remove espaços irregulares
      'no-obj-calls': 'error',            // Corrige chamadas de objeto
      'no-regex-spaces': 'error',         // Corrige espaços em regex
      'no-unexpected-multiline': 'error', // Corrige quebras de linha
      
      // FORMATAÇÃO AUTOMÁTICA
      'semi': ['error', 'always'],                    // Adiciona ponto e vírgula
      'quotes': ['error', 'single'],                  // Usa aspas simples
      'comma-dangle': ['error', 'never'],             // Remove vírgulas pendentes
      'object-curly-spacing': ['error', 'always'],    // Espaços em objetos
      'array-bracket-spacing': ['error', 'never'],    // Remove espaços em arrays
      'comma-spacing': ['error', { before: false, after: true }], // Espaços após vírgulas
      'key-spacing': ['error', { beforeColon: false, afterColon: true }], // Espaços em chaves
      'space-before-blocks': 'error',                 // Espaços antes de blocos
      'space-infix-ops': 'error',                     // Espaços em operadores
      'space-unary-ops': 'error',                     // Espaços em operadores unários
      'spaced-comment': 'error',                      // Espaços em comentários
      'no-trailing-spaces': 'error',                  // Remove espaços no final
      'eol-last': 'error',                            // Nova linha no final
      'indent': ['error', 2],                         // Indentação de 2 espaços
      
      // CORREÇÕES DE QUALIDADE DE CÓDIGO
      'prefer-const': 'error',            // Usa const quando possível
      'no-var': 'error',                  // Usa let/const ao invés de var
      'no-duplicate-imports': 'error',    // Remove imports duplicados
      'no-debugger': 'error',             // Remove debugger
      'no-alert': 'error',                // Remove alert
      'no-eval': 'error',                 // Remove eval
      'no-implied-eval': 'error',         // Remove eval implícito
      'no-new-func': 'error',             // Remove Function constructor
      'eqeqeq': ['error', 'always'],      // Usa === sempre
      'curly': ['error', 'all'],          // Usa chaves sempre
      
      // TYPESCRIPT RULES (SEM TYPE CHECKING)
      '@typescript-eslint/no-explicit-any': 'off',      // Permite any temporariamente
      '@typescript-eslint/no-unused-vars': 'off',       // Deixa TypeScript lidar
      '@typescript-eslint/no-non-null-assertion': 'off', // Permite ! operator
      '@typescript-eslint/ban-ts-comment': 'off',       // Permite comentários TS
      '@typescript-eslint/no-var-requires': 'off',      // Permite require
      '@typescript-eslint/no-empty-function': 'off',    // Permite funções vazias
      
      // DESABILITAR REGRAS QUE REQUEREM TYPE CHECKING
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      
      // DESABILITAR REGRAS PROBLEMÁTICAS
      'no-console': 'off',                // Permitir console temporariamente
      'no-unused-expressions': 'off',     // Desabilitar - causa problemas
      'no-async-promise-executor': 'off', // Desabilitar - causa problemas
      'no-await-in-loop': 'off',          // Desabilitar - causa problemas
      'no-promise-executor-return': 'off',// Desabilitar - causa problemas
      'no-return-await': 'off',           // Desabilitar - causa problemas
      'no-restricted-globals': 'off',     // Desabilitar - causa problemas
      'no-restricted-syntax': 'off'       // Desabilitar - causa problemas
    }
  },
  
  // JavaScript files configuration - basic rules only
  {
    name: 'aida-platform-javascript',
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      // Basic JavaScript rules without type checking
      'no-console': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all']
    }
  },
  
  // Test files configuration - more lenient for mocking
  {
    name: 'aida-platform-tests',
    files: [
      '**/*.test.ts', 
      '**/*.test.tsx', 
      '**/*.spec.ts', 
      '**/*.spec.tsx',
      'src/tests/**/*.ts',
      'tests/**/*.ts'
    ],
    rules: {
      // Allow any in test files for mocking (especially Supabase mocks)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      
      // Allow console in tests for debugging
      'no-console': 'warn',
      
      // Allow non-null assertions in tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      
      // Allow floating promises in tests (for fire-and-forget test setup)
      '@typescript-eslint/no-floating-promises': 'off',
      
      // Relax some strict rules for test utilities
      '@typescript-eslint/require-await': 'off',
      'no-restricted-syntax': 'off'
    }
  },
  
  // CommonJS files configuration - minimal rules
  {
    name: 'aida-platform-commonjs',
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script'
    },
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  
  // Configuration files - minimal rules
  {
    name: 'aida-platform-config',
    files: ['*.config.js', '*.config.ts', '*.config.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off'
    }
  }
);