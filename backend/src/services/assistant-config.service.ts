import { getSupabaseClient } from '../database/supabase-client';
import { Database } from '../database/database.types';

type AssistantConfig = Database['public']['Tables']['assistant_configs']['Row'];
type AssistantConfigInsert = Database['public']['Tables']['assistant_configs']['Insert'];
type AssistantConfigUpdate = Database['public']['Tables']['assistant_configs']['Update'];

/**
 * Serviço para gerenciar configurações de assistentes
 * Inclui engenharia de contexto estruturada e configurações de IA
 */
export class AssistantConfigService {
  /**
   * Cria configuração de assistente para uma instância
   */
  async createAssistantConfig(instanceId: string, config: {
    name: string;
    description?: string;
    companyInfo: {
      name: string;
      industry: string;
      description: string;
      values?: string;
      mission?: string;
      vision?: string;
    };
    businessContext: {
      targetAudience: string;
      mainServices: string[];
      businessHours?: string;
      location?: string;
      website?: string;
      socialMedia?: Record<string, string>;
    };
    conversationStyle: {
      tone: 'formal' | 'casual' | 'friendly' | 'professional';
      personality: string;
      language: string;
      responseLength: 'short' | 'medium' | 'long';
      useEmojis: boolean;
    };
    aiModel: 'gpt-4o-mini' | 'gemini-2.0-flash';
    customInstructions?: string;
  }): Promise<{
    success: boolean;
    assistantConfig?: AssistantConfig;
    message: string;
  }> {
    try {
      // Verifica se já existe configuração para esta instância
      const { data: existingConfig } = await getSupabaseClient()
        .from('assistant_configs')
        .select('id')
        .eq('instance_id', instanceId)
        .single();

      if (existingConfig) {
        return {
          success: false,
          message: 'Já existe uma configuração de assistente para esta instância'
        };
      }

      // Gera contexto estruturado baseado nas informações fornecidas
      const structuredContext = this.generateStructuredContext(config);

      const { data: assistantConfig, error } = await getSupabaseClient()
        .from('assistant_configs')
        .insert({
          instance_id: instanceId,
          name: config.name,
          description: config.description,
          ai_model: config.aiModel,
          system_prompt: structuredContext.systemPrompt,
          context_data: {
            company_info: config.companyInfo,
            business_context: config.businessContext,
            conversation_style: config.conversationStyle,
            custom_instructions: config.customInstructions
          },
          knowledge_base: structuredContext.knowledgeBase,
          conversation_settings: {
            max_context_messages: 20,
            temperature: 0.7,
            max_tokens: 1000,
            use_vector_search: true,
            use_knowledge_graph: true
          },
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar configuração do assistente:', error);
        return {
          success: false,
          message: 'Erro ao criar configuração do assistente'
        };
      }

      return {
        success: true,
        assistantConfig,
        message: 'Configuração do assistente criada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar configuração do assistente:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Atualiza configuração do assistente
   */
  async updateAssistantConfig(instanceId: string, updates: {
    name?: string;
    description?: string;
    companyInfo?: Partial<{
      name: string;
      industry: string;
      description: string;
      values?: string;
      mission?: string;
      vision?: string;
    }>;
    businessContext?: Partial<{
      targetAudience: string;
      mainServices: string[];
      businessHours?: string;
      location?: string;
      website?: string;
      socialMedia?: Record<string, string>;
    }>;
    conversationStyle?: Partial<{
      tone: 'formal' | 'casual' | 'friendly' | 'professional';
      personality: string;
      language: string;
      responseLength: 'short' | 'medium' | 'long';
      useEmojis: boolean;
    }>;
    aiModel?: 'gpt-4o-mini' | 'gemini-2.0-flash';
    customInstructions?: string;
  }): Promise<{
    success: boolean;
    assistantConfig?: AssistantConfig;
    message: string;
  }> {
    try {
      // Busca configuração atual
      const { data: currentConfig, error: fetchError } = await getSupabaseClient()
        .from('assistant_configs')
        .select('*')
        .eq('instance_id', instanceId)
        .single();

      if (fetchError || !currentConfig) {
        return {
          success: false,
          message: 'Configuração do assistente não encontrada'
        };
      }

      // Mescla configurações atuais com atualizações
      const currentContextData = currentConfig.context_data as any || {};
      const mergedConfig = {
        name: updates.name || currentConfig.name,
        description: updates.description || currentConfig.description,
        companyInfo: { ...currentContextData.company_info, ...updates.companyInfo },
        businessContext: { ...currentContextData.business_context, ...updates.businessContext },
        conversationStyle: { ...currentContextData.conversation_style, ...updates.conversationStyle },
        aiModel: updates.aiModel || currentConfig.ai_model,
        customInstructions: updates.customInstructions || currentContextData.custom_instructions
      };

      // Regenera contexto estruturado
      const structuredContext = this.generateStructuredContext(mergedConfig);

      const { data: assistantConfig, error } = await getSupabaseClient()
        .from('assistant_configs')
        .update({
          name: mergedConfig.name,
          description: mergedConfig.description,
          ai_model: mergedConfig.aiModel,
          system_prompt: structuredContext.systemPrompt,
          context_data: {
            company_info: mergedConfig.companyInfo,
            business_context: mergedConfig.businessContext,
            conversation_style: mergedConfig.conversationStyle,
            custom_instructions: mergedConfig.customInstructions
          },
          knowledge_base: structuredContext.knowledgeBase,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configuração do assistente:', error);
        return {
          success: false,
          message: 'Erro ao atualizar configuração do assistente'
        };
      }

      return {
        success: true,
        assistantConfig,
        message: 'Configuração do assistente atualizada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar configuração do assistente:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Obtém configuração do assistente
   */
  async getAssistantConfig(instanceId: string): Promise<{
    success: boolean;
    assistantConfig?: AssistantConfig;
    message: string;
  }> {
    try {
      const { data: assistantConfig, error } = await getSupabaseClient()
        .from('assistant_configs')
        .select('*')
        .eq('instance_id', instanceId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configuração do assistente:', error);
        return {
          success: false,
          message: 'Erro ao buscar configuração do assistente'
        };
      }

      if (!assistantConfig) {
        return {
          success: false,
          message: 'Configuração do assistente não encontrada'
        };
      }

      return {
        success: true,
        assistantConfig,
        message: 'Configuração do assistente encontrada'
      };
    } catch (error) {
      console.error('Erro ao obter configuração do assistente:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Ativa/desativa assistente
   */
  async toggleAssistantStatus(instanceId: string, isActive: boolean): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await getSupabaseClient()
        .from('assistant_configs')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId);

      if (error) {
        console.error('Erro ao alterar status do assistente:', error);
        return {
          success: false,
          message: 'Erro ao alterar status do assistente'
        };
      }

      return {
        success: true,
        message: `Assistente ${isActive ? 'ativado' : 'desativado'} com sucesso`
      };
    } catch (error) {
      console.error('Erro ao alterar status do assistente:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Deleta configuração do assistente
   */
  async deleteAssistantConfig(instanceId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { error } = await getSupabaseClient()
        .from('assistant_configs')
        .delete()
        .eq('instance_id', instanceId);

      if (error) {
        console.error('Erro ao deletar configuração do assistente:', error);
        return {
          success: false,
          message: 'Erro ao deletar configuração do assistente'
        };
      }

      return {
        success: true,
        message: 'Configuração do assistente deletada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao deletar configuração do assistente:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Gera contexto estruturado baseado nas configurações
   */
  private generateStructuredContext(config: any): {
    systemPrompt: string;
    knowledgeBase: any;
  } {
    const { companyInfo, businessContext, conversationStyle, customInstructions } = config;

    // Gera prompt do sistema estruturado
    const systemPrompt = `Você é um assistente de atendimento especializado da empresa ${companyInfo.name}.

## INFORMAÇÕES DA EMPRESA:
- Nome: ${companyInfo.name}
- Setor: ${companyInfo.industry}
- Descrição: ${companyInfo.description}
${companyInfo.mission ? `- Missão: ${companyInfo.mission}` : ''}
${companyInfo.vision ? `- Visão: ${companyInfo.vision}` : ''}
${companyInfo.values ? `- Valores: ${companyInfo.values}` : ''}

## CONTEXTO DE NEGÓCIO:
- Público-alvo: ${businessContext.targetAudience}
- Principais serviços: ${businessContext.mainServices.join(', ')}
${businessContext.businessHours ? `- Horário de funcionamento: ${businessContext.businessHours}` : ''}
${businessContext.location ? `- Localização: ${businessContext.location}` : ''}
${businessContext.website ? `- Website: ${businessContext.website}` : ''}

## ESTILO DE CONVERSAÇÃO:
- Tom: ${conversationStyle.tone}
- Personalidade: ${conversationStyle.personality}
- Idioma: ${conversationStyle.language}
- Tamanho das respostas: ${conversationStyle.responseLength}
- Usar emojis: ${conversationStyle.useEmojis ? 'Sim' : 'Não'}

## INSTRUÇÕES GERAIS:
1. Sempre mantenha o tom ${conversationStyle.tone} e seja ${conversationStyle.personality}
2. Responda em ${conversationStyle.language}
3. Mantenha as respostas ${conversationStyle.responseLength === 'short' ? 'concisas' : conversationStyle.responseLength === 'medium' ? 'moderadas' : 'detalhadas'}
4. ${conversationStyle.useEmojis ? 'Use emojis quando apropriado' : 'Evite usar emojis'}
5. Sempre tente ajudar o cliente da melhor forma possível
6. Se não souber uma informação específica, seja honesto e ofereça alternativas
7. Mantenha o foco nos produtos/serviços da empresa

${customInstructions ? `## INSTRUÇÕES PERSONALIZADAS:\n${customInstructions}` : ''}

Lembre-se: Você representa a ${companyInfo.name} e deve sempre manter a qualidade e profissionalismo no atendimento.`;

    // Gera base de conhecimento estruturada
    const knowledgeBase = {
      company: companyInfo,
      business: businessContext,
      style: conversationStyle,
      entities: [
        { type: 'company', name: companyInfo.name, description: companyInfo.description },
        { type: 'industry', name: companyInfo.industry, description: `Setor de atuação: ${companyInfo.industry}` },
        ...businessContext.mainServices.map((service: string) => ({
          type: 'service',
          name: service,
          description: `Serviço oferecido pela ${companyInfo.name}`
        }))
      ],
      relationships: [
        { from: companyInfo.name, to: companyInfo.industry, type: 'OPERATES_IN' },
        ...businessContext.mainServices.map((service: string) => ({
          from: companyInfo.name,
          to: service,
          type: 'OFFERS'
        }))
      ]
    };

    return { systemPrompt, knowledgeBase };
  }
}

// Factory function
export function createAssistantConfigService(): AssistantConfigService {
  return new AssistantConfigService();
}