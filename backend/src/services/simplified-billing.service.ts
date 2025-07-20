import { supabase } from '../database/supabase-client';
import { Database } from '../../../shared/types/database';

type BillingCycle = Database['public']['Tables']['billing_cycles']['Row'];
type BillingCycleInsert = Database['public']['Tables']['billing_cycles']['Insert'];
type BillingCycleUpdate = Database['public']['Tables']['billing_cycles']['Update'];

/**
 * Serviço de cobrança simplificado
 * R$250 por instância/mês com 1.000 mensagens e 10 documentos
 */
export class SimplifiedBillingService {
  private readonly MONTHLY_PRICE = 250; // R$ 250 por mês
  private readonly MESSAGE_LIMIT = 1000; // 1.000 mensagens por mês
  private readonly DOCUMENT_LIMIT = 10; // 10 documentos por mês

  /**
   * Cria ciclo de cobrança para nova instância
   */
  async createBillingCycle(instanceId: string): Promise<{
    success: boolean;
    billingCycle?: BillingCycle;
    message: string;
  }> {
    try {
      const now = new Date();
      const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês
      const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês
      const dueDate = new Date(cycleEnd.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 dias após o fim do ciclo

      const { data: billingCycle, error } = await supabase
        .from('billing_cycles')
        .insert({
          instance_id: instanceId,
          cycle_start: cycleStart.toISOString(),
          cycle_end: cycleEnd.toISOString(),
          amount: this.MONTHLY_PRICE,
          currency: 'BRL',
          status: 'active',
          due_date: dueDate.toISOString(),
          message_count: 0,
          message_limit: this.MESSAGE_LIMIT,
          document_count: 0,
          document_limit: this.DOCUMENT_LIMIT,
          usage_details: {
            messages_by_day: {},
            documents_by_day: {},
            overage_charges: 0
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar ciclo de cobrança:', error);
        return {
          success: false,
          message: 'Erro ao criar ciclo de cobrança'
        };
      }

      return {
        success: true,
        billingCycle,
        message: 'Ciclo de cobrança criado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar ciclo de cobrança:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Obtém ciclo de cobrança atual da instância
   */
  async getCurrentBillingCycle(instanceId: string): Promise<{
    success: boolean;
    billingCycle?: BillingCycle;
    message: string;
  }> {
    try {
      const now = new Date();
      
      const { data: billingCycle, error } = await supabase
        .from('billing_cycles')
        .select('*')
        .eq('instance_id', instanceId)
        .lte('cycle_start', now.toISOString())
        .gte('cycle_end', now.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar ciclo de cobrança:', error);
        return {
          success: false,
          message: 'Erro ao buscar ciclo de cobrança'
        };
      }

      if (!billingCycle) {
        // Cria novo ciclo se não existir
        return await this.createBillingCycle(instanceId);
      }

      return {
        success: true,
        billingCycle,
        message: 'Ciclo de cobrança encontrado'
      };
    } catch (error) {
      console.error('Erro ao obter ciclo de cobrança:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Incrementa contador de mensagens
   */
  async incrementMessageCount(instanceId: string): Promise<{
    success: boolean;
    withinLimit: boolean;
    currentCount: number;
    limit: number;
    message: string;
  }> {
    try {
      const cycleResult = await this.getCurrentBillingCycle(instanceId);
      
      if (!cycleResult.success || !cycleResult.billingCycle) {
        return {
          success: false,
          withinLimit: false,
          currentCount: 0,
          limit: this.MESSAGE_LIMIT,
          message: 'Erro ao obter ciclo de cobrança'
        };
      }

      const cycle = cycleResult.billingCycle;
      const newCount = cycle.message_count + 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Atualiza contadores
      const usageDetails = cycle.usage_details as any || { messages_by_day: {}, documents_by_day: {}, overage_charges: 0 };
      usageDetails.messages_by_day[today] = (usageDetails.messages_by_day[today] || 0) + 1;

      const { error } = await supabase
        .from('billing_cycles')
        .update({
          message_count: newCount,
          usage_details: usageDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', cycle.id);

      if (error) {
        console.error('Erro ao incrementar contador de mensagens:', error);
        return {
          success: false,
          withinLimit: false,
          currentCount: cycle.message_count,
          limit: this.MESSAGE_LIMIT,
          message: 'Erro ao atualizar contador'
        };
      }

      const withinLimit = newCount <= this.MESSAGE_LIMIT;

      return {
        success: true,
        withinLimit,
        currentCount: newCount,
        limit: this.MESSAGE_LIMIT,
        message: withinLimit ? 'Mensagem contabilizada' : 'Limite de mensagens excedido'
      };
    } catch (error) {
      console.error('Erro ao incrementar contador de mensagens:', error);
      return {
        success: false,
        withinLimit: false,
        currentCount: 0,
        limit: this.MESSAGE_LIMIT,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Incrementa contador de documentos
   */
  async incrementDocumentCount(instanceId: string): Promise<{
    success: boolean;
    withinLimit: boolean;
    currentCount: number;
    limit: number;
    message: string;
  }> {
    try {
      const cycleResult = await this.getCurrentBillingCycle(instanceId);
      
      if (!cycleResult.success || !cycleResult.billingCycle) {
        return {
          success: false,
          withinLimit: false,
          currentCount: 0,
          limit: this.DOCUMENT_LIMIT,
          message: 'Erro ao obter ciclo de cobrança'
        };
      }

      const cycle = cycleResult.billingCycle;
      const newCount = cycle.document_count + 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Atualiza contadores
      const usageDetails = cycle.usage_details as any || { messages_by_day: {}, documents_by_day: {}, overage_charges: 0 };
      usageDetails.documents_by_day[today] = (usageDetails.documents_by_day[today] || 0) + 1;

      const { error } = await supabase
        .from('billing_cycles')
        .update({
          document_count: newCount,
          usage_details: usageDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', cycle.id);

      if (error) {
        console.error('Erro ao incrementar contador de documentos:', error);
        return {
          success: false,
          withinLimit: false,
          currentCount: cycle.document_count,
          limit: this.DOCUMENT_LIMIT,
          message: 'Erro ao atualizar contador'
        };
      }

      const withinLimit = newCount <= this.DOCUMENT_LIMIT;

      return {
        success: true,
        withinLimit,
        currentCount: newCount,
        limit: this.DOCUMENT_LIMIT,
        message: withinLimit ? 'Documento contabilizado' : 'Limite de documentos excedido'
      };
    } catch (error) {
      console.error('Erro ao incrementar contador de documentos:', error);
      return {
        success: false,
        withinLimit: false,
        currentCount: 0,
        limit: this.DOCUMENT_LIMIT,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verifica se instância pode processar mensagens
   */
  async canProcessMessage(instanceId: string): Promise<{
    canProcess: boolean;
    reason?: string;
    usage: {
      messages: { current: number; limit: number };
      documents: { current: number; limit: number };
    };
  }> {
    try {
      const cycleResult = await this.getCurrentBillingCycle(instanceId);
      
      if (!cycleResult.success || !cycleResult.billingCycle) {
        return {
          canProcess: false,
          reason: 'Ciclo de cobrança não encontrado',
          usage: {
            messages: { current: 0, limit: this.MESSAGE_LIMIT },
            documents: { current: 0, limit: this.DOCUMENT_LIMIT }
          }
        };
      }

      const cycle = cycleResult.billingCycle;
      const messagesWithinLimit = cycle.message_count < this.MESSAGE_LIMIT;
      
      return {
        canProcess: messagesWithinLimit,
        reason: messagesWithinLimit ? undefined : 'Limite de mensagens excedido',
        usage: {
          messages: { current: cycle.message_count, limit: this.MESSAGE_LIMIT },
          documents: { current: cycle.document_count, limit: this.DOCUMENT_LIMIT }
        }
      };
    } catch (error) {
      console.error('Erro ao verificar se pode processar mensagem:', error);
      return {
        canProcess: false,
        reason: 'Erro interno do servidor',
        usage: {
          messages: { current: 0, limit: this.MESSAGE_LIMIT },
          documents: { current: 0, limit: this.DOCUMENT_LIMIT }
        }
      };
    }
  }

  /**
   * Obtém relatório de uso da instância
   */
  async getUsageReport(instanceId: string): Promise<{
    success: boolean;
    report?: {
      currentCycle: BillingCycle;
      usage: {
        messages: { current: number; limit: number; percentage: number };
        documents: { current: number; limit: number; percentage: number };
      };
      billing: {
        amount: number;
        currency: string;
        dueDate: string;
        status: string;
      };
    };
    message: string;
  }> {
    try {
      const cycleResult = await this.getCurrentBillingCycle(instanceId);
      
      if (!cycleResult.success || !cycleResult.billingCycle) {
        return {
          success: false,
          message: 'Ciclo de cobrança não encontrado'
        };
      }

      const cycle = cycleResult.billingCycle;
      
      return {
        success: true,
        report: {
          currentCycle: cycle,
          usage: {
            messages: {
              current: cycle.message_count,
              limit: this.MESSAGE_LIMIT,
              percentage: Math.round((cycle.message_count / this.MESSAGE_LIMIT) * 100)
            },
            documents: {
              current: cycle.document_count,
              limit: this.DOCUMENT_LIMIT,
              percentage: Math.round((cycle.document_count / this.DOCUMENT_LIMIT) * 100)
            }
          },
          billing: {
            amount: cycle.amount,
            currency: cycle.currency,
            dueDate: cycle.due_date,
            status: cycle.status
          }
        },
        message: 'Relatório de uso obtido com sucesso'
      };
    } catch (error) {
      console.error('Erro ao obter relatório de uso:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Cria novos ciclos de cobrança para o próximo mês
   */
  async createNextMonthCycles(): Promise<{
    created: number;
    errors: string[];
  }> {
    try {
      const errors: string[] = [];
      let created = 0;

      // Busca instâncias ativas que precisam de novo ciclo
      const { data: instances, error } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('status', 'active');

      if (error) {
        errors.push(`Erro ao buscar instâncias: ${error.message}`);
        return { created, errors };
      }

      for (const instance of instances || []) {
        try {
          const result = await this.createBillingCycle(instance.id);
          if (result.success) {
            created++;
          } else {
            errors.push(`Erro ao criar ciclo para instância ${instance.id}: ${result.message}`);
          }
        } catch (error) {
          errors.push(`Erro ao processar instância ${instance.id}: ${error}`);
        }
      }

      return { created, errors };
    } catch (error) {
      console.error('Erro ao criar ciclos do próximo mês:', error);
      return {
        created: 0,
        errors: [`Erro interno: ${error}`]
      };
    }
  }
}

// Factory function
export function createSimplifiedBillingService(): SimplifiedBillingService {
  return new SimplifiedBillingService();
}