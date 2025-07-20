/**
 * AIDA Platform - Sistema de Logging Estruturado
 *
 * Implementa logging otimizado com diferentes níveis e formatação
 * PERFORMANCE: Evita operações custosas em produção
 *
 * CARACTERÍSTICAS:
 * - Níveis de log configuráveis
 * - Formatação JSON estruturada
 * - Sampling para reduzir volume
 * - Bufferização para melhor performance
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  businessId?: string;
  userId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    operation: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  environment: 'development' | 'staging' | 'production';
  enableSampling?: boolean;
  samplingRate?: number;
  bufferSize?: number;
  flushInterval?: number;
}

/**
 * Logger otimizado com bufferização
 */
export class StructuredLogger {
  private readonly config: LoggerConfig;
  private readonly buffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly isProduction: boolean;

  constructor(config: LoggerConfig) {
    this.config = {
      bufferSize: 100,
      flushInterval: 5000, // 5 segundos
      enableSampling: false,
      samplingRate: 0.1,
      ...config
    };

    this.isProduction = config.environment === 'production';
    this.startFlushTimer();
  }

  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.DEBUG && !this.isProduction) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  /**
   * Log de informação
   */
  info(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log(LogLevel.INFO, message, context);
    }
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.WARN) {
      this.log(LogLevel.WARN, message, context);
    }
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.ERROR) {
      const errorContext = error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined;

      this.log(LogLevel.ERROR, message, {
        ...context,
        error: errorContext
      });
    }
  }

  /**
   * Log de erro fatal
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    const errorContext = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;

    this.log(LogLevel.FATAL, message, {
      ...context,
      error: errorContext
    });

    // Força flush imediato para erros fatais
    this.flush();
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    if (this.config.level <= LogLevel.INFO) {
      this.log(LogLevel.INFO, `Performance: ${operation}`, {
        ...context,
        performance: {
          operation,
          duration
        }
      });
    }
  }

  /**
   * Wrapper para cronometrar operações
   */
  async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.performance(operation, duration, context);

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      this.error(
        `Operação ${operation} falhou após ${duration.toFixed(2)}ms`,
        error as Error,
        context
      );

      throw error;
    }
  }

  /**
   * Log estruturado principal
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    // Aplica sampling se configurado
    if (this.config.enableSampling && level < LogLevel.ERROR) {
      if (Math.random() > (this.config.samplingRate || 0.1)) {
        return;
      }
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
      requestId: context?.requestId,
      businessId: context?.businessId,
      userId: context?.userId
    };

    // Adiciona ao buffer
    this.buffer.push(entry);

    // Flush automático se buffer está cheio
    if (this.buffer.length >= (this.config.bufferSize || 100)) {
      this.flush();
    }
  }

  /**
   * Força flush do buffer
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const entries = this.buffer.splice(0);

    // Em produção, envia para serviço de logging
    if (this.isProduction) {
      this.sendToLoggingService(entries);
    } else {
      // Em desenvolvimento, imprime no console
      for (const entry of entries) {
        this.printToConsole(entry);
      }
    }
  }

  /**
   * Imprime no console formatado
   */
  private printToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.padEnd(5);
    const message = entry.message;

    let output = `[${timestamp}] ${level} ${message}`;

    if (entry.context) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    if (entry.performance) {
      output += `\n  Performance: ${entry.performance.operation} took ${entry.performance.duration.toFixed(2)}ms`;
    }

    // Usa cores diferentes para cada nível
    switch (entry.level) {
    case 'DEBUG':
      console.log('\x1b[36m%s\x1b[0m', output); // Cyan
      break;
    case 'INFO':
      console.log('\x1b[32m%s\x1b[0m', output); // Green
      break;
    case 'WARN':
      console.log('\x1b[33m%s\x1b[0m', output); // Yellow
      break;
    case 'ERROR':
      console.log('\x1b[31m%s\x1b[0m', output); // Red
      break;
    case 'FATAL':
      console.log('\x1b[35m%s\x1b[0m', output); // Magenta
      break;
    default:
      console.log(output);
    }
  }

  /**
   * Envia para serviço de logging em produção
   */
  private sendToLoggingService(entries: LogEntry[]): void {
    // Em produção, isso seria enviado para um serviço como:
    // - Cloudflare Analytics
    // - DataDog
    // - New Relic
    // - Custom logging service

    // Por enquanto, apenas imprime JSON estruturado
    for (const entry of entries) {
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Inicia timer para flush automático
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 5000);
  }

  /**
   * Limpa recursos
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush final
    this.flush();
  }
}

/**
 * Context logger para rastrear requisições
 */
export class ContextLogger {
  private readonly logger: StructuredLogger;
  private readonly context: Record<string, any>;

  constructor(logger: StructuredLogger, context: Record<string, any>) {
    this.logger = logger;
    this.context = context;
  }

  debug(message: string, additionalContext?: Record<string, any>): void {
    this.logger.debug(message, { ...this.context, ...additionalContext });
  }

  info(message: string, additionalContext?: Record<string, any>): void {
    this.logger.info(message, { ...this.context, ...additionalContext });
  }

  warn(message: string, additionalContext?: Record<string, any>): void {
    this.logger.warn(message, { ...this.context, ...additionalContext });
  }

  error(message: string, error?: Error, additionalContext?: Record<string, any>): void {
    this.logger.error(message, error, { ...this.context, ...additionalContext });
  }

  fatal(message: string, error?: Error, additionalContext?: Record<string, any>): void {
    this.logger.fatal(message, error, { ...this.context, ...additionalContext });
  }

  performance(operation: string, duration: number, additionalContext?: Record<string, any>): void {
    this.logger.performance(operation, duration, { ...this.context, ...additionalContext });
  }

  async timeOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    additionalContext?: Record<string, any>
  ): Promise<T> {
    return this.logger.timeOperation(operation, fn, { ...this.context, ...additionalContext });
  }

  /**
   * Cria novo context logger com contexto adicional
   */
  child(additionalContext: Record<string, any>): ContextLogger {
    return new ContextLogger(this.logger, { ...this.context, ...additionalContext });
  }
}

/**
 * Logger global singleton
 */
export class GlobalLogger {
  private static instance: GlobalLogger | null = null;
  private logger: StructuredLogger | null = null;

  private constructor() {}

  static getInstance(): GlobalLogger {
    if (!GlobalLogger.instance) {
      GlobalLogger.instance = new GlobalLogger();
    }
    return GlobalLogger.instance;
  }

  /**
   * Inicializa logger global
   */
  initialize(config: LoggerConfig): void {
    if (this.logger) {
      this.logger.destroy();
    }

    this.logger = new StructuredLogger(config);
  }

  /**
   * Obtém logger principal
   */
  getLogger(): StructuredLogger {
    if (!this.logger) {
      throw new Error('Logger não inicializado. Chame GlobalLogger.initialize() primeiro.');
    }
    return this.logger;
  }

  /**
   * Cria context logger
   */
  createContextLogger(context: Record<string, any>): ContextLogger {
    return new ContextLogger(this.getLogger(), context);
  }

  /**
   * Limpa recursos
   */
  destroy(): void {
    if (this.logger) {
      this.logger.destroy();
      this.logger = null;
    }
  }
}

// Configurações padrão para diferentes ambientes
export const LoggerConfigs = {
  DEVELOPMENT: {
    level: LogLevel.DEBUG,
    environment: 'development' as const,
    enableSampling: false,
    bufferSize: 1,
    flushInterval: 100
  },

  STAGING: {
    level: LogLevel.INFO,
    environment: 'staging' as const,
    enableSampling: true,
    samplingRate: 0.5,
    bufferSize: 50,
    flushInterval: 2000
  },

  PRODUCTION: {
    level: LogLevel.WARN,
    environment: 'production' as const,
    enableSampling: true,
    samplingRate: 0.1,
    bufferSize: 100,
    flushInterval: 5000
  }
} as const;

// Funções de conveniência para usar o logger global
export const logger = {
  debug: (message: string, context?: Record<string, any>) => {
    try {
      GlobalLogger.getInstance().getLogger().debug(message, context);
    } catch (error) {
      console.log(`[DEBUG] ${message}`, context);
    }
  },

  info: (message: string, context?: Record<string, any>) => {
    try {
      GlobalLogger.getInstance().getLogger().info(message, context);
    } catch (error) {
      console.log(`[INFO] ${message}`, context);
    }
  },

  warn: (message: string, context?: Record<string, any>) => {
    try {
      GlobalLogger.getInstance().getLogger().warn(message, context);
    } catch (error) {
      console.log(`[WARN] ${message}`, context);
    }
  },

  error: (message: string, error?: Error, context?: Record<string, any>) => {
    try {
      GlobalLogger.getInstance().getLogger().error(message, error, context);
    } catch (logError) {
      console.error(`[ERROR] ${message}`, error, context);
    }
  },

  fatal: (message: string, error?: Error, context?: Record<string, any>) => {
    try {
      GlobalLogger.getInstance().getLogger().fatal(message, error, context);
    } catch (logError) {
      console.error(`[FATAL] ${message}`, error, context);
    }
  }
};
