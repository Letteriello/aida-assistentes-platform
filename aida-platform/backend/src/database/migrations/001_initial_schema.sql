
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create businesses table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_plan TEXT DEFAULT 'free'
);

-- Create assistants table
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  whatsapp_instance_id TEXT,
  knowledge_graph_id TEXT,
  personality_prompt TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  customer_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  context_summary TEXT,
  embeddings vector(1536) -- OpenAI embeddings dimension
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT,
  sender_type TEXT NOT NULL, -- 'customer' or 'assistant'
  message_type TEXT NOT NULL, -- 'text', 'media', 'location'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  embeddings vector(1536)
);

-- Create knowledge_nodes table
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- e.g., 'product', 'service', 'policy'
  entity_name TEXT NOT NULL,
  properties JSONB,
  embeddings vector(1536)
);

-- Indexes for performance
CREATE INDEX ON assistants (business_id);
CREATE INDEX ON conversations (assistant_id);
CREATE INDEX ON messages (conversation_id);
CREATE INDEX ON knowledge_nodes (business_id);

-- RLS policies for multi-tenancy
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_isolation ON businesses
  FOR ALL
  USING (id = (current_setting('app.current_business_id', TRUE)::UUID));

CREATE POLICY assistant_isolation ON assistants
  FOR ALL
  USING (business_id = (current_setting('app.current_business_id', TRUE)::UUID));

CREATE POLICY conversation_isolation ON conversations
  FOR ALL
  USING (assistant_id IN (SELECT id FROM assistants WHERE business_id = (current_setting('app.current_business_id', TRUE)::UUID)));

CREATE POLICY message_isolation ON messages
  FOR ALL
  USING (conversation_id IN (SELECT id FROM conversations WHERE assistant_id IN (SELECT id FROM assistants WHERE business_id = (current_setting('app.current_business_id', TRUE)::UUID))));

CREATE POLICY knowledge_node_isolation ON knowledge_nodes
  FOR ALL
  USING (business_id = (current_setting('app.current_business_id', TRUE)::UUID));
