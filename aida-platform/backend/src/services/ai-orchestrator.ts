/**
 * AIDA Platform - AI Orchestrator
 * Orchestrates AI response generation with multiple providers and models
 * Provides a unified interface for AI interactions across the platform
 */

import { z } from "zod";
import { logger } from "../utils/logger";
import { validateInput } from "../utils/validation";

// Schemas de validação
const GenerateResponseSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
    timestamp: z.number().optional(),
    metadata: z.record(z.any()).optional()
  })).optional(),
  ragContext: z.object({
    sources: z.array(z.object({
      content: z.string(),
      metadata: z.record(z.any()),
      score: z.number()
    })),
    summary: z.string().optional()
  }).optional(),
  assistantConfig: z.object({
    name: z.string(),
    instructions: z.string(),
    model: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet", "claude-3-haiku"]),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(4000).default(1000),
    responseStyle: z.enum(["formal", "casual", "technical", "friendly"]).default("friendly"),
    language: z.string().default("pt-BR")
  }),
  userId: z.string().uuid(),
  businessId: z.string().uuid()
});

export interface AIProvider {
  name: string;
  models: string[];
  generateResponse(params: GenerateResponseParams): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

export interface GenerateResponseParams {
  model: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  confidence?: number;
  finishReason: "stop" | "length" | "content_filter" | "error";
  processingTime: number;
  provider: string;
}

export interface AIOrchestratorConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  defaultModel: string;
  fallbackModel?: string;
  maxRetries?: number;
  timeout?: number;
  enableFallback?: boolean;
}

export interface OrchestratorStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  providerStats: Map<string, {
    requests: number;
    failures: number;
    averageTime: number;
  }>;
}

// OpenAI Provider
class OpenAIProvider implements AIProvider {
  name = "openai";
  models = ["gpt-4", "gpt-3.5-turbo"];
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(params: GenerateResponseParams): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 1000,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        model: params.model,
        tokens: {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
          total: data.usage.total_tokens
        },
        confidence: 0.8, // OpenAI doesn't provide confidence scores
        finishReason: data.choices[0].finish_reason,
        processingTime,
        provider: this.name
      };
    } catch (error) {
      logger.error("OpenAI provider error", { error, model: params.model });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Anthropic Provider
class AnthropicProvider implements AIProvider {
  name = "anthropic";
  models = ["claude-3-sonnet", "claude-3-haiku"];
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(params: GenerateResponseParams): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Converter mensagens para formato Anthropic
      const systemMessage = params.messages.find(m => m.role === "system");
      const conversationMessages = params.messages.filter(m => m.role !== "system");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: params.model,
          max_tokens: params.maxTokens || 1000,
          temperature: params.temperature || 0.7,
          system: systemMessage?.content,
          messages: conversationMessages.map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        content: data.content[0].text,
        model: params.model,
        tokens: {
          prompt: data.usage.input_tokens,
          completion: data.usage.output_tokens,
          total: data.usage.input_tokens + data.usage.output_tokens
        },
        confidence: 0.85, // Anthropic doesn't provide confidence scores
        finishReason: data.stop_reason === "end_turn" ? "stop" : data.stop_reason,
        processingTime,
        provider: this.name
      };
    } catch (error) {
      logger.error("Anthropic provider error", { error, model: params.model });
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Anthropic doesn't have a simple health check endpoint
      // We'll assume it's available if we have an API key
      return !!this.apiKey;
    } catch {
      return false;
    }
  }
}

export class AIOrchestrator {
  private providers: Map<string, AIProvider> = new Map();
  private config: AIOrchestratorConfig;
  private stats: OrchestratorStats;

  constructor(config: AIOrchestratorConfig) {
    this.config = config;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      providerStats: new Map()
    };

    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Inicializar OpenAI
    if (this.config.openaiApiKey) {
      const openaiProvider = new OpenAIProvider(this.config.openaiApiKey);
      this.providers.set("openai", openaiProvider);
      this.stats.providerStats.set("openai", {
        requests: 0,
        failures: 0,
        averageTime: 0
      });
    }

    // Inicializar Anthropic
    if (this.config.anthropicApiKey) {
      const anthropicProvider = new AnthropicProvider(this.config.anthropicApiKey);
      this.providers.set("anthropic", anthropicProvider);
      this.stats.providerStats.set("anthropic", {
        requests: 0,
        failures: 0,
        averageTime: 0
      });
    }

    logger.info("AI Orchestrator initialized", {
      providers: Array.from(this.providers.keys()),
      defaultModel: this.config.defaultModel
    });
  }

  async generateResponse(request: z.infer<typeof GenerateResponseSchema>): Promise<AIResponse> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Validar entrada
      const validatedRequest = validateInput(GenerateResponseSchema, request);

      // Construir prompt do sistema
      const systemPrompt = this.buildSystemPrompt(validatedRequest.assistantConfig, validatedRequest.ragContext);

      // Construir mensagens
      const messages = this.buildMessages(
        validatedRequest.message,
        validatedRequest.conversationHistory || [],
        systemPrompt
      );

      // Determinar provider e modelo
      const { provider, model } = this.selectProvider(validatedRequest.assistantConfig.model);

      // Gerar resposta
      const response = await this.generateWithProvider(
        provider,
        {
          model,
          messages,
          temperature: validatedRequest.assistantConfig.temperature,
          maxTokens: validatedRequest.assistantConfig.maxTokens
        }
      );

      // Atualizar estatísticas
      this.updateStats(provider.name, Date.now() - startTime, true);
      this.stats.successfulRequests++;

      logger.info("Response generated successfully", {
        model,
        provider: provider.name,
        tokens: response.tokens.total,
        processingTime: response.processingTime
      });

      return response;

    } catch (error) {
      this.stats.failedRequests++;
      logger.error("Failed to generate response", { error });
      
      // Tentar fallback se habilitado
      if (this.config.enableFallback && this.config.fallbackModel) {
        try {
          return await this.generateFallbackResponse(request);
        } catch (fallbackError) {
          logger.error("Fallback also failed", { fallbackError });
        }
      }
      
      throw error;
    }
  }

  private buildSystemPrompt(assistantConfig: any, ragContext?: any): string {
    let systemPrompt = `Você é ${assistantConfig.name}, um assistente virtual inteligente.

`;
    
    systemPrompt += `Instruções:
${assistantConfig.instructions}

`;
    
    systemPrompt += `Estilo de resposta: ${assistantConfig.responseStyle}
`;
    systemPrompt += `Idioma: ${assistantConfig.language}

`;
    
    if (ragContext && ragContext.sources && ragContext.sources.length > 0) {
      systemPrompt += `Contexto relevante:
`;
      ragContext.sources.forEach((source: any, index: number) => {
        systemPrompt += `${index + 1}. ${source.content}\n`;
      });
      systemPrompt += `
`;
    }
    
    systemPrompt += `Responda de forma útil, precisa e no estilo especificado. Use o contexto fornecido quando relevante.`;
    
    return systemPrompt;
  }

  private buildMessages(
    currentMessage: string,
    conversationHistory: any[],
    systemPrompt: string
  ): Array<{ role: "user" | "assistant" | "system"; content: string }> {
    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    // Adicionar histórico da conversa (últimas 10 mensagens)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Adicionar mensagem atual
    messages.push({
      role: "user",
      content: currentMessage
    });

    return messages;
  }

  private selectProvider(requestedModel: string): { provider: AIProvider; model: string } {
    // Mapear modelos para providers
    const modelToProvider: Record<string, string> = {
      "gpt-4": "openai",
      "gpt-3.5-turbo": "openai",
      "claude-3-sonnet": "anthropic",
      "claude-3-haiku": "anthropic"
    };

    const providerName = modelToProvider[requestedModel];
    if (!providerName) {
      throw new Error(`Unsupported model: ${requestedModel}`);
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider not available: ${providerName}`);
    }

    return { provider, model: requestedModel };
  }

  private async generateWithProvider(
    provider: AIProvider,
    params: GenerateResponseParams
  ): Promise<AIResponse> {
    const maxRetries = this.config.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Verificar se o provider está disponível
        if (!(await provider.isAvailable())) {
          throw new Error(`Provider ${provider.name} is not available`);
        }

        return await provider.generateResponse(params);
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt} failed for provider ${provider.name}`, { error });
        
        if (attempt < maxRetries) {
          // Aguardar antes de tentar novamente (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  private async generateFallbackResponse(request: any): Promise<AIResponse> {
    logger.info("Attempting fallback response generation");
    
    const fallbackModel = this.config.fallbackModel!;
    const { provider, model } = this.selectProvider(fallbackModel);
    
    const systemPrompt = this.buildSystemPrompt({
      ...request.assistantConfig,
      model: fallbackModel
    }, request.ragContext);
    
    const messages = this.buildMessages(
      request.message,
      request.conversationHistory || [],
      systemPrompt
    );
    
    return await this.generateWithProvider(provider, {
      model,
      messages,
      temperature: 0.7,
      maxTokens: 500 // Resposta mais conservadora para fallback
    });
  }

  private updateStats(providerName: string, processingTime: number, success: boolean): void {
    const providerStats = this.stats.providerStats.get(providerName);
    if (providerStats) {
      providerStats.requests++;
      if (!success) {
        providerStats.failures++;
      }
      providerStats.averageTime = 
        (providerStats.averageTime * (providerStats.requests - 1) + processingTime) / providerStats.requests;
    }

    // Atualizar estatísticas globais
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + processingTime) / this.stats.totalRequests;
  }

  // Métodos públicos para monitoramento
  getStats(): OrchestratorStats {
    return { ...this.stats };
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getAvailableModels(): string[] {
    const models: string[] = [];
    for (const provider of this.providers.values()) {
      models.push(...provider.models);
    }
    return models;
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        health[name] = await provider.isAvailable();
      } catch {
        health[name] = false;
      }
    }
    
    return health;
  }
}

// Factory function
export function createAIOrchestrator(config: AIOrchestratorConfig): AIOrchestrator {
  return new AIOrchestrator(config);
}

// Default configuration
export function getDefaultAIOrchestratorConfig(): Partial<AIOrchestratorConfig> {
  return {
    defaultModel: "gpt-4",
    fallbackModel: "gpt-3.5-turbo",
    maxRetries: 3,
    timeout: 30000,
    enableFallback: true
  };
}