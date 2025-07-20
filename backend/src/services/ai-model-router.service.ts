import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export type ModelComplexity = 'simple' | 'medium' | 'complex';
export type ModelType = 'gemini-flash-lite' | 'gemini-flash' | 'gemini-pro' | 'gpt-4o-mini';

export interface AIRequest {
  prompt: string;
  complexity: ModelComplexity;
  contextSize: number;
  requiresThinking: boolean;
  businessId: string;
  conversationId?: string;
}

export interface AIResponse {
  content: string;
  model: ModelType;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  responseTime: number;
}

export class AIModelRouter {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
    
    this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  }

  async routeToOptimalModel(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.selectOptimalModel(request);
    
    let response: AIResponse;
    
    switch (model) {
      case 'gemini-flash-lite':
        response = await this.callGeminiFlashLite(request);
        break;
      case 'gemini-flash':
        response = await this.callGeminiFlash(request);
        break;
      case 'gemini-pro':
        response = await this.callGeminiPro(request);
        break;
      case 'gpt-4o-mini':
        response = await this.callGPT4oMini(request);
        break;
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
    
    response.responseTime = Date.now() - startTime;
    response.model = model;
    
    // Log para analytics
    await this.logModelUsage(request, response);
    
    return response;
  }

  private selectOptimalModel(request: AIRequest): ModelType {
    // Gemini Flash-Lite para casos simples (60% mais barato)
    if (
      request.complexity === 'simple' && 
      !request.requiresThinking && 
      request.contextSize < 50000
    ) {
      return 'gemini-flash-lite';
    }
    
    // Gemini Flash para casos médios (balanced)
    if (
      request.complexity === 'medium' || 
      (request.contextSize > 50000 && request.contextSize < 500000)
    ) {
      return 'gemini-flash';
    }
    
    // Gemini Pro para casos complexos que precisam de thinking
    if (
      request.complexity === 'complex' || 
      request.requiresThinking ||
      request.contextSize > 500000
    ) {
      return 'gemini-pro';
    }
    
    // GPT-4o Mini como fallback
    return 'gpt-4o-mini';
  }

  private async callGeminiFlashLite(request: AIRequest): Promise<AIResponse> {
    const model = this.gemini.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    const result = await model.generateContent(request.prompt);
    const response = result.response;
    
    return {
      content: response.text(),
      model: 'gemini-flash-lite',
      usage: {
        inputTokens: request.prompt.length / 4, // Aproximação
        outputTokens: response.text().length / 4,
        cost: this.calculateCost('gemini-flash-lite', request.prompt.length / 4, response.text().length / 4)
      },
      responseTime: 0 // Será preenchido pelo router
    };
  }

  private async callGeminiFlash(request: AIRequest): Promise<AIResponse> {
    const model = this.gemini.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
      }
    });
    
    const result = await model.generateContent(request.prompt);
    const response = result.response;
    
    return {
      content: response.text(),
      model: 'gemini-flash',
      usage: {
        inputTokens: request.prompt.length / 4,
        outputTokens: response.text().length / 4,
        cost: this.calculateCost('gemini-flash', request.prompt.length / 4, response.text().length / 4)
      },
      responseTime: 0
    };
  }

  private async callGeminiPro(request: AIRequest): Promise<AIResponse> {
    const model = this.gemini.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });
    
    const result = await model.generateContent(request.prompt);
    const response = result.response;
    
    return {
      content: response.text(),
      model: 'gemini-pro',
      usage: {
        inputTokens: request.prompt.length / 4,
        outputTokens: response.text().length / 4,
        cost: this.calculateCost('gemini-pro', request.prompt.length / 4, response.text().length / 4)
      },
      responseTime: 0
    };
  }

  private async callGPT4oMini(request: AIRequest): Promise<AIResponse> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: request.prompt }],
      temperature: 0.7,
      max_tokens: 4096,
    });
    
    const response = completion.choices[0].message.content || '';
    
    return {
      content: response,
      model: 'gpt-4o-mini',
      usage: {
        inputTokens: completion.usage?.prompt_tokens || 0,
        outputTokens: completion.usage?.completion_tokens || 0,
        cost: this.calculateCost('gpt-4o-mini', completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0)
      },
      responseTime: 0
    };
  }

  private calculateCost(model: ModelType, inputTokens: number, outputTokens: number): number {
    const pricing = {
      'gemini-flash-lite': { input: 0.10, output: 0.40 }, // Por milhão de tokens
      'gemini-flash': { input: 0.30, output: 2.50 },
      'gemini-pro': { input: 1.25, output: 10.00 },
      'gpt-4o-mini': { input: 0.15, output: 0.60 }
    };
    
    const rates = pricing[model];
    return ((inputTokens * rates.input) + (outputTokens * rates.output)) / 1000000;
  }

  private async logModelUsage(request: AIRequest, response: AIResponse): Promise<void> {
    // Log para analytics e billing
    console.log(`Model used: ${response.model}, Cost: ${response.usage.cost.toFixed(4)}, Response time: ${response.responseTime}ms`);
    
    // Aqui você pode salvar no banco para analytics
    // await this.supabase.from('ai_usage_logs').insert({
    //   business_id: request.businessId,
    //   model: response.model,
    //   input_tokens: response.usage.inputTokens,
    //   output_tokens: response.usage.outputTokens,
    //   cost: response.usage.cost,
    //   response_time: response.responseTime,
    //   complexity: request.complexity
    // });
  }
}