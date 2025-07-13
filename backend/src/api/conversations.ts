/**
 * AIDA Platform - Conversation Management API
 * CRITICAL: Conversation monitoring, analytics, and management with tenant isolation
 * PATTERN: Follows assistant API patterns with real-time capabilities
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getBusinessContext, requirePermission, tenantIsolationMiddleware } from '../auth/tenant-isolation';
import { logSecurityEvent, sanitizeInput, validateInput } from '../database/security';
import type { Conversation, Env, Message } from '@shared/types';
import { 
  conversationUpdateSchema,
  messageInsertSchema,
  PaginationSchema,
  ExportRequestSchema
} from '@shared/schemas';

const app = new Hono<{ Bindings: Env }>();

// Apply tenant isolation to all conversation endpoints
app.use('*', tenantIsolationMiddleware);

/**
 * List conversations for business
 * GET /api/conversations
 * AUTHENTICATED: Requires valid business API key
 */
app.get('/', async (c) => {
  try {
    const business = getBusinessContext(c);
    
    // Parse query parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const assistantId = c.req.query('assistantId');
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const search = c.req.query('search');
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');

    // Validate pagination
    const paginationData = PaginationSchema.parse({ page, limit });

    // Build query with tenant isolation (automatically applied by TenantAwareSupabase)
    let query = business.supabase
      .from('conversations')
      .select(`
        *,
        assistant:assistants(id, name),
        messages(count),
        latest_message:messages(content, created_at, sender_type)
      `, { count: 'exact' });

    // Apply filters
    if (assistantId) {
      // validateInput(assistantId, 'assistant_id');
      query = query.eq('assistant_id', assistantId);
    }

    if (status && ['active', 'resolved', 'escalated', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      query = query.eq('priority' as any, priority);
    }

    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      query = query.or(`customer_name.ilike.%${sanitizedSearch}%,context_summary.ilike.%${sanitizedSearch}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply pagination and ordering
    const offset = (paginationData.page - 1) * paginationData.limit;
    query = query
      .order('last_message_at', { ascending: false })
      .range(offset, offset + paginationData.limit - 1);

    const { data: conversations, error, count } = await query;

    if (error) {
      console.error('Conversation list query failed:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch conversations' 
      });
    }

    const totalPages = Math.ceil((count || 0) / paginationData.limit);

    return c.json({
      success: true,
      conversations: conversations || [],
      pagination: {
        page: paginationData.page,
        limit: paginationData.limit,
        total: count || 0,
        totalPages,
        hasNext: paginationData.page < totalPages,
        hasPrev: paginationData.page > 1
      },
      filters: {
        assistantId,
        status,
        priority,
        search,
        dateFrom,
        dateTo
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Conversation list error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to fetch conversations' 
    });
  }
});

/**
 * Get conversation by ID with full message history
 * GET /api/conversations/:id
 * AUTHENTICATED: Requires valid business API key
 */
app.get('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');

    if (!conversationId) {
      throw new HTTPException(400, { 
        message: 'Conversation ID is required' 
      });
    }

    // validateInput(conversationId, 'conversation_id');

    // Get conversation with assistant info
    const { data: conversation, error: convError } = await business.supabase
      .from('conversations')
      .select(`
        *,
        assistant:assistants(id, name, personality_prompt, settings)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new HTTPException(404, { 
        message: 'Conversation not found' 
      });
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await business.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (msgError) {
      console.error('Messages query failed:', msgError);
      throw new HTTPException(500, { 
        message: 'Failed to fetch conversation messages' 
      });
    }

    // Get conversation analytics
    const messageCount = messages?.length || 0;
    const customerMessages = messages?.filter(m => (m as any).sender_type === 'customer').length || 0;
    const assistantMessages = messages?.filter(m => (m as any).sender_type === 'assistant').length || 0;

    const avgResponseTime = calculateAverageResponseTime(messages as any[] || []);

    return c.json({
      success: true,
      conversation: {
        ...
        messageCount,
        customerMessages,
        assistantMessages,
        avgResponseTime
      },
      messages: messages || []
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Conversation fetch error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to fetch conversation' 
    });
  }
});

/**
 * Update conversation status/priority
 * PUT /api/conversations/:id
 * AUTHENTICATED: Requires valid business API key
 */
app.put('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');
    const body = await c.req.json();

    if (!conversationId) {
      throw new HTTPException(400, { 
        message: 'Conversation ID is required' 
      });
    }

    // Validate input with Zod schema
    const validatedData = conversationUpdateSchema.parse(body);

    const updateData: Partial<Conversation> = {
      updated_at: new Date().toISOString()
    };

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    if ((validatedData as any).priority !== undefined) {
      (updateData as any).priority = (validatedData as any).priority;
    }

    if ((validatedData as any).customerName !== undefined) {
      updateData.customer_name = sanitizeInput((validatedData as any).customerName);
    }

    if (validatedData.context_summary !== undefined) {
      updateData.context_summary = sanitizeInput(validatedData.context_summary as string);
    }

    if ((validatedData as any).tags !== undefined) {
      (updateData as any).tags = (validatedData as any).tags.map((tag: string) => sanitizeInput(tag));
    }

    // Update conversation with tenant isolation
    const { data: updatedConversation, error } = await business.supabase
      .from('conversations')
      .update(updateData as any)
      .eq('id', conversationId)
      .select()
      .single();

    if (error || !updatedConversation) {
      if ((error as any)?.code === 'PGRST116') {
        throw new HTTPException(404, { 
          message: 'Conversation not found' 
        });
      }

      console.error('Conversation update failed:', error);
      throw new HTTPException(500, { 
        message: 'Failed to update conversation' 
      });
    }

    logSecurityEvent('conversation_updated', `Conversation updated: ${conversationId}`, business.businessId);

    return c.json({
      success: true,
      conversation: updatedConversation,
      message: 'Conversation updated successfully'
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Conversation update error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to update conversation' 
    });
  }
});

/**
 * Add manual message to conversation
 * POST /api/conversations/:id/messages
 * AUTHENTICATED: Requires valid business API key
 */
app.post('/:id/messages', async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');
    const body = await c.req.json();

    if (!conversationId) {
      throw new HTTPException(400, { 
        message: 'Conversation ID is required' 
      });
    }

    // Validate input with Zod schema
    const validatedData = messageInsertSchema.parse(body);

    // Verify conversation exists and belongs to business
    const { data: conversation, error: convError } = await business.supabase
      .from('conversations')
      .select('id, assistant_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new HTTPException(404, { 
        message: 'Conversation not found' 
      });
    }

    // Create message
    const message: Partial<Message> = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: conversationId,
      content: sanitizeInput(validatedData.content),
      sender_type: validatedData.sender_type,
      message_type: validatedData.message_type || 'text',
      timestamp: new Date().toISOString(),
      metadata: (validatedData as any).metadata || {}
    };

    const { data: createdMessage, error: msgError } = await business.supabase
      .from('messages')
      .insert(message as any)
      .select()
      .single();

    if (msgError || !createdMessage) {
      console.error('Message creation failed:', msgError);
      throw new HTTPException(500, { 
        message: 'Failed to create message' 
      });
    }

    // Update conversation last_message_at
    await business.supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return c.json({
      success: true,
      message: createdMessage
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Message creation error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to create message' 
    });
  }
});

/**
 * Export conversations to CSV/JSON
 * POST /api/conversations/export
 * AUTHENTICATED: Requires analytics permission
 */
app.post('/export', requirePermission('canAccessAnalytics'), async (c) => {
  try {
    const business = getBusinessContext(c);
    const body = await c.req.json();

    // Validate export request
    const validatedData = ExportRequestSchema.parse(body);

    // Build query based on filters
    let query = business.supabase
      .from('conversations')
      .select(`
        *,
        assistant:assistants(name),
        messages(content, sender_type, timestamp)
      `);

    // Apply filters
    if ((validatedData as any).assistantId) {
      query = query.eq('assistant_id', (validatedData as any).assistantId);
    }

    if ((validatedData as any).status) {
      query = query.in('status', (validatedData as any).status);
    }

    if ((validatedData as any).dateFrom) {
      query = query.gte('created_at', (validatedData as any).dateFrom);
    }

    if ((validatedData as any).dateTo) {
      query = query.lte('created_at', (validatedData as any).dateTo);
    }

    // Limit export size for performance
    query = query.limit((validatedData as any).limit || 1000);

    const { data: conversations, error } = await query;

    if (error) {
      console.error('Export query failed:', error);
      throw new HTTPException(500, { 
        message: 'Failed to export conversations' 
      });
    }

    // Format data based on requested format
    let exportData: any;
    let contentType: string;
    let filename: string;

    if (validatedData.format === 'csv') {
      exportData = formatConversationsAsCSV(conversations || []);
      contentType = 'text/csv';
      filename = `conversations_${business.businessId}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      exportData = JSON.stringify({
        exportedAt: new Date(),
        businessId: business.businessId,
        totalConversations: conversations?.length || 0,
        conversations: conversations || []
      }, null, 2);
      contentType = 'application/json';
      filename = `conversations_${business.businessId}_${new Date().toISOString().split('T')[0]}.json`;
    }

    logSecurityEvent('conversations_exported', `Conversations exported: ${conversations?.length || 0} records`, business.businessId);

    return new Response(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Export error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to export conversations' 
    });
  }
});

/**
 * Get conversation analytics summary
 * GET /api/conversations/analytics
 * AUTHENTICATED: Requires analytics permission
 */
app.get('/analytics', requirePermission('canAccessAnalytics'), async (c) => {
  try {
    const business = getBusinessContext(c);
    
    const assistantId = c.req.query('assistantId');
    const dateFrom = c.req.query('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = c.req.query('dateTo') || new Date().toISOString();

    // Build base query
    let baseQuery = business.supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    if (assistantId) {
      baseQuery = baseQuery.eq('assistant_id', assistantId);
    }

    // Get conversation counts by status
    const statusPromises = ['active', 'resolved', 'escalated', 'archived'].map(async (status) => {
      const { count } = await baseQuery.eq('status', status);
      return { status, count: count || 0 };
    });

    const statusCounts = await Promise.all(statusPromises);

    // Get priority distribution
    const priorityPromises = ['low', 'medium', 'high', 'urgent'].map(async (priority) => {
      const { count } = await baseQuery.eq('priority' as any, priority);
      return { priority, count: count || 0 };
    });

    const priorityCounts = await Promise.all(priorityPromises);

    // Get total counts
    const { count: totalConversations } = await baseQuery;

    // Get average response time and other metrics
    const { data: conversations } = await business.supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        messages(content, sender_type, timestamp)
      `)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo);

    const analytics = calculateConversationAnalytics(conversations || []);

    return c.json({
      success: true,
      analytics: {
        period: {
          from: dateFrom,
          to: dateTo
        },
        totals: {
          conversations: totalConversations || 0,
          ...analytics.totals
        },
        statusDistribution: statusCounts,
        priorityDistribution: priorityCounts,
        averages: analytics.averages,
        trends: analytics.trends,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Analytics error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to fetch analytics' 
    });
  }
});

/**
 * Search conversations with full-text search
 * GET /api/conversations/search
 * AUTHENTICATED: Requires valid business API key
 */
app.get('/search', async (c) => {
  try {
    const business = getBusinessContext(c);
    
    const query = c.req.query('q');
    const limit = parseInt(c.req.query('limit') || '20');

    if (!query) {
      throw new HTTPException(400, { 
        message: 'Search query is required' 
      });
    }

    const sanitizedQuery = sanitizeInput(query);

    // Full-text search across conversations and messages
    const { data: results, error } = await (business.supabase as any).rpc('search_conversations', {
      search_query: sanitizedQuery,
      business_id: business.businessId,
      result_limit: limit
    });

    if (error) {
      console.error('Search query failed:', error);
      throw new HTTPException(500, { 
        message: 'Search failed' 
      });
    }

    return c.json({
      success: true,
      query: sanitizedQuery,
      results: results || [],
      totalResults: results?.length || 0
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Search error:', error);
    throw new HTTPException(500, { 
      message: 'Search failed' 
    });
  }
});

/**
 * Calculate average response time from messages
 */
function calculateAverageResponseTime(messages: Message[]): number {
  const responseTimes: number[] = [];
  
  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1];
    const currMsg = messages[i];
    
    if (prevMsg?.sender_type === 'customer' && currMsg?.sender_type === 'assistant') {
      const responseTime = new Date(currMsg!.timestamp).getTime() - new Date(prevMsg!.timestamp).getTime();
      responseTimes.push(responseTime);
    }
  }
  
  if (responseTimes.length === 0) {return 0;}
  
  return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
}

/**
 * Calculate comprehensive conversation analytics
 */
function calculateConversationAnalytics(conversations: any[]) {
  const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messages?.length || 0), 0);
  const totalCustomerMessages = conversations.reduce((sum, conv) => 
    sum + (conv.messages?.filter((m: any) => m.sender_type === 'customer')?.length || 0), 0);
  const totalAssistantMessages = conversations.reduce((sum, conv) => 
    sum + (conv.messages?.filter((m: any) => m.sender_type === 'assistant')?.length || 0), 0);

  return {
    totals: {
      messages: totalMessages,
      customerMessages: totalCustomerMessages,
      assistantMessages: totalAssistantMessages
    },
    averages: {
      messagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0,
      responseTime: conversations.reduce((sum, conv) => 
        sum + calculateAverageResponseTime(conv.messages || []), 0) / Math.max(conversations.length, 1)
    },
    trends: {
      // This would be calculated based on time-series data
      conversationGrowth: 0,
      responseTimeImprovement: 0
    }
  };
}

/**
 * Format conversations as CSV
 */
function formatConversationsAsCSV(conversations: any[]): string {
  const headers = [
    'ID',
    'Assistant',
    'Customer Name',
    'Status',
    'Priority',
    'Created At',
    'Last Message At',
    'Message Count',
    'Context Summary'
  ];

  const rows = conversations.map(conv => [
    conv.id,
    conv.assistant?.name || '',
    conv.customer_name || '',
    conv.status,
    conv.priority,
    conv.created_at,
    conv.last_message_at,
    conv.messages?.length || 0,
    conv.context_summary || ''
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export { app as ConversationAPI };
