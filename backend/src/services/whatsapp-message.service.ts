import { AIModelRouter, ModelComplexity } from './ai-model-router.service';

export interface IncomingMessage {
  instanceId: string;
  businessId: string;
  from: string;
  content: string;
  timestamp: Date;
  conversationId: string;
  messageType: 'text' | 'image' | 'document' | 'audio';
}

export interface MessageContext {
  conversationHistory: string[];
  knowledgeBase: string;
  businessInfo: {
    name: string;
    type: string;
    hours: string;
    policies: string;
  };
}

export class WhatsAppMessageService {
  private aiRouter: AIModelRouter;
  
  constructor() {
    this.aiRouter = new AIModelRouter();
  }

  async processMessage(message: IncomingMessage): Promise<void> {
    try {
      // Analisar complexidade da mensagem
      const complexity = this.analyzeMessageComplexity(message.content);
      const contextSize = await this.getContextSize(message.businessId, message.conversationId);
      
      // Buscar contexto do RAG
      const context = await this.retrieveContext(message.content, message.businessId);
      
      // Montar prompt com contexto
      const prompt = this.buildPrompt(message.content, context);
      
      // Rotear para modelo otimizado
      const aiResponse = await this.aiRouter.routeToOptimalModel({
        prompt,
        complexity,
        contextSize,
        requiresThinking: complexity === 'complex',
        businessId: message.businessId,
        conversationId: message.conversationId
      });
      
      // Enviar resposta
      await this.sendWhatsAppMessage(message.instanceId, message.from, aiResponse.content);
      
      // Salvar mensagem e métricas
      await this.saveConversation(message, aiResponse);
    } catch (error) {
      console.error('Error processing message:', error);
      await this.sendErrorMessage(message.instanceId, message.from);
    }
  }

  private analyzeMessageComplexity(content: string): ModelComplexity {
    // Análise heurística da complexidade
    const indicators = {
      simple: ['oi', 'olá', 'preço', 'horário', 'sim', 'não', 'obrigado', 'tchau'],
      complex: ['problema', 'reclamação', 'cancelar', 'resolver', 'detalhes', 'explicar', 'dúvida', 'ajuda']
    };
    
    const words = content.toLowerCase().split(' ');
    const wordCount = words.length;
    
    // Verificar indicadores complexos
    if (words.some(word => indicators.complex.includes(word))) {
      return 'complex';
    }
    
    // Mensagens longas ou com perguntas são médias
    if (wordCount > 50 || content.includes('?') || content.includes('como') || content.includes('quando')) {
      return 'medium';
    }
    
    // Verificar indicadores simples
    if (words.some(word => indicators.simple.includes(word)) && wordCount <= 10) {
      return 'simple';
    }
    
    // Default para médio se não conseguir classificar
    return 'medium';
  }

  private async getContextSize(businessId: string, conversationId: string): Promise<number> {
    // Calcular tamanho do contexto (mensagens recentes + knowledge base)
    try {
      // Buscar últimas 10 mensagens da conversa
      const recentMessages = await this.getRecentMessages(conversationId, 10);
      const messagesSize = recentMessages.reduce((total, msg) => total + msg.length, 0);
      
      // Buscar tamanho da base de conhecimento do negócio
      const knowledgeBaseSize = await this.getKnowledgeBaseSize(businessId);
      
      return messagesSize + knowledgeBaseSize;
    } catch (error) {
      console.error('Error calculating context size:', error);
      return 10000; // Default size
    }
  }

  private async retrieveContext(query: string, businessId: string): Promise<MessageContext> {
    // Implementar busca de contexto (RAG)
    // Por enquanto, retornar contexto básico
    return {
      conversationHistory: await this.getRecentMessages(query, 5),
      knowledgeBase: await this.getBusinessKnowledge(businessId),
      businessInfo: await this.getBusinessInfo(businessId)
    };
  }

  private buildPrompt(userMessage: string, context: MessageContext): string {
    return `
Você é um assistente de IA para ${context.businessInfo.name}, uma empresa do tipo ${context.businessInfo.type}.

INFORMAÇÕES DA EMPRESA:
- Nome: ${context.businessInfo.name}
- Horário de funcionamento: ${context.businessInfo.hours}
- Políticas: ${context.businessInfo.policies}

BASE DE CONHECIMENTO:
${context.knowledgeBase}

HISTÓRICO DA CONVERSA:
${context.conversationHistory.join('\n')}

MENSAGEM DO CLIENTE:
${userMessage}

INSTRUÇÕES:
1. Responda de forma profissional e amigável
2. Use as informações da base de conhecimento quando relevante
3. Se não souber algo, seja honesto e ofereça alternativas
4. Mantenha respostas concisas (máximo 200 palavras)
5. Use o contexto da conversa para personalizar a resposta

RESPOSTA:`;
  }

  private async sendWhatsAppMessage(instanceId: string, phoneNumber: string, message: string): Promise<void> {
    // Implementar envio de mensagem via Evolution API
    // Por enquanto, apenas log
    console.log(`Sending to ${phoneNumber} via ${instanceId}: ${message}`);
  }

  private async sendErrorMessage(instanceId: string, phoneNumber: string): Promise<void> {
    const errorMessage = "Desculpe, ocorreu um erro temporário. Tente novamente em alguns minutos.";
    await this.sendWhatsAppMessage(instanceId, phoneNumber, errorMessage);
  }

  private async saveConversation(message: IncomingMessage, aiResponse: any): Promise<void> {
    // Implementar salvamento da conversa no banco
    console.log(`Saving conversation for ${message.businessId}`);
  }

  // Métodos auxiliares (implementar conforme necessário)
  private async getRecentMessages(conversationId: string, limit: number): Promise<string[]> {
    // Implementar busca de mensagens recentes
    return [];
  }

  private async getKnowledgeBaseSize(businessId: string): Promise<number> {
    // Implementar cálculo do tamanho da base de conhecimento
    return 5000;
  }

  private async getBusinessKnowledge(businessId: string): Promise<string> {
    // Implementar busca da base de conhecimento
    return "Base de conhecimento da empresa...";
  }

  private async getBusinessInfo(businessId: string): Promise<any> {
    // Implementar busca de informações da empresa
    return {
      name: "Empresa",
      type: "Comércio",
      hours: "9h às 18h",
      policies: "Políticas da empresa..."
    };
  }
}