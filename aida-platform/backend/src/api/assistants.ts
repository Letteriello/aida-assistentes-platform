/**
 * AIDA Platform - Assistant Management API
 * CRITICAL: CRUD operations for AI assistants with tenant isolation
 * PATTERN: Follows MCP server tool patterns but for REST API endpoints
 */

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { getBusinessContext, tenantIsolationMiddleware, validateSubscriptionLimits } from '../auth/tenant-isolation';
import { createEvolutionClient } from '../evolution-api/client';
import { logSecurityEvent, sanitizeInput, validateInput } from '../database/security';
import type { Assistant, AssistantCreate, AssistantUpdate, Env } from '@shared/types';
import { 
  AssistantCreateSchema, 
  AssistantTestSchema, 
  AssistantUpdateSchema,
  PaginationSchema 
} from '@shared/schemas';

const app = new Hono<{ Bindings: Env }>();

// Apply tenant isolation to all assistant endpoints
app.use('*', tenantIsolationMiddleware);

/**
 * Create new assistant
 * POST /api/assistants
 * AUTHENTICATED: Requires valid business API key
 */
app.post('/', validateSubscriptionLimits('assistants'), async (c) => {
  try {
    const business = getBusinessContext(c);
    const body = await c.req.json();

    // Validate input with Zod schema
    const validatedData = AssistantCreateSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      name: sanitizeInput(validatedData.name),
      description: sanitizeInput(validatedData.description || ''),
      personalityPrompt: sanitizeInput(validatedData.personalityPrompt),
      systemPrompt: sanitizeInput(validatedData.systemPrompt || ''),
      industry: validatedData.industry ? sanitizeInput(validatedData.industry) : null
    };

    // Additional validation
    validateInput(sanitizedData.name, 'assistant_name');
    validateInput(sanitizedData.personalityPrompt, 'personality_prompt');

    // Generate unique assistant ID
    const assistantId = `assistant_${nanoid(24)}`;

    // Create Evolution API instance for WhatsApp integration
    const evolutionClient = createEvolutionClient({
      baseUrl: c.env.EVOLUTION_API_BASE_URL || 'http://localhost:8080',
      apiKey: c.env.EVOLUTION_API_KEY,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimitPerMinute: 60
    });

    // Create WhatsApp instance
    const instanceName = `aida_${business.businessId.replace('business_', '')}_${nanoid(8)}`;
    const evolutionInstance = await evolutionClient.createInstance({
      instanceName,
      qrcode: true,
      webhook: `${c.env.WEBHOOK_BASE_URL}/webhook/whatsapp`,
      webhookEvents: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
      webhookBase64: false
    });

    // Create assistant record with tenant isolation
    const assistant: Partial<Assistant> = {
      id: assistantId,
      business_id: business.businessId,
      name: sanitizedData.name,
      description: sanitizedData.description,
      personality_prompt: sanitizedData.personalityPrompt,
      system_prompt: sanitizedData.systemPrompt,
      industry: sanitizedData.industry,
      whatsapp_instance_id: evolutionInstance.instanceName,
      whatsapp_qr_code: evolutionInstance.qrcode,
      status: 'created',
      is_active: false, // Will be activated after QR code scan
      settings: {
        max_response_length: validatedData.settings?.maxResponseLength || 500,
        confidence_threshold: validatedData.settings?.confidenceThreshold || 0.7,
        escalation_keywords: validatedData.settings?.escalationKeywords || ['manager', 'supervisor', 'human'],
        response_style: validatedData.settings?.responseStyle || 'friendly',
        enable_emojis: validatedData.settings?.enableEmojis ?? true,
        enable_memory: validatedData.settings?.enableMemory ?? true,
        fallback_enabled: validatedData.settings?.fallbackEnabled ?? true
      },
      metrics: {
        total_conversations: 0,
        total_messages: 0,
        avg_response_time_ms: 0,
        satisfaction_rating: 0,
        escalation_rate: 0,
        fallback_rate: 0
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data: createdAssistant, error } = await business.supabase
      .from('assistants')
      .insert(assistant)
      .select()
      .single();

    if (error || !createdAssistant) {
      console.error('Assistant creation failed:', error);
      
      // Cleanup Evolution API instance if database insert failed
      try {
        await evolutionClient.deleteInstance(instanceName);
      } catch (cleanupError) {
        console.warn('Failed to cleanup Evolution instance:', cleanupError);
      }

      throw new HTTPException(500, { 
        message: 'Failed to create assistant' 
      });
    }

    // Log successful creation
    logSecurityEvent('assistant_created', 'New assistant created', business.businessId, {
      assistantId,
      assistantName: sanitizedData.name,
      evolutionInstance: instanceName
    });

    console.log(`Assistant created: ${assistantId} (${sanitizedData.name}) for business ${business.businessId}`);

    return c.json({
      success: true,
      assistant: createdAssistant,
      whatsappSetup: {
        instanceName: evolutionInstance.instanceName,
        qrCode: evolutionInstance.qrcode,
        status: 'pending_connection',
        instructions: 'Scan the QR code with WhatsApp to connect your assistant'
      },
      message: 'Assistant created successfully. Please scan the QR code to activate WhatsApp integration.'
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant creation error:', error);
    logSecurityEvent('assistant_creation_error', 'Assistant creation failed', undefined, {
      error: error instanceof Error ? error.message : String(error)
    });

    throw new HTTPException(500, { 
      message: 'Failed to create assistant. Please try again.' 
    });
  }
});

/**
 * List assistants for business
 * GET /api/assistants
 * AUTHENTICATED: Requires valid business API key
 */
app.get('/', async (c) => {
  try {
    const business = getBusinessContext(c);
    
    // Parse pagination parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const status = c.req.query('status');
    const search = c.req.query('search');

    // Validate pagination
    const paginationData = PaginationSchema.parse({ page, limit });

    // Build query with tenant isolation (automatically applied by TenantAwareSupabase)
    let query = business.supabase
      .from('assistants')
      .select('*, metrics, settings', { count: 'exact' });

    // Apply filters
    if (status && ['active', 'inactive', 'created', 'error'].includes(status)) {
      query = query.eq('status', status);
    }

    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    // Apply pagination
    const offset = (paginationData.page - 1) * paginationData.limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + paginationData.limit - 1);

    const { data: assistants, error, count } = await query;

    if (error) {
      console.error('Assistant list query failed:', error);
      throw new HTTPException(500, { 
        message: 'Failed to fetch assistants' 
      });
    }

    const totalPages = Math.ceil((count || 0) / paginationData.limit);

    return c.json({
      success: true,
      assistants: assistants || [],
      pagination: {
        page: paginationData.page,
        limit: paginationData.limit,
        total: count || 0,
        totalPages,
        hasNext: paginationData.page < totalPages,
        hasPrev: paginationData.page > 1
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant list error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to fetch assistants' 
    });
  }
});

/**
 * Get assistant by ID
 * GET /api/assistants/:id
 * AUTHENTICATED: Requires valid business API key
 */
app.get('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');

    if (!assistantId) {
      throw new HTTPException(400, { 
        message: 'Assistant ID is required' 
      });
    }

    // Validate assistant ID format
    validateInput(assistantId, 'assistant_id');

    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (error || !assistant) {
      throw new HTTPException(404, { 
        message: 'Assistant not found' 
      });
    }

    // Get WhatsApp connection status if instance exists
    let whatsappStatus = null;
    if (assistant.whatsapp_instance_id) {
      try {
        const evolutionClient = createEvolutionClient({
          baseUrl: c.env.EVOLUTION_API_BASE_URL || 'http://localhost:8080',
          apiKey: c.env.EVOLUTION_API_KEY,
          timeout: 10000,
          retryAttempts: 1,
          retryDelay: 500,
          rateLimitPerMinute: 60
        });

        whatsappStatus = await evolutionClient.getInstanceStatus(assistant.whatsapp_instance_id);
      } catch (error) {
        console.warn(`Failed to get WhatsApp status for ${assistantId}:`, error);
        whatsappStatus = { status: 'unknown', error: 'Unable to check status' };
      }
    }

    return c.json({
      success: true,
      assistant,
      whatsappStatus
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant fetch error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to fetch assistant' 
    });
  }
});

/**
 * Update assistant
 * PUT /api/assistants/:id
 * AUTHENTICATED: Requires valid business API key
 */
app.put('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');
    const body = await c.req.json();

    if (!assistantId) {
      throw new HTTPException(400, { 
        message: 'Assistant ID is required' 
      });
    }

    // Validate input with Zod schema
    const validatedData = AssistantUpdateSchema.parse(body);

    // Sanitize input data
    const updateData: Partial<Assistant> = {
      updated_at: new Date()
    };

    if (validatedData.name !== undefined) {
      updateData.name = sanitizeInput(validatedData.name);
      validateInput(updateData.name, 'assistant_name');
    }

    if (validatedData.description !== undefined) {
      updateData.description = sanitizeInput(validatedData.description);
    }

    if (validatedData.personalityPrompt !== undefined) {
      updateData.personality_prompt = sanitizeInput(validatedData.personalityPrompt);
      validateInput(updateData.personality_prompt, 'personality_prompt');
    }

    if (validatedData.systemPrompt !== undefined) {
      updateData.system_prompt = sanitizeInput(validatedData.systemPrompt);
    }

    if (validatedData.isActive !== undefined) {
      updateData.is_active = validatedData.isActive;
    }

    if (validatedData.settings) {
      // Merge with existing settings
      const { data: currentAssistant } = await business.supabase
        .from('assistants')
        .select('settings')
        .eq('id', assistantId)
        .single();

      if (currentAssistant) {
        updateData.settings = {
          ...currentAssistant.settings,
          ...validatedData.settings
        };
      }
    }

    // Update assistant with tenant isolation
    const { data: updatedAssistant, error } = await business.supabase
      .from('assistants')
      .update(updateData)
      .eq('id', assistantId)
      .select()
      .single();

    if (error || !updatedAssistant) {
      if (error?.code === 'PGRST116') {
        throw new HTTPException(404, { 
          message: 'Assistant not found' 
        });
      }

      console.error('Assistant update failed:', error);
      throw new HTTPException(500, { 
        message: 'Failed to update assistant' 
      });
    }

    logSecurityEvent('assistant_updated', 'Assistant updated', business.businessId, {
      assistantId,
      updatedFields: Object.keys(updateData)
    });

    return c.json({
      success: true,
      assistant: updatedAssistant,
      message: 'Assistant updated successfully'
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant update error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to update assistant' 
    });
  }
});

/**
 * Delete assistant
 * DELETE /api/assistants/:id
 * AUTHENTICATED: Requires valid business API key
 */
app.delete('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');

    if (!assistantId) {
      throw new HTTPException(400, { 
        message: 'Assistant ID is required' 
      });
    }

    // Get assistant data for cleanup
    const { data: assistant, error: fetchError } = await business.supabase
      .from('assistants')
      .select('whatsapp_instance_id, name')
      .eq('id', assistantId)
      .single();

    if (fetchError || !assistant) {
      throw new HTTPException(404, { 
        message: 'Assistant not found' 
      });
    }

    // Delete Evolution API instance if exists
    if (assistant.whatsapp_instance_id) {
      try {
        const evolutionClient = createEvolutionClient({
          baseUrl: c.env.EVOLUTION_API_BASE_URL || 'http://localhost:8080',
          apiKey: c.env.EVOLUTION_API_KEY,
          timeout: 30000,
          retryAttempts: 3,
          retryDelay: 1000,
          rateLimitPerMinute: 60
        });

        await evolutionClient.deleteInstance(assistant.whatsapp_instance_id);
      } catch (error) {
        console.warn(`Failed to delete Evolution instance ${assistant.whatsapp_instance_id}:`, error);
        // Continue with assistant deletion even if Evolution cleanup fails
      }
    }

    // Delete assistant with tenant isolation
    const { error: deleteError } = await business.supabase
      .from('assistants')
      .delete()
      .eq('id', assistantId);

    if (deleteError) {
      console.error('Assistant deletion failed:', deleteError);
      throw new HTTPException(500, { 
        message: 'Failed to delete assistant' 
      });
    }

    logSecurityEvent('assistant_deleted', 'Assistant deleted', business.businessId, {
      assistantId,
      assistantName: assistant.name,
      evolutionInstance: assistant.whatsapp_instance_id
    });

    return c.json({
      success: true,
      message: 'Assistant deleted successfully'
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant deletion error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to delete assistant' 
    });
  }
});

/**
 * Test assistant with sample message
 * POST /api/assistants/:id/test
 * AUTHENTICATED: Requires valid business API key
 */
app.post('/:id/test', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');
    const body = await c.req.json();

    if (!assistantId) {
      throw new HTTPException(400, { 
        message: 'Assistant ID is required' 
      });
    }

    // Validate test input
    const validatedData = AssistantTestSchema.parse(body);

    // Get assistant data
    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (error || !assistant) {
      throw new HTTPException(404, { 
        message: 'Assistant not found' 
      });
    }

    // Test the assistant's AI response generation
    // This would integrate with the AI response generator
    const testResponse = {
      message: validatedData.message,
      response: `Hello! I'm ${assistant.name}. ${assistant.personality_prompt}. I received your message: "${validatedData.message}". This is a test response.`,
      confidence: 0.9,
      processingTime: 150,
      sources: ['test_knowledge'],
      escalationRequired: false
    };

    return c.json({
      success: true,
      test: {
        input: validatedData.message,
        output: testResponse,
        assistant: {
          id: assistant.id,
          name: assistant.name,
          personalityPrompt: assistant.personality_prompt
        }
      },
      message: 'Assistant test completed successfully'
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant test error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to test assistant' 
    });
  }
});

/**
 * Get assistant analytics
 * GET /api/assistants/:id/analytics
 * AUTHENTICATED: Requires valid business API key with analytics permission
 */
app.get('/:id/analytics', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');

    if (!business.permissions.canAccessAnalytics) {
      throw new HTTPException(403, { 
        message: 'Analytics access requires Pro or Enterprise subscription' 
      });
    }

    if (!assistantId) {
      throw new HTTPException(400, { 
        message: 'Assistant ID is required' 
      });
    }

    // Get assistant with metrics
    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .select('id, name, metrics, created_at')
      .eq('id', assistantId)
      .single();

    if (error || !assistant) {
      throw new HTTPException(404, { 
        message: 'Assistant not found' 
      });
    }

    // Get conversation statistics
    const { count: totalConversations } = await business.supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('assistant_id', assistantId);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count: recentConversations } = await business.supabase
      .from('conversations')
      .select('id', { count: 'exact' })
      .eq('assistant_id', assistantId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    return c.json({
      success: true,
      analytics: {
        assistant: {
          id: assistant.id,
          name: assistant.name,
          createdAt: assistant.created_at
        },
        metrics: assistant.metrics,
        conversationStats: {
          total: totalConversations || 0,
          last30Days: recentConversations || 0
        },
        generatedAt: new Date()
      }
    });

  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }

    console.error('Assistant analytics error:', error);
    throw new HTTPException(500, { 
      message: 'Failed to fetch analytics' 
    });
  }
});

export { app as AssistantAPI };