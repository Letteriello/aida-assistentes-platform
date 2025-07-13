/**
 * AIDA Platform - Dashboard API Endpoints
 * Provides analytics and overview data for the dashboard
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { getBusinessContext, tenantIsolationMiddleware } from '../auth/tenant-isolation';
import { TenantAwareSupabase } from '../supabase/tenant-aware';
import { PlatformStats } from '../../shared/types';

const app = new Hono();

// Apply tenant isolation to all routes
app.use('*', tenantIsolationMiddleware);

/**
 * GET /dashboard/stats
 * Get basic dashboard statistics
 */
app.get('/stats', async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    
    // Get total assistants
    const { count: totalAssistants } = await supabase
      .from('assistants')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);
    
    // Get active conversations
    const { count: activeConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    // Get messages from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: messagesTotal } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    // Calculate average response time from recent messages
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('metadata')
      .eq('sender_type', 'assistant')
      .not('metadata->processing_time_ms', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);
    
    let avgResponseTime = 0;
    if (recentMessages && recentMessages.length > 0) {
      const processingTimes = recentMessages
        .map(msg => msg.metadata?.processing_time_ms)
        .filter(time => typeof time === 'number');
      
      if (processingTimes.length > 0) {
        avgResponseTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      }
    }
    
    return c.json({
      total_assistants: totalAssistants || 0,
      active_conversations: activeConversations || 0,
      total_messages_today: messagesTotal || 0,
      response_time_avg: Math.round(avgResponseTime)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return c.json({ error: 'Failed to fetch dashboard statistics' }, 500);
  }
});

/**
 * GET /dashboard/platform-stats
 * Get detailed platform performance statistics
 */
app.get('/platform-stats', async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    
    // Get embedding statistics
    const { data: embeddingStats } = await supabase
      .from('knowledge_nodes')
      .select('created_at, metadata')
      .eq('business_id', businessId)
      .not('embeddings', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    // Get message processing statistics
    const { data: messageStats } = await supabase
      .from('messages')
      .select('metadata, confidence_score, created_at')
      .eq('sender_type', 'assistant')
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    // Get conversation statistics
    const { data: conversationStats } = await supabase
      .from('conversations')
      .select('created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    // Calculate embedding service stats
    const embeddingServiceStats = {
      total_embeddings_generated: embeddingStats?.length || 0,
      average_processing_time_ms: 150, // Placeholder - would come from actual metrics
      cache_hit_rate: 0.85 // Placeholder - would come from actual cache metrics
    };
    
    // Calculate vector search stats
    const vectorSearchStats = {
      total_searches: messageStats?.length || 0,
      average_response_time_ms: 45, // Placeholder
      average_similarity_score: 0.78 // Placeholder
    };
    
    // Calculate hybrid query stats
    const hybridQueryStats = {
      total_queries: messageStats?.length || 0,
      average_processing_time_ms: 120, // Placeholder
      knowledge_graph_hits: Math.floor((messageStats?.length || 0) * 0.6),
      vector_search_hits: Math.floor((messageStats?.length || 0) * 0.8)
    };
    
    // Calculate LangChain processor stats
    const langchainProcessorStats = {
      total_processed: messageStats?.length || 0,
      average_processing_time_ms: 200, // Placeholder
      success_rate: 0.95 // Placeholder
    };
    
    // Calculate AI response generator stats
    const aiResponseStats = messageStats || [];
    const totalResponses = aiResponseStats.length;
    const avgConfidence = totalResponses > 0 
      ? aiResponseStats.reduce((sum, msg) => sum + (msg.confidence_score || 0), 0) / totalResponses
      : 0;
    
    const avgGenerationTime = totalResponses > 0
      ? aiResponseStats.reduce((sum, msg) => {
        const processingTime = msg.metadata?.processing_time_ms || 0;
        return sum + processingTime;
      }, 0) / totalResponses
      : 0;
    
    const aiResponseGeneratorStats = {
      total_responses: totalResponses,
      average_generation_time_ms: Math.round(avgGenerationTime),
      average_confidence_score: avgConfidence
    };
    
    // Calculate webhook handler stats
    const webhookHandlerStats = {
      total_webhooks_processed: conversationStats?.length || 0,
      success_rate: 0.98, // Placeholder
      average_processing_time_ms: 80 // Placeholder
    };
    
    const platformStats: PlatformStats = {
      embedding_service: embeddingServiceStats,
      vector_search: vectorSearchStats,
      hybrid_query: hybridQueryStats,
      langchain_processor: langchainProcessorStats,
      ai_response_generator: aiResponseGeneratorStats,
      webhook_handler: webhookHandlerStats
    };
    
    return c.json(platformStats);
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return c.json({ error: 'Failed to fetch platform statistics' }, 500);
  }
});

/**
 * GET /dashboard/recent-activity
 * Get recent activity feed for the dashboard
 */
app.get('/recent-activity', async (c) => {
  try {
    const { businessId, supabase } = getBusinessContext(c);
    
    // Get recent messages
    const { data: recentMessages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_type,
        created_at,
        conversation:conversations(
          id,
          customer_name,
          remote_jid,
          assistant:assistants(
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Get recent assistant creations
    const { data: recentAssistants } = await supabase
      .from('assistants')
      .select('id, name, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get recent conversation status changes
    const { data: recentConversations } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        customer_name,
        remote_jid,
        updated_at,
        assistant:assistants(
          id,
          name
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    // Combine and format activity feed
    const activities = [];
    
    // Add message activities
    if (recentMessages) {
      recentMessages.forEach(message => {
        activities.push({
          id: `message-${message.id}`,
          type: 'message',
          title: message.sender_type === 'customer' ? 'Nova mensagem recebida' : 'Resposta enviada',
          description: `${message.sender_type === 'customer' ? 'Cliente' : 'Assistente'}: ${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`,
          timestamp: message.created_at,
          metadata: {
            conversation_id: message.conversation?.id,
            customer_name: message.conversation?.customer_name,
            assistant_name: message.conversation?.assistant?.name
          }
        });
      });
    }
    
    // Add assistant creation activities
    if (recentAssistants) {
      recentAssistants.forEach(assistant => {
        activities.push({
          id: `assistant-${assistant.id}`,
          type: 'assistant_created',
          title: 'Novo assistente criado',
          description: `Assistente "${assistant.name}" foi configurado`,
          timestamp: assistant.created_at,
          metadata: {
            assistant_id: assistant.id,
            assistant_name: assistant.name
          }
        });
      });
    }
    
    // Add conversation status activities
    if (recentConversations) {
      recentConversations.forEach(conversation => {
        activities.push({
          id: `conversation-${conversation.id}`,
          type: 'conversation_status',
          title: `Conversa ${conversation.status === 'resolved' ? 'resolvida' : conversation.status === 'escalated' ? 'escalada' : 'atualizada'}`,
          description: `Conversa com ${conversation.customer_name || conversation.remote_jid} foi ${conversation.status === 'resolved' ? 'resolvida' : conversation.status === 'escalated' ? 'escalada' : 'atualizada'}`,
          timestamp: conversation.updated_at,
          metadata: {
            conversation_id: conversation.id,
            customer_name: conversation.customer_name,
            assistant_name: conversation.assistant?.name,
            status: conversation.status
          }
        });
      });
    }
    
    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({
      activities: activities.slice(0, 20)
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return c.json({ error: 'Failed to fetch recent activity' }, 500);
  }
});

/**
 * GET /dashboard/health
 * Get system health status
 */
app.get('/health', async (c) => {
  try {
    const { supabase } = getBusinessContext(c);
    
    // Test database connection
    const dbStart = Date.now();
    const { error: dbError } = await supabase
      .from('businesses')
      .select('id')
      .limit(1);
    const dbResponseTime = Date.now() - dbStart;
    
    // Test Evolution API (placeholder)
    const evolutionApiHealth = {
      status: 'healthy' as const,
      response_time_ms: 50 // Placeholder
    };
    
    // Test AI services (placeholder)
    const aiServiceHealth = {
      status: 'healthy' as const,
      response_time_ms: 200 // Placeholder
    };
    
    const healthStatus = {
      status: (dbError ? 'unhealthy' : 'healthy') as const,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: (dbError ? 'unhealthy' : 'healthy') as const,
          response_time_ms: dbResponseTime,
          error: dbError?.message
        },
        evolution_api: evolutionApiHealth,
        ai_service: aiServiceHealth
      }
    };
    
    return c.json(healthStatus);
  } catch (error) {
    console.error('Error checking system health:', error);
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'unhealthy',
          error: 'Failed to check database health'
        },
        evolution_api: {
          status: 'unknown',
          error: 'Failed to check Evolution API health'
        },
        ai_service: {
          status: 'unknown',
          error: 'Failed to check AI service health'
        }
      }
    }, 500);
  }
});

export default app;