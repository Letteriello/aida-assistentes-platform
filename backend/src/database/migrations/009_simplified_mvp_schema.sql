-- ============================================================================
-- AIDA PLATFORM - SIMPLIFIED MVP SCHEMA
-- ============================================================================
-- Simplified database schema for MVP focused on:
-- - R$250/month per WhatsApp instance
-- - 1,000 messages + 10 documents limit per instance
-- - Simple 3-page interface
-- - WhatsApp authentication (6-digit codes)
-- - Evolution API integration
-- - Hybrid RAG system (Graph + Vector search)
-- ============================================================================

-- Drop complex tables not needed for MVP
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS usage_events CASCADE;
DROP TABLE IF EXISTS billing_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS user_tenants CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS auth_audit_logs CASCADE;

-- ============================================================================
-- SIMPLIFIED USER AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  verification_code VARCHAR(6),
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- WHATSAPP INSTANCES (CORE PRODUCT)
-- ============================================================================

CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'creating' 
    CHECK (status IN ('creating', 'connecting', 'connected', 'disconnected', 'error')),
  
  -- Evolution API data
  qr_code TEXT,
  qr_code_base64 TEXT,
  phone_number VARCHAR(20),
  
  -- Assistant configuration
  assistant_name VARCHAR(255) NOT NULL DEFAULT 'Assistente AI',
  assistant_description TEXT,
  
  -- Simplified billing
  subscription_status VARCHAR(20) DEFAULT 'active' 
    CHECK (subscription_status IN ('active', 'cancelled', 'suspended')),
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Usage limits (fixed for MVP)
  message_limit INTEGER DEFAULT 1000,
  document_limit INTEGER DEFAULT 10,
  messages_used INTEGER DEFAULT 0,
  documents_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_connection_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- ============================================================================
-- BUSINESS CONTEXT (SIMPLIFIED)
-- ============================================================================

CREATE TABLE business_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  
  -- Business information (structured prompting)
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  business_description TEXT,
  target_audience TEXT,
  business_hours JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  
  -- Products/services
  products_services TEXT,
  pricing_info TEXT,
  policies TEXT,
  
  -- Assistant personality
  tone_of_voice VARCHAR(100) DEFAULT 'professional',
  communication_style TEXT,
  custom_instructions TEXT,
  
  -- Created/updated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instance_id)
);

-- ============================================================================
-- DOCUMENT KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  content TEXT,
  
  -- Vector embeddings for RAG
  embeddings vector(1536),
  
  -- Metadata
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT
);

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  
  -- Conversation state
  status VARCHAR(20) DEFAULT 'active' 
    CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Context for AI
  context_summary TEXT,
  context_embeddings vector(1536),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instance_id, customer_phone)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' 
    CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location')),
  sender_type VARCHAR(20) NOT NULL 
    CHECK (sender_type IN ('customer', 'assistant')),
  
  -- AI processing
  embeddings vector(1536),
  ai_processed BOOLEAN DEFAULT FALSE,
  
  -- WhatsApp metadata
  whatsapp_message_id VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- KNOWLEDGE GRAPH (SIMPLIFIED)
-- ============================================================================

CREATE TABLE knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  
  -- Entity data
  entity_type VARCHAR(50) NOT NULL, -- 'product', 'service', 'policy', 'person', 'location'
  entity_name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}',
  
  -- Vector representation
  embeddings vector(1536),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  source_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  
  relationship_type VARCHAR(50) NOT NULL, -- 'related_to', 'part_of', 'offers', 'located_at'
  properties JSONB DEFAULT '{}',
  confidence FLOAT DEFAULT 1.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ADMIN AUTHENTICATION INSTANCE
-- ============================================================================

CREATE TABLE admin_auth_instance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name VARCHAR(255) NOT NULL DEFAULT 'admin-auth-instance',
  evolution_api_url VARCHAR(500) NOT NULL,
  evolution_api_key VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instance_name)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_verification_code ON users(verification_code) WHERE verification_code IS NOT NULL;

-- WhatsApp instances
CREATE INDEX idx_whatsapp_instances_user_id ON whatsapp_instances(user_id);
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_whatsapp_instances_next_billing_date ON whatsapp_instances(next_billing_date);

-- Business context
CREATE INDEX idx_business_context_instance_id ON business_context(instance_id);

-- Documents
CREATE INDEX idx_documents_instance_id ON documents(instance_id);
CREATE INDEX idx_documents_processing_status ON documents(processing_status);

-- Conversations & Messages
CREATE INDEX idx_conversations_instance_id ON conversations(instance_id);
CREATE INDEX idx_conversations_customer_phone ON conversations(customer_phone);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_instance_id ON messages(instance_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Knowledge Graph
CREATE INDEX idx_knowledge_entities_instance_id ON knowledge_entities(instance_id);
CREATE INDEX idx_knowledge_entities_type ON knowledge_entities(entity_type);
CREATE INDEX idx_knowledge_relationships_instance_id ON knowledge_relationships(instance_id);
CREATE INDEX idx_knowledge_relationships_source ON knowledge_relationships(source_entity_id);
CREATE INDEX idx_knowledge_relationships_target ON knowledge_relationships(target_entity_id);

-- Vector similarity search indexes (using HNSW for performance)
CREATE INDEX idx_documents_embeddings ON documents USING hnsw (embeddings vector_cosine_ops);
CREATE INDEX idx_messages_embeddings ON messages USING hnsw (embeddings vector_cosine_ops);
CREATE INDEX idx_conversations_embeddings ON conversations USING hnsw (context_embeddings vector_cosine_ops);
CREATE INDEX idx_knowledge_entities_embeddings ON knowledge_entities USING hnsw (embeddings vector_cosine_ops);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;

-- User policies (users can only access their own data)
CREATE POLICY users_own_data ON users
  FOR ALL USING (id = (current_setting('app.current_user_id', TRUE)::UUID));

-- Instance policies (users can only access their own instances)
CREATE POLICY instances_own_data ON whatsapp_instances
  FOR ALL USING (user_id = (current_setting('app.current_user_id', TRUE)::UUID));

-- All other tables follow instance ownership
CREATE POLICY business_context_own_data ON business_context
  FOR ALL USING (instance_id IN (
    SELECT id FROM whatsapp_instances 
    WHERE user_id = (current_setting('app.current_user_id', TRUE)::UUID)
  ));

CREATE POLICY documents_own_data ON documents
  FOR ALL USING (instance_id IN (
    SELECT id FROM whatsapp_instances 
    WHERE user_id = (current_setting('app.current_user_id', TRUE)::UUID)
  ));

CREATE POLICY conversations_own_data ON conversations
  FOR ALL USING (instance_id IN (
    SELECT id FROM whatsapp_instances 
    WHERE user_id = (current_setting('app.current_user_id', TRUE)::UUID)
  ));

CREATE POLICY messages_own_data ON messages
  FOR ALL USING (instance_id IN (
    SELECT id FROM whatsapp_instances 
    WHERE user_id = (current_setting('app.current_user_id', TRUE)::UUID)
  ));

CREATE POLICY knowledge_entities_own_data ON knowledge_entities
  FOR ALL USING (instance_id IN (
    SELECT id FROM whatsapp_instances 
    WHERE user_id = (current_setting('app.current_user_id', TRUE)::UUID)
  ));

CREATE POLICY knowledge_relationships_own_data ON knowledge_relationships
  FOR ALL USING (instance_id IN (
    SELECT id FROM whatsapp_instances 
    WHERE user_id = (current_setting('app.current_user_id', TRUE)::UUID)
  ));

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_context_updated_at BEFORE UPDATE ON business_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limits(p_instance_id UUID, p_usage_type VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  instance_record whatsapp_instances;
BEGIN
  SELECT * INTO instance_record FROM whatsapp_instances WHERE id = p_instance_id;
  
  IF p_usage_type = 'message' THEN
    RETURN instance_record.messages_used < instance_record.message_limit;
  ELSIF p_usage_type = 'document' THEN
    RETURN instance_record.documents_used < instance_record.document_limit;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_usage(p_instance_id UUID, p_usage_type VARCHAR, p_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_usage_type = 'message' THEN
    UPDATE whatsapp_instances 
    SET messages_used = messages_used + p_amount 
    WHERE id = p_instance_id;
  ELSIF p_usage_type = 'document' THEN
    UPDATE whatsapp_instances 
    SET documents_used = documents_used + p_amount 
    WHERE id = p_instance_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage counters (for new billing period)
CREATE OR REPLACE FUNCTION reset_usage_counters(p_instance_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE whatsapp_instances 
  SET 
    messages_used = 0,
    documents_used = 0,
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '30 days',
    next_billing_date = NOW() + INTERVAL '30 days'
  WHERE id = p_instance_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS FOR MVP
-- ============================================================================

-- Function to create a complete instance setup
CREATE OR REPLACE FUNCTION create_instance_setup(
  p_user_id UUID,
  p_instance_name VARCHAR,
  p_assistant_name VARCHAR DEFAULT 'Assistente AI'
)
RETURNS UUID AS $$
DECLARE
  instance_id UUID;
BEGIN
  -- Create WhatsApp instance
  INSERT INTO whatsapp_instances (user_id, instance_name, assistant_name)
  VALUES (p_user_id, p_instance_name, p_assistant_name)
  RETURNING id INTO instance_id;
  
  -- Create business context
  INSERT INTO business_context (instance_id)
  VALUES (instance_id);
  
  RETURN instance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Simplified user authentication via WhatsApp phone numbers';
COMMENT ON TABLE whatsapp_instances IS 'Core product: R$250/month WhatsApp instances with fixed limits';
COMMENT ON TABLE business_context IS 'Structured business information for context engineering';
COMMENT ON TABLE documents IS 'Document knowledge base (max 10 per instance)';
COMMENT ON TABLE conversations IS 'Customer conversations per instance';
COMMENT ON TABLE messages IS 'Individual messages (max 1000 per month per instance)';
COMMENT ON TABLE knowledge_entities IS 'Graph entities for hybrid RAG system';
COMMENT ON TABLE knowledge_relationships IS 'Graph relationships for hybrid RAG system';
COMMENT ON TABLE admin_auth_instance IS 'Admin WhatsApp instance for sending authentication codes';