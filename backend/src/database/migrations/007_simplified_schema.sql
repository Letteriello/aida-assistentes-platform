-- AIDA Platform - Simplified Schema Migration
-- Migration: 007_simplified_schema.sql
-- Purpose: Implement simplified schema for WhatsApp-focused platform
-- Pricing: R$250 per WhatsApp instance/month

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Drop existing complex tables (if needed for fresh start)
-- Uncomment these lines if doing a complete migration
-- DROP TABLE IF EXISTS billing_cycles CASCADE;
-- DROP TABLE IF EXISTS assistant_configs CASCADE;
-- DROP TABLE IF EXISTS product_catalogs CASCADE;
-- DROP TABLE IF EXISTS auth_codes CASCADE;
-- DROP TABLE IF EXISTS whatsapp_instances CASCADE;
-- DROP TABLE IF EXISTS users_simplified CASCADE;

-- Simplified users table (phone-based authentication)
CREATE TABLE IF NOT EXISTS users_simplified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT phone_format CHECK (phone ~ '^\+55[1-9][0-9]{8,9}$')
);

-- WhatsApp instances table
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_simplified(id) ON DELETE CASCADE,
    
    -- Evolution API integration
    evolution_instance_id VARCHAR(255) UNIQUE NOT NULL,
    instance_name VARCHAR(255) NOT NULL,
    
    -- Instance status and lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'deleted', 'pending', 'error')),
    connection_state VARCHAR(20) DEFAULT 'close' CHECK (connection_state IN ('open', 'close', 'connecting', 'qr')),
    
    -- QR Code and connection data
    qr_code TEXT,
    qr_code_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Webhook configuration
    webhook_url TEXT,
    webhook_events TEXT[] DEFAULT ARRAY['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    
    -- Lifecycle timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- For 30-day post-deletion access
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT unique_user_instance_name UNIQUE (user_id, instance_name)
);

-- Create indexes for whatsapp_instances
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_evolution_id ON whatsapp_instances(evolution_instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_connection_state ON whatsapp_instances(connection_state);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_expires_at ON whatsapp_instances(expires_at) WHERE expires_at IS NOT NULL;

-- Simplified billing cycles (R$250 per instance)
CREATE TABLE IF NOT EXISTS billing_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_simplified(id) ON DELETE CASCADE,
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    
    -- Billing details
    amount DECIMAL(10,2) NOT NULL DEFAULT 250.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    
    -- Billing period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Payment status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255), -- External payment ID
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    due_date DATE GENERATED ALWAYS AS (period_end) STORED,
    
    -- Ensure no overlapping billing periods for same instance
    CONSTRAINT no_overlapping_periods EXCLUDE USING gist (
        instance_id WITH =,
        daterange(period_start, period_end, '[]') WITH &&
    )
);

-- Create indexes for billing_cycles
CREATE INDEX IF NOT EXISTS idx_billing_cycles_user_id ON billing_cycles(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_instance_id ON billing_cycles(instance_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON billing_cycles(status);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_period ON billing_cycles(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_due_date ON billing_cycles(due_date);

-- Structured assistant configurations
CREATE TABLE IF NOT EXISTS assistant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    
    -- Company information (structured)
    company_name VARCHAR(255),
    company_industry VARCHAR(100),
    company_description TEXT,
    business_hours JSONB DEFAULT '{}', -- {"monday": "09:00-18:00", "tuesday": "09:00-18:00", ...}
    contact_info JSONB DEFAULT '{}', -- {"email": "", "phone": "", "address": "", "website": ""}
    
    -- Assistant personality
    tone VARCHAR(20) DEFAULT 'friendly' CHECK (tone IN ('formal', 'casual', 'friendly', 'professional')),
    personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[], -- ["helpful", "patient", "knowledgeable"]
    greeting_message TEXT,
    fallback_message TEXT DEFAULT 'Desculpe, não entendi. Pode reformular sua pergunta?',
    
    -- Business rules and policies
    business_rules JSONB DEFAULT '{}', -- Structured business rules
    faqs JSONB DEFAULT '[]', -- [{"question": "", "answer": "", "keywords": [], "category": ""}]
    
    -- RAG system integration
    context_embeddings VECTOR(1536), -- OpenAI ada-002 embeddings
    knowledge_graph_data JSONB DEFAULT '{}', -- Knowledge graph entities and relationships
    
    -- Configuration metadata
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one config per instance
    CONSTRAINT unique_instance_config UNIQUE (instance_id)
);

-- Create indexes for assistant_configs
CREATE INDEX IF NOT EXISTS idx_assistant_configs_instance_id ON assistant_configs(instance_id);
CREATE INDEX IF NOT EXISTS idx_assistant_configs_active ON assistant_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_assistant_configs_industry ON assistant_configs(company_industry);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_assistant_configs_embeddings ON assistant_configs 
USING ivfflat (context_embeddings vector_cosine_ops) WITH (lists = 100);

-- Product catalog table
CREATE TABLE IF NOT EXISTS product_catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    
    -- Product information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    category VARCHAR(100),
    subcategory VARCHAR(100),
    sku VARCHAR(100),
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'limited', 'discontinued')),
    
    -- Media and presentation
    images JSONB DEFAULT '[]', -- ["url1", "url2", ...]
    thumbnail_url TEXT,
    
    -- Search and categorization
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    product_embedding VECTOR(1536), -- For semantic search
    
    -- WhatsApp Business integration
    whatsapp_catalog_id VARCHAR(255), -- If synced with WhatsApp Business
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique SKU per instance
    CONSTRAINT unique_instance_sku UNIQUE (instance_id, sku)
);

-- Create indexes for product_catalogs
CREATE INDEX IF NOT EXISTS idx_product_catalogs_instance_id ON product_catalogs(instance_id);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_category ON product_catalogs(category);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_active ON product_catalogs(is_active);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_featured ON product_catalogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_stock_status ON product_catalogs(stock_status);
CREATE INDEX IF NOT EXISTS idx_product_catalogs_price ON product_catalogs(price);

-- Vector similarity search index for products
CREATE INDEX IF NOT EXISTS idx_product_catalogs_embeddings ON product_catalogs 
USING ivfflat (product_embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search index for products
CREATE INDEX IF NOT EXISTS idx_product_catalogs_search ON product_catalogs 
USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

-- Authentication codes table (for WhatsApp login)
CREATE TABLE IF NOT EXISTS auth_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    
    -- Expiration and usage
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT code_format CHECK (code ~ '^[0-9]{6}$'),
    CONSTRAINT phone_format CHECK (phone ~ '^\+55[1-9][0-9]{8,9}$')
);

-- Create indexes for auth_codes
CREATE INDEX IF NOT EXISTS idx_auth_codes_phone_code ON auth_codes(phone, code);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires_at ON auth_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_phone_created ON auth_codes(phone, created_at);

-- Conversations table (simplified)
CREATE TABLE IF NOT EXISTS conversations_simplified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    
    -- WhatsApp contact info
    remote_jid VARCHAR(255) NOT NULL, -- WhatsApp JID
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Conversation state
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'blocked')),
    
    -- Context and memory
    context_summary JSONB DEFAULT '{}',
    context_embeddings VECTOR(1536),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure unique conversation per instance+contact
    CONSTRAINT unique_instance_contact UNIQUE (instance_id, remote_jid)
);

-- Create indexes for conversations_simplified
CREATE INDEX IF NOT EXISTS idx_conversations_simplified_instance_id ON conversations_simplified(instance_id);
CREATE INDEX IF NOT EXISTS idx_conversations_simplified_remote_jid ON conversations_simplified(remote_jid);
CREATE INDEX IF NOT EXISTS idx_conversations_simplified_status ON conversations_simplified(status);
CREATE INDEX IF NOT EXISTS idx_conversations_simplified_last_message ON conversations_simplified(last_message_at);

-- Vector similarity search index for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_simplified_embeddings ON conversations_simplified 
USING ivfflat (context_embeddings vector_cosine_ops) WITH (lists = 100);

-- Messages table (simplified)
CREATE TABLE IF NOT EXISTS messages_simplified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations_simplified(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    
    -- WhatsApp metadata
    whatsapp_message_id VARCHAR(255),
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, audio, document, etc.
    media_url TEXT,
    
    -- Processing metadata
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for messages_simplified
CREATE INDEX IF NOT EXISTS idx_messages_simplified_conversation_id ON messages_simplified(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_simplified_timestamp ON messages_simplified(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_simplified_role ON messages_simplified(role);
CREATE INDEX IF NOT EXISTS idx_messages_simplified_whatsapp_id ON messages_simplified(whatsapp_message_id);

-- Partition messages table by month for better performance
-- This will be implemented as needed when data grows

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_simplified ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from JWT
CREATE OR REPLACE FUNCTION get_current_user_id() 
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('app.current_user_id', true)::UUID,
        (auth.jwt() ->> 'sub')::UUID
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for users_simplified
CREATE POLICY "Users can view own profile" ON users_simplified
    FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Users can update own profile" ON users_simplified
    FOR UPDATE USING (id = get_current_user_id());

-- RLS Policies for whatsapp_instances
CREATE POLICY "Users can view own instances" ON whatsapp_instances
    FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage own instances" ON whatsapp_instances
    FOR ALL USING (user_id = get_current_user_id());

-- RLS Policies for billing_cycles
CREATE POLICY "Users can view own billing" ON billing_cycles
    FOR SELECT USING (user_id = get_current_user_id());

-- RLS Policies for assistant_configs
CREATE POLICY "Users can manage own assistant configs" ON assistant_configs
    FOR ALL USING (
        instance_id IN (
            SELECT id FROM whatsapp_instances 
            WHERE user_id = get_current_user_id()
        )
    );

-- RLS Policies for product_catalogs
CREATE POLICY "Users can manage own product catalogs" ON product_catalogs
    FOR ALL USING (
        instance_id IN (
            SELECT id FROM whatsapp_instances 
            WHERE user_id = get_current_user_id()
        )
    );

-- RLS Policies for conversations_simplified
CREATE POLICY "Users can view own conversations" ON conversations_simplified
    FOR SELECT USING (
        instance_id IN (
            SELECT id FROM whatsapp_instances 
            WHERE user_id = get_current_user_id()
        )
    );

-- RLS Policies for messages_simplified
CREATE POLICY "Users can view own messages" ON messages_simplified
    FOR SELECT USING (
        conversation_id IN (
            SELECT c.id FROM conversations_simplified c
            JOIN whatsapp_instances wi ON c.instance_id = wi.id
            WHERE wi.user_id = get_current_user_id()
        )
    );

-- Auth codes have special policies (no user context yet)
CREATE POLICY "Auth codes are publicly insertable" ON auth_codes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Auth codes are publicly readable for verification" ON auth_codes
    FOR SELECT USING (true);

-- Functions for business logic

-- Function to create billing cycle when instance is created
CREATE OR REPLACE FUNCTION create_billing_cycle_for_instance()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create billing cycle for active instances
    IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
        INSERT INTO billing_cycles (
            user_id,
            instance_id,
            amount,
            period_start,
            period_end,
            status
        ) VALUES (
            NEW.user_id,
            NEW.id,
            250.00,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month',
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create billing cycles
CREATE TRIGGER trigger_create_billing_cycle
    AFTER INSERT OR UPDATE ON whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION create_billing_cycle_for_instance();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_simplified_updated_at
    BEFORE UPDATE ON users_simplified
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_whatsapp_instances_updated_at
    BEFORE UPDATE ON whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_assistant_configs_updated_at
    BEFORE UPDATE ON assistant_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_product_catalogs_updated_at
    BEFORE UPDATE ON product_catalogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_conversations_simplified_updated_at
    BEFORE UPDATE ON conversations_simplified
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired auth codes
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check instance access (including 30-day grace period)
CREATE OR REPLACE FUNCTION check_instance_access(p_instance_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    instance_record RECORD;
BEGIN
    SELECT status, expires_at INTO instance_record
    FROM whatsapp_instances
    WHERE id = p_instance_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Active instances have access
    IF instance_record.status = 'active' THEN
        RETURN TRUE;
    END IF;
    
    -- Deleted instances have access during grace period
    IF instance_record.status = 'deleted' AND 
       instance_record.expires_at IS NOT NULL AND 
       instance_record.expires_at > NOW() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Vector search functions for RAG system

-- Search assistant contexts by similarity
CREATE OR REPLACE FUNCTION search_assistant_contexts(
    p_query_embedding VECTOR(1536),
    p_instance_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 5,
    p_threshold FLOAT DEFAULT 0.8
)
RETURNS TABLE (
    instance_id UUID,
    company_name VARCHAR(255),
    similarity FLOAT,
    context_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.instance_id,
        ac.company_name,
        1 - (ac.context_embeddings <=> p_query_embedding) AS similarity,
        jsonb_build_object(
            'company_description', ac.company_description,
            'business_hours', ac.business_hours,
            'business_rules', ac.business_rules,
            'faqs', ac.faqs
        ) AS context_data
    FROM assistant_configs ac
    WHERE 
        ac.context_embeddings IS NOT NULL
        AND ac.is_active = true
        AND (p_instance_id IS NULL OR ac.instance_id = p_instance_id)
        AND (1 - (ac.context_embeddings <=> p_query_embedding)) >= p_threshold
    ORDER BY ac.context_embeddings <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Search products by similarity
CREATE OR REPLACE FUNCTION search_products(
    p_query_embedding VECTOR(1536),
    p_instance_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(12,2),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.name,
        pc.description,
        pc.price,
        1 - (pc.product_embedding <=> p_query_embedding) AS similarity
    FROM product_catalogs pc
    WHERE 
        pc.instance_id = p_instance_id
        AND pc.is_active = true
        AND pc.product_embedding IS NOT NULL
        AND (1 - (pc.product_embedding <=> p_query_embedding)) >= p_threshold
    ORDER BY pc.product_embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create initial admin user function (for setup)
CREATE OR REPLACE FUNCTION create_admin_user(
    p_phone VARCHAR(20),
    p_name VARCHAR(255) DEFAULT 'Admin'
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    INSERT INTO users_simplified (phone, name)
    VALUES (p_phone, p_name)
    ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Performance optimization: Analyze tables
ANALYZE users_simplified;
ANALYZE whatsapp_instances;
ANALYZE billing_cycles;
ANALYZE assistant_configs;
ANALYZE product_catalogs;
ANALYZE auth_codes;
ANALYZE conversations_simplified;
ANALYZE messages_simplified;

-- Comments for documentation
COMMENT ON TABLE users_simplified IS 'Simplified user table with phone-based authentication';
COMMENT ON TABLE whatsapp_instances IS 'WhatsApp instances connected via Evolution API';
COMMENT ON TABLE billing_cycles IS 'Monthly billing cycles at R$250 per instance';
COMMENT ON TABLE assistant_configs IS 'Structured assistant configuration with RAG support';
COMMENT ON TABLE product_catalogs IS 'Product catalog with semantic search capabilities';
COMMENT ON TABLE auth_codes IS 'WhatsApp-based authentication codes';
COMMENT ON TABLE conversations_simplified IS 'WhatsApp conversations with context memory';
COMMENT ON TABLE messages_simplified IS 'Individual messages in conversations';

COMMENT ON FUNCTION check_instance_access(UUID) IS 'Checks if user has access to instance (including 30-day grace period)';
COMMENT ON FUNCTION search_assistant_contexts(VECTOR(1536), UUID, INTEGER, FLOAT) IS 'Vector similarity search for assistant contexts';
COMMENT ON FUNCTION search_products(VECTOR(1536), UUID, INTEGER, FLOAT) IS 'Vector similarity search for products';

-- Migration complete
SELECT 'Simplified schema migration completed successfully' AS status;