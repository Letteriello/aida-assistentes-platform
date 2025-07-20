/**
 * AIDA Platform - Conversation Management API
 * CRITICAL: Conversation monitoring, analytics, and management with tenant isolation
 * PATTERN: Follows assistant API patterns with real-time capabilities
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import {
  getBusinessContext,
  tenantIsolationMiddleware,
  requirePermission
} from '../auth/tenant-isolation';
import {
  logSecurityEvent,
  sanitizeInput,
  validateInput
} from '../database/security';
import type {
  Conversation,
  ConversationUpdate,
  Message,
  Env
} from '@shared/types';
import {
  conversationUpdateSchema,
  messageInsertSchema,
  PaginationSchema
} from '@shared/schemas';

const app = new Hono<{ Bindings: Env }>();

// Apply tenant isolation to all conversation endpoints
app.use('*', tenantIsolationMiddleware);

/**
 * List conversations for business
 * GET /api/conversations
 * AUTHENTICATED: Requires valid business API key
 */
app.get('/', zValidator('query', PaginationSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const { page = 1, limit = 20, search } = c.req.valid('query');

    // Parse additional query parameters
    const assistantId = c.req.query('assistantId');
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const dateFrom = c.req.query('dateFrom');
    const dateTo = c.req.query('dateTo');

    const offset = (page - 1) * limit;

    // Build query with tenant isolation (automatically applied by TenantAwareSupabase)
    let query = business.supabase
      .from('conversations')
      .select(`
        *,
        messages(count),
        latest_message:messages(content, created_at, sender_type)
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (assistantId) {
      validateInput(assistantId, 'assistant_id');
      query = query.eq('assistant_id', assistantId);
    }

    if (status && ['active', 'pending', 'resolved', 'escalated'].includes(status)) {
      query = query.eq('status', status);
    }

    if (priority && ['low', 'medium', 'high', 'urgent'].includes(priority)) {
      query = query.eq('priority', priority);
    }

    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      query = query.or(`customer_phone.ilike.%${sanitizedSearch}%,customer_name.ilike.%${sanitizedSearch}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: conversations, error, count } = await query;

    if (error) {
      throw new HTTPException(500, { message: 'Failed to fetch conversations' });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      conversations: conversations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        assistantId,
        status,
        priority,
        dateFrom,
        dateTo,
        search
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Get conversation by ID
 * GET /api/conversations/:id
 */
app.get('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');

    const { data: conversation, error } = await business.supabase
      .from('conversations')
      .select(`
        *,
        messages(*),
        assistant:assistants(id, name)
      `)
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }

    return c.json({ conversation });

  } catch (error) {
    console.error('Error fetching conversation:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Update conversation
 * PUT /api/conversations/:id
 */
app.put('/:id', zValidator('json', conversationUpdateSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');
    const validatedData = c.req.valid('json');

    // Sanitize input data
    const sanitizedData: Partial<ConversationUpdate> = {};

    if (validatedData.status) {
      sanitizedData.status = validatedData.status;
    }

    if (validatedData.priority) {
      sanitizedData.priority = validatedData.priority;
    }

    if (validatedData.notes !== undefined) {
      sanitizedData.notes = sanitizeInput(validatedData.notes || '');
    }

    if (validatedData.tags) {
      sanitizedData.tags = validatedData.tags.map(tag => sanitizeInput(tag));
    }

    // Update conversation
    const { data: conversation, error } = await business.supabase
      .from('conversations')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

    if (error || !conversation) {
      throw new HTTPException(404, { message: 'Conversation not found or update failed' });
    }

    // Log successful update
    await logSecurityEvent(
      business.supabase,
      business.businessId,
      'conversation_updated',
      `Conversation updated: ${conversationId}`
    );

    return c.json({
      success: true,
      conversation: conversation
    });

  } catch (error) {
    console.error('Error updating conversation:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Get conversation messages
 * GET /api/conversations/:id/messages
 */
app.get('/:id/messages', zValidator('query', PaginationSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');
    const { page = 1, limit = 50 } = c.req.valid('query');

    const offset = (page - 1) * limit;

    // First verify conversation exists and belongs to business
    const { data: conversation, error: convError } = await business.supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }

    // Get messages
    const { data: messages, error, count } = await business.supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new HTTPException(500, { message: 'Failed to fetch messages' });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Send message to conversation
 * POST /api/conversations/:id/messages
 */
app.post('/:id/messages', zValidator('json', messageInsertSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');
    const validatedData = c.req.valid('json');

    // First verify conversation exists and belongs to business
    const { data: conversation, error: convError } = await business.supabase
      .from('conversations')
      .select('id, status')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }

    // Sanitize message content
    const sanitizedContent = sanitizeInput(validatedData.content);
    validateInput(sanitizedContent, 'message_content');

    // Create message
    const { data: message, error } = await business.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: sanitizedContent,
        sender_type: validatedData.sender_type,
        sender_id: validatedData.sender_id,
        message_type: validatedData.message_type || 'text',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new HTTPException(500, { message: 'Failed to send message' });
    }

    // Update conversation's last activity
    await business.supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return c.json({
      success: true,
      message: message
    }, 201);

  } catch (error) {
    console.error('Error sending message:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Export conversation data
 * GET /api/conversations/:id/export
 */
app.get('/:id/export', async (c) => {
  try {
    const business = getBusinessContext(c);
    const conversationId = c.req.param('id');
    const format = c.req.query('format') || 'json';

    // Get conversation with messages
    const { data: conversation, error } = await business.supabase
      .from('conversations')
      .select(`
        *,
        messages(*),
        assistant:assistants(id, name)
      `)
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      throw new HTTPException(404, { message: 'Conversation not found' });
    }

    // Log export event
    await logSecurityEvent(
      business.supabase,
      business.businessId,
      'conversation_exported',
      `Conversation exported: ${conversationId}`
    );

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['timestamp', 'sender_type', 'sender_id', 'content', 'message_type'];
      const csvRows = conversation.messages.map((msg: any) => [
        msg.created_at,
        msg.sender_type,
        msg.sender_id || '',
        msg.content.replace(/"/g, '""'), // Escape quotes
        msg.message_type
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      c.header('Content-Type', 'text/csv');
      c.header('Content-Disposition', `attachment; filename="conversation_${conversationId}.csv"`);
      return c.text(csvContent);
    }

    // Default JSON format
    return c.json({
      conversation,
      exported_at: new Date().toISOString(),
      format: 'json'
    });

  } catch (error) {
    console.error('Error exporting conversation:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default app;
