/**
 * AIDA Platform - Assistant Management API
 * CRITICAL: CRUD operations for AI assistants with tenant isolation
 * PATTERN: Follows MCP server tool patterns but for REST API endpoints
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { nanoid } from 'nanoid';
import { zValidator } from '@hono/zod-validator';
import {
  getBusinessContext,
  tenantIsolationMiddleware,
  validateSubscriptionLimits
} from '../auth/tenant-isolation';
import { getEvolutionAPIClient } from '../evolution-api/client';
import {
  logSecurityEvent,
  sanitizeInput,
  validateInput
} from '../database/security';
import type {
  Assistant,
  AssistantInsert,
  AssistantUpdate,
  Env
} from '@shared/types';
import {
  assistantInsertSchema,
  assistantSchema,
  assistantUpdateSchema,
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
app.post('/', validateSubscriptionLimits('assistants'), zValidator('json', assistantInsertSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const validatedData = c.req.valid('json');

    // Sanitize input data
    const sanitizedData = {
      name: sanitizeInput(validatedData.name),
      description: sanitizeInput(validatedData.description ?? ''),
      personality_prompt: sanitizeInput(validatedData.personality_prompt)
    };

    // Additional validation
    validateInput(sanitizedData.name, 'assistant_name');
    validateInput(sanitizedData.personality_prompt, 'personality_prompt');

    // Generate unique assistant ID
    const assistantId = `assistant_${nanoid(24)}`;
    const instanceName = `aida_${business.businessId.replace('business_', '')}_${nanoid(8)}`;

    // Create assistant record
    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .insert({
        id: assistantId,
        business_id: business.businessId,
        name: sanitizedData.name,
        description: sanitizedData.description,
        personality_prompt: sanitizedData.personality_prompt,
        instance_name: instanceName,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      await logSecurityEvent(
        business.supabase,
        business.businessId,
        'assistant_creation_error',
        `Assistant creation failed: ${error.message}`
      );
      throw new HTTPException(500, { message: 'Failed to create assistant' });
    }

    // Log successful creation
    await logSecurityEvent(
      business.supabase,
      business.businessId,
      'assistant_created',
      `New assistant created: ${assistantId}`
    );

    return c.json({
      success: true,
      assistant: assistant
    }, 201);

  } catch (error) {
    console.error('Error creating assistant:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    await logSecurityEvent(
      getBusinessContext(c).supabase,
      getBusinessContext(c).businessId,
      'assistant_creation_error',
      `Assistant creation failed: ${error instanceof Error ? error.message : String(error)}`
    );

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * List assistants with pagination and search
 * GET /api/assistants
 */
app.get('/', zValidator('query', PaginationSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const { page = 1, limit = 10, search } = c.req.valid('query');

    const offset = (page - 1) * limit;

    let query = business.supabase
      .from('assistants')
      .select('*', { count: 'exact' })
      .eq('business_id', business.businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    const { data: assistants, error, count } = await query;

    if (error) {
      throw new HTTPException(500, { message: 'Failed to fetch assistants' });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return c.json({
      assistants: assistants || [],
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
    console.error('Error fetching assistants:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Get assistant by ID
 * GET /api/assistants/:id
 */
app.get('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');

    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .eq('business_id', business.businessId)
      .single();

    if (error || !assistant) {
      throw new HTTPException(404, { message: 'Assistant not found' });
    }

    return c.json({ assistant });

  } catch (error) {
    console.error('Error fetching assistant:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Update assistant
 * PUT /api/assistants/:id
 */
app.put('/:id', zValidator('json', assistantUpdateSchema), async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');
    const validatedData = c.req.valid('json');

    // Sanitize input data
    const sanitizedData: Partial<AssistantUpdate> = {};

    if (validatedData.name) {
      sanitizedData.name = sanitizeInput(validatedData.name);
      validateInput(sanitizedData.name, 'assistant_name');
    }

    if (validatedData.description !== undefined) {
      sanitizedData.description = sanitizeInput(validatedData.description || '');
    }

    if (validatedData.personality_prompt) {
      sanitizedData.personality_prompt = sanitizeInput(validatedData.personality_prompt);
      validateInput(sanitizedData.personality_prompt, 'personality_prompt');
    }

    if (validatedData.status) {
      sanitizedData.status = validatedData.status;
    }

    // Update assistant
    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', assistantId)
      .eq('business_id', business.businessId)
      .select()
      .single();

    if (error || !assistant) {
      throw new HTTPException(404, { message: 'Assistant not found or update failed' });
    }

    // Log successful update
    await logSecurityEvent(
      business.supabase,
      business.businessId,
      'assistant_updated',
      `Assistant updated: ${assistantId}`
    );

    return c.json({
      success: true,
      assistant: assistant
    });

  } catch (error) {
    console.error('Error updating assistant:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Delete assistant
 * DELETE /api/assistants/:id
 */
app.delete('/:id', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');

    // First check if assistant exists
    const { data: assistant, error: fetchError } = await business.supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .eq('business_id', business.businessId)
      .single();

    if (fetchError || !assistant) {
      throw new HTTPException(404, { message: 'Assistant not found' });
    }

    // Delete assistant
    const { error: deleteError } = await business.supabase
      .from('assistants')
      .delete()
      .eq('id', assistantId)
      .eq('business_id', business.businessId);

    if (deleteError) {
      throw new HTTPException(500, { message: 'Failed to delete assistant' });
    }

    // Log successful deletion
    await logSecurityEvent(
      business.supabase,
      business.businessId,
      'assistant_deleted',
      `Assistant deleted: ${assistantId}`
    );

    return c.json({
      success: true,
      message: 'Assistant deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting assistant:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

/**
 * Test assistant response
 * POST /api/assistants/:id/test
 */
app.post('/:id/test', async (c) => {
  try {
    const business = getBusinessContext(c);
    const assistantId = c.req.param('id');
    const body = await c.req.json();

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      throw new HTTPException(400, { message: 'Message is required' });
    }

    // Get assistant
    const { data: assistant, error } = await business.supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .eq('business_id', business.businessId)
      .single();

    if (error || !assistant) {
      throw new HTTPException(404, { message: 'Assistant not found' });
    }

    // Generate test response
    const testResponse = {
      response: `Hello! I'm ${assistant.name}. ${assistant.personality_prompt}. I received your message: "${body.message}". This is a test response.`,
      timestamp: new Date().toISOString(),
      assistant_id: assistantId,
      test_mode: true
    };

    return c.json(testResponse);

  } catch (error) {
    console.error('Error testing assistant:', error);

    if (error instanceof HTTPException) {
      throw error;
    }

    throw new HTTPException(500, { message: 'Internal server error' });
  }
});

export default app;
