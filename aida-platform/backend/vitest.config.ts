/**
 * AIDA Platform - Vitest Configuration
 * Testing setup for Node.js environment with mocked Cloudflare Workers APIs
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Use Node.js environment for simpler testing
    environment: 'node',
    
    // Environment variables for testing
    env: {
      ENVIRONMENT: 'test',
      LOG_LEVEL: 'debug',
      OPENAI_API_KEY: 'test-openai-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      EVOLUTION_API_KEY: 'test-evolution-key',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-supabase-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-supabase-service-key',
    },
    
    // Test configuration
    globals: true,
    testTimeout: 30000, // 30 seconds for complex AI operations
    hookTimeout: 10000, // 10 seconds for setup/teardown
    teardownTimeout: 5000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/tests/**',
        'coverage/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80,
        },
        // Critical modules should have higher coverage
        'src/database/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/evolution-api/**': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/rag/**': {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html',
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'src/tests/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
    ],
    
    // Setup files
    setupFiles: [
      './src/tests/setup.ts',
    ],
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Pool configuration for parallel testing
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1,
      },
    },
    
    // Retry configuration for flaky tests
    retry: 2,
    
    // Sequence configuration
    sequence: {
      shuffle: true,
      concurrent: true,
    },
    
    // File watching
    watchExclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-results/**',
    ],
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
      '@tests': resolve(__dirname, './src/tests'),
    },
  },
  
  // Build configuration for testing
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.VITEST': JSON.stringify('true'),
  },
  
  // Optimization for faster testing
  optimizeDeps: {
    include: [
      'vitest/globals',
      '@vitest/utils',
    ],
  },
  
  // ESBuild configuration
  esbuild: {
    target: 'esnext',
    format: 'esm',
    platform: 'neutral',
  },
});