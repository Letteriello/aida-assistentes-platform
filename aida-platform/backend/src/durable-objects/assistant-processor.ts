import { DurableObject } from "@cloudflare/workers-types";
import { z } from "zod";
import { ConversationHistoryManager } from "../services/conversation-history-manager";
import { AIOrchestrator } from "../services/ai-orchestrator";
import { RAGService } from "../services/rag-service";
import { logger } from "../utils/logger";
import { rateLimiter } from "../utils/rate-limiter";
import { validateInput } from "../utils/validation";

// Schemas de validação
const ProcessMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(4000),
  userId: z.string().uuid(),
  businessId: z.string().uuid(),
  assistantId: z.string().uuid(),
  metadata: z.object({
    platform: z.enum(["whatsapp", "web", "api"]),
    messageType: z.enum(["text", "image", "audio", "document"]),
    timestamp: z.string().datetime(),
    sessionId: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional()
  })
});

const UpdateAssistantSchema = z.object({
  assistantId: z.string().uuid(),
  config: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    instructions: z.string().max(2000),
    model: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet", "claude-3-haiku"]),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(4000).default(1000),
    enableRAG: z.boolean().default(true),
    enableMemory: z.boolean().default(true),
    responseStyle: z.enum(["formal", "casual", "technical", "friendly"]).default("friendly"),
    language: z.string().default("pt-BR"),
    timezone: z.string().default("America/Sao_Paulo")
  })
});

interface AssistantState {
  assistantId: string;
  config: any;
  activeConversations: Map<string, {
    lastActivity: number;
    messageCount: number;
    context: any[];
  }>;
  processingQueue: Array<{
    id: string;
    conversationId: string;
    message: string;
    userId: string;
    businessId: string;
    timestamp: number;
    priority: number;
  }>;
  performance: {
    totalMessages: number;
    averageResponseTime: number;
    errorRate: number;
    lastProcessedAt: number;
  };
  rateLimits: Map<string, {
    count: number;
    resetTime: number;
  }>;
}

export class AssistantProcessor extends DurableObject {
  private state: AssistantState;
  private conversationManager: ConversationHistoryManager;
  private aiOrchestrator: AIOrchestrator;
  private ragService: RAGService;
  private processingInterval: number | null = null;
  private cleanupInterval: number | null = null;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);
    
    this.state = {
      assistantId: "",
      config: {},
      activeConversations: new Map(),
      processingQueue: [],
      performance: {
        totalMessages: 0,
        averageResponseTime: 0,
        errorRate: 0,
        lastProcessedAt: 0
      },
      rateLimits: new Map()
    };

    this.conversationManager = new ConversationHistoryManager(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    this.aiOrchestrator = new AIOrchestrator({
      openaiApiKey: env.OPENAI_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      defaultModel: "gpt-4"
    });
    this.ragService = new RAGService({
      supabaseUrl: env.SUPABASE_URL,
      supabaseKey: env.SUPABASE_SERVICE_ROLE_KEY,
      openaiApiKey: env.OPENAI_API_KEY
    });

    this.initializeProcessor();
  }

  private async initializeProcessor(): Promise<void> {
    try {
      // Carregar estado persistido
      const persistedState = await this.state.storage.get("assistantState");
      if (persistedState) {
        this.state = {
          ...this.state,
          ...persistedState,
          activeConversations: new Map(persistedState.activeConversations || []),
          rateLimits: new Map(persistedState.rateLimits || [])
        };
      }

      // Iniciar processamento em background
      this.startProcessing();
      this.startCleanup();

      logger.info("AssistantProcessor initialized", {
        assistantId: this.state.assistantId,
        activeConversations: this.state.activeConversations.size,
        queueSize: this.state.processingQueue.length
      });
    } catch (error) {
      logger.error("Failed to initialize AssistantProcessor", { error });
      throw error;
    }
  }

  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 100); // Processar a cada 100ms
  }

  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(async () => {
      await this.cleanup();
    }, 60000); // Limpeza a cada minuto
  }

  private async processQueue(): Promise<void> {
    if (this.state.processingQueue.length === 0) {
      return;
    }

    // Ordenar por prioridade e timestamp
    this.state.processingQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Maior prioridade primeiro
      }
      return a.timestamp - b.timestamp; // Mais antigo primeiro
    });

    const item = this.state.processingQueue.shift();
    if (!item) return;

    try {
      await this.processMessage(item);
    } catch (error) {
      logger.error("Failed to process message", {
        messageId: item.id,
        conversationId: item.conversationId,
        error
      });

      // Incrementar taxa de erro
      this.state.performance.errorRate = 
        (this.state.performance.errorRate * this.state.performance.totalMessages + 1) / 
        (this.state.performance.totalMessages + 1);
    }

    await this.persistState();
  }

  private async processMessage(item: any): Promise<void> {
    const startTime = Date.now();

    try {
      // Verificar rate limiting
      if (!this.checkRateLimit(item.userId)) {
        throw new Error("Rate limit exceeded");
      }

      // Obter contexto da conversa
      const conversationContext = await this.getConversationContext(item.conversationId);
      
      // Buscar conhecimento relevante via RAG
      let ragContext = null;
      if (this.state.config.enableRAG) {
        ragContext = await this.ragService.searchRelevantKnowledge(
          item.message,
          item.businessId,
          {
            limit: 5,
            threshold: 0.7,
            includeMetadata: true
          }
        );
      }

      // Gerar resposta usando AI Orchestrator
      const response = await this.aiOrchestrator.generateResponse({
        message: item.message,
        conversationHistory: conversationContext,
        ragContext,
        assistantConfig: this.state.config,
        userId: item.userId,
        businessId: item.businessId
      });

      // Salvar resposta na conversa
      await this.conversationManager.addMessage(item.conversationId, {
        role: "assistant",
        content: response.content,
        metadata: {
          model: response.model,
          tokens: response.tokens,
          processingTime: Date.now() - startTime,
          ragSources: ragContext?.sources || [],
          confidence: response.confidence || 0.8
        }
      });

      // Atualizar estatísticas
      this.updatePerformanceStats(Date.now() - startTime);

      // Atualizar contexto da conversa ativa
      this.updateActiveConversation(item.conversationId, {
        lastActivity: Date.now(),
        messageCount: (this.state.activeConversations.get(item.conversationId)?.messageCount || 0) + 1,
        context: conversationContext.slice(-10) // Manter apenas últimas 10 mensagens
      });

      logger.info("Message processed successfully", {
        messageId: item.id,
        conversationId: item.conversationId,
        processingTime: Date.now() - startTime,
        responseLength: response.content.length
      });

    } catch (error) {
      logger.error("Error processing message", {
        messageId: item.id,
        conversationId: item.conversationId,
        error: error.message
      });
      throw error;
    }
  }

  private async getConversationContext(conversationId: string): Promise<any[]> {
    try {
      const history = await this.conversationManager.getConversationHistory(
        conversationId,
        { limit: 20, includeMetadata: true }
      );
      return history.messages || [];
    } catch (error) {
      logger.error("Failed to get conversation context", { conversationId, error });
      return [];
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.state.rateLimits.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset ou primeira vez
      this.state.rateLimits.set(userId, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }

    if (userLimit.count >= 30) { // 30 mensagens por minuto
      return false;
    }

    userLimit.count++;
    return true;
  }

  private updatePerformanceStats(processingTime: number): void {
    const stats = this.state.performance;
    stats.totalMessages++;
    stats.averageResponseTime = 
      (stats.averageResponseTime * (stats.totalMessages - 1) + processingTime) / stats.totalMessages;
    stats.lastProcessedAt = Date.now();
  }

  private updateActiveConversation(conversationId: string, data: any): void {
    this.state.activeConversations.set(conversationId, data);
  }

  private async cleanup(): Promise<void> {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutos

    // Limpar conversas inativas
    for (const [conversationId, data] of this.state.activeConversations.entries()) {
      if (now - data.lastActivity > inactiveThreshold) {
        this.state.activeConversations.delete(conversationId);
      }
    }

    // Limpar rate limits expirados
    for (const [userId, limit] of this.state.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.state.rateLimits.delete(userId);
      }
    }

    // Persistir estado limpo
    await this.persistState();

    logger.debug("Cleanup completed", {
      activeConversations: this.state.activeConversations.size,
      rateLimits: this.state.rateLimits.size
    });
  }

  private async persistState(): Promise<void> {
    try {
      await this.state.storage.put("assistantState", {
        ...this.state,
        activeConversations: Array.from(this.state.activeConversations.entries()),
        rateLimits: Array.from(this.state.rateLimits.entries())
      });
    } catch (error) {
      logger.error("Failed to persist state", { error });
    }
  }

  // Métodos públicos para interação via HTTP
  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;

      switch (`${method} ${url.pathname}`) {
        case "POST /process":
          return await this.handleProcessMessage(request);
        
        case "PUT /config":
          return await this.handleUpdateConfig(request);
        
        case "GET /status":
          return await this.handleGetStatus();
        
        case "GET /performance":
          return await this.handleGetPerformance();
        
        case "POST /priority":
          return await this.handleSetPriority(request);
        
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      logger.error("Error handling request", { error });
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  private async handleProcessMessage(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      const validatedData = validateInput(ProcessMessageSchema, data);

      // Adicionar à fila de processamento
      const messageId = crypto.randomUUID();
      this.state.processingQueue.push({
        id: messageId,
        conversationId: validatedData.conversationId,
        message: validatedData.message,
        userId: validatedData.userId,
        businessId: validatedData.businessId,
        timestamp: Date.now(),
        priority: 1 // Prioridade normal
      });

      return new Response(JSON.stringify({
        success: true,
        messageId,
        queuePosition: this.state.processingQueue.length
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  private async handleUpdateConfig(request: Request): Promise<Response> {
    try {
      const data = await request.json();
      const validatedData = validateInput(UpdateAssistantSchema, data);

      this.state.assistantId = validatedData.assistantId;
      this.state.config = validatedData.config;

      await this.persistState();

      return new Response(JSON.stringify({
        success: true,
        assistantId: this.state.assistantId,
        config: this.state.config
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  private async handleGetStatus(): Promise<Response> {
    return new Response(JSON.stringify({
      assistantId: this.state.assistantId,
      activeConversations: this.state.activeConversations.size,
      queueSize: this.state.processingQueue.length,
      performance: this.state.performance,
      uptime: Date.now() - (this.state.performance.lastProcessedAt || Date.now())
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  private async handleGetPerformance(): Promise<Response> {
    return new Response(JSON.stringify({
      performance: this.state.performance,
      activeConversations: Array.from(this.state.activeConversations.entries()).map(([id, data]) => ({
        conversationId: id,
        lastActivity: data.lastActivity,
        messageCount: data.messageCount
      })),
      queueMetrics: {
        size: this.state.processingQueue.length,
        oldestMessage: this.state.processingQueue.length > 0 
          ? Math.min(...this.state.processingQueue.map(item => item.timestamp))
          : null
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  private async handleSetPriority(request: Request): Promise<Response> {
    try {
      const { messageId, priority } = await request.json();
      
      const message = this.state.processingQueue.find(item => item.id === messageId);
      if (message) {
        message.priority = priority;
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: "Message not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Cleanup ao destruir o objeto
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    await this.persistState();
    
    logger.info("AssistantProcessor cleanup completed", {
      assistantId: this.state.assistantId
    });
  }
}

export default AssistantProcessor;