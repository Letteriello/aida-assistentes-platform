import { AIModelRouter } from './ai-model-router.service';
import { CacheManager } from './cache-manager.service';

export interface AutomationRule {
  id: string;
  name: string;
  businessId: string;
  triggers: AutomationTrigger[];
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
}

export interface AutomationTrigger {
  type: 'message_received' | 'keyword_detected' | 'time_based' | 'sentiment_change';
  config: Record<string, any>;
}

export interface AutomationCondition {
  type: 'time_range' | 'customer_segment' | 'message_count' | 'sentiment_score';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

export interface AutomationAction {
  type: 'send_message' | 'escalate_to_human' | 'add_to_crm' | 'send_template' | 'schedule_followup';
  config: Record<string, any>;
  delay?: number; // milliseconds
}

export class AutomationEngine {
  private aiRouter: AIModelRouter;
  private cache: CacheManager;
  private activeRules = new Map<string, AutomationRule[]>();

  constructor(aiRouter: AIModelRouter, cache: CacheManager) {
    this.aiRouter = aiRouter;
    this.cache = cache;
  }

  async processMessage(message: {
    instanceId: string;
    businessId: string;
    from: string;
    content: string;
    timestamp: Date;
  }): Promise<void> {
    // Get automation rules for this business
    const rules = await this.getActiveRules(message.businessId);
    
    // Check each rule
    for (const rule of rules) {
      const shouldExecute = await this.evaluateRule(rule, message);
      
      if (shouldExecute) {
        await this.executeRule(rule, message);
      }
    }
  }

  private async getActiveRules(businessId: string): Promise<AutomationRule[]> {
    const cached = this.activeRules.get(businessId);
    if (cached) return cached;

    // Load from database
    const rules = await this.loadRulesFromDB(businessId);
    this.activeRules.set(businessId, rules);
    
    return rules;
  }

  private async evaluateRule(rule: AutomationRule, message: any): Promise<boolean> {
    // Check triggers
    const triggerMatched = await this.evaluateTriggers(rule.triggers, message);
    if (!triggerMatched) return false;

    // Check conditions
    const conditionsMet = await this.evaluateConditions(rule.conditions, message);
    if (!conditionsMet) return false;

    return true;
  }

  private async evaluateTriggers(triggers: AutomationTrigger[], message: any): Promise<boolean> {
    for (const trigger of triggers) {
      const matched = await this.evaluateTrigger(trigger, message);
      if (matched) return true; // OR logic - any trigger can activate
    }
    return false;
  }

  private async evaluateTrigger(trigger: AutomationTrigger, message: any): Promise<boolean> {
    switch (trigger.type) {
      case 'message_received':
        return true; // Always true for message events

      case 'keyword_detected':
        const keywords = trigger.config.keywords as string[];
        const content = message.content.toLowerCase();
        return keywords.some(keyword => content.includes(keyword.toLowerCase()));

      case 'time_based':
        const currentHour = new Date().getHours();
        const startHour = trigger.config.startHour;
        const endHour = trigger.config.endHour;
        return currentHour >= startHour && currentHour <= endHour;

      case 'sentiment_change':
        const sentiment = await this.analyzeSentiment(message.content);
        const targetSentiment = trigger.config.sentiment;
        return sentiment === targetSentiment;

      default:
        return false;
    }
  }

  private async evaluateConditions(conditions: AutomationCondition[], message: any): Promise<boolean> {
    for (const condition of conditions) {
      const met = await this.evaluateCondition(condition, message);
      if (!met) return false; // AND logic - all conditions must be met
    }
    return true;
  }

  private async evaluateCondition(condition: AutomationCondition, message: any): Promise<boolean> {
    switch (condition.type) {
      case 'time_range':
        const currentTime = new Date();
        const startTime = new Date(condition.value.start);
        const endTime = new Date(condition.value.end);
        return currentTime >= startTime && currentTime <= endTime;

      case 'customer_segment':
        const customerSegment = await this.getCustomerSegment(message.from);
        return condition.operator === 'equals' 
          ? customerSegment === condition.value
          : customerSegment !== condition.value;

      case 'message_count':
        const messageCount = await this.getConversationMessageCount(message.businessId, message.from);
        return this.compareValues(messageCount, condition.operator, condition.value);

      case 'sentiment_score':
        const sentimentScore = await this.getSentimentScore(message.content);
        return this.compareValues(sentimentScore, condition.operator, condition.value);

      default:
        return true;
    }
  }

  private async executeRule(rule: AutomationRule, message: any): Promise<void> {
    console.log(`Executing automation rule: ${rule.name}`);

    for (const action of rule.actions) {
      if (action.delay) {
        setTimeout(() => this.executeAction(action, message), action.delay);
      } else {
        await this.executeAction(action, message);
      }
    }
  }

  private async executeAction(action: AutomationAction, message: any): Promise<void> {
    switch (action.type) {
      case 'send_message':
        await this.sendMessage(action.config, message);
        break;

      case 'escalate_to_human':
        await this.escalateToHuman(action.config, message);
        break;

      case 'add_to_crm':
        await this.addToCRM(action.config, message);
        break;

      case 'send_template':
        await this.sendTemplate(action.config, message);
        break;

      case 'schedule_followup':
        await this.scheduleFollowup(action.config, message);
        break;
    }
  }

  private async sendMessage(config: any, message: any): Promise<void> {
    let messageText = config.text;

    // Replace variables
    messageText = messageText.replace(/\{customer_name\}/g, await this.getCustomerName(message.from));
    messageText = messageText.replace(/\{business_name\}/g, await this.getBusinessName(message.businessId));
    messageText = messageText.replace(/\{current_time\}/g, new Date().toLocaleString('pt-BR'));

    // AI-enhanced message if enabled
    if (config.useAI) {
      const aiResponse = await this.aiRouter.routeToOptimalModel({
        prompt: `Personalize esta mensagem para o cliente: "${messageText}". Contexto da conversa: "${message.content}"`,
        complexity: 'simple',
        contextSize: messageText.length,
        requiresThinking: false,
        businessId: message.businessId
      });
      messageText = aiResponse.content;
    }

    await this.sendWhatsAppMessage(message.instanceId, message.from, messageText);
  }

  private async escalateToHuman(config: any, message: any): Promise<void> {
    // Mark conversation for human takeover
    await this.markForHumanTakeover(message.businessId, message.from, config.reason || 'Escalated by automation');
    
    // Send notification to business owner
    if (config.notifyOwner) {
      await this.notifyBusinessOwner(message.businessId, {
        type: 'escalation',
        customer: message.from,
        reason: config.reason,
        message: message.content
      });
    }
  }

  private async sendTemplate(config: any, message: any): Promise<void> {
    const template = await this.getTemplate(config.templateId);
    if (!template) return;

    // Process template variables
    let processedTemplate = template.content;
    
    // Replace dynamic content
    const replacements = {
      customer_name: await this.getCustomerName(message.from),
      business_name: await this.getBusinessName(message.businessId),
      current_date: new Date().toLocaleDateString('pt-BR'),
      current_time: new Date().toLocaleTimeString('pt-BR')
    };

    for (const [key, value] of Object.entries(replacements)) {
      processedTemplate = processedTemplate.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    await this.sendWhatsAppMessage(message.instanceId, message.from, processedTemplate);
  }

  private async scheduleFollowup(config: any, message: any): Promise<void> {
    const followupTime = new Date();
    followupTime.setTime(followupTime.getTime() + (config.delayHours * 60 * 60 * 1000));

    // Store scheduled message
    await this.storeScheduledMessage({
      instanceId: message.instanceId,
      businessId: message.businessId,
      customerPhone: message.from,
      message: config.message,
      scheduledFor: followupTime,
      status: 'pending'
    });
  }

  // Utility methods
  private async analyzeSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
    // Simple sentiment analysis - replace with more sophisticated model
    const positiveWords = ['obrigado', 'perfeito', 'ótimo', 'excelente', 'parabéns'];
    const negativeWords = ['problema', 'ruim', 'terrível', 'cancelar', 'reclamação'];
    
    const contentLower = content.toLowerCase();
    
    if (positiveWords.some(word => contentLower.includes(word))) {
      return 'positive';
    }
    
    if (negativeWords.some(word => contentLower.includes(word))) {
      return 'negative';
    }
    
    return 'neutral';
  }

  private async getSentimentScore(content: string): Promise<number> {
    const sentiment = await this.analyzeSentiment(content);
    switch (sentiment) {
      case 'positive': return 0.8;
      case 'negative': return 0.2;
      default: return 0.5;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'greater_than': return actual > expected;
      case 'less_than': return actual < expected;
      case 'contains': return String(actual).includes(String(expected));
      case 'between': return actual >= expected.min && actual <= expected.max;
      default: return false;
    }
  }

  // Placeholder methods - implement according to your database schema
  private async loadRulesFromDB(businessId: string): Promise<AutomationRule[]> { return []; }
  private async getCustomerSegment(phone: string): Promise<string> { return 'default'; }
  private async getConversationMessageCount(businessId: string, phone: string): Promise<number> { return 0; }
  private async getCustomerName(phone: string): Promise<string> { return 'Cliente'; }
  private async getBusinessName(businessId: string): Promise<string> { return 'Empresa'; }
  private async markForHumanTakeover(businessId: string, phone: string, reason: string): Promise<void> {}
  private async notifyBusinessOwner(businessId: string, notification: any): Promise<void> {}
  private async getTemplate(templateId: string): Promise<any> { return null; }
  private async storeScheduledMessage(message: any): Promise<void> {}
  private async sendWhatsAppMessage(instanceId: string, phone: string, message: string): Promise<void> {
    console.log(`Sending to ${phone}: ${message}`);
  }
}