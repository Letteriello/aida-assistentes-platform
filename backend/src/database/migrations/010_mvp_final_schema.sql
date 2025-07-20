-- Migração Final MVP - Schema Otimizado para AIDA Platform
-- Estrutura simplificada para máxima performance e menor custo

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- Limpar schema anterior se existir
DROP TABLE IF EXISTS messages_simplified CASCADE;
DROP TABLE IF EXISTS conversations_simplified CASCADE;
DROP TABLE IF EXISTS product_catalogs CASCADE;
DROP TABLE IF EXISTS assistant_configs CASCADE;
DROP TABLE IF EXISTS billing_cycles CASCADE;
DROP TABLE IF EXISTS auth_codes CASCADE;
DROP TABLE IF EXISTS whatsapp_instances CASCADE;
DROP TABLE IF EXISTS users_simplified CASCADE;

-- 1. Usuários Simplificados (Autenticação por WhatsApp)
CREATE TABLE users_simplified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL, -- Formato: +5511999999999
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Códigos de Autenticação WhatsApp
CREATE TABLE auth_codes (
    phone VARCHAR(20) PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Instâncias WhatsApp (Evolution API)
CREATE TABLE whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_simplified(id) ON DELETE CASCADE,
    evolution_instance_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'creating', -- creating, qrcode, connected, disconnected, deleted
    qr_code_url TEXT,
    webhook_url TEXT,
    evolution_api_url TEXT NOT NULL,
    evolution_api_key TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    document_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete com grace period de 30 dias
);

-- 4. Ciclos de Cobrança (R$250/mês por instância)
CREATE TABLE billing_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 250.00,
    currency VARCHAR(3) DEFAULT 'BRL',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    payment_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Configurações do Assistente (Cérebro Estruturado)
CREATE TABLE assistant_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    
    -- Dados da Empresa (Estruturado)
    company_name VARCHAR(255),
    company_description TEXT,
    company_industry VARCHAR(100),
    company_website VARCHAR(255),
    company_phone VARCHAR(20),
    company_email VARCHAR(255),
    company_address TEXT,
    working_hours JSONB,
    social_media JSONB,
    
    -- Personalidade do Assistente
    personality_tone VARCHAR(50) DEFAULT 'friendly', -- friendly, professional, casual, formal
    personality_style VARCHAR(50) DEFAULT 'helpful', -- helpful, concise, detailed, creative
    personality_language VARCHAR(10) DEFAULT 'pt-BR',
    use_emojis BOOLEAN DEFAULT true,
    greeting_message TEXT,
    fallback_message TEXT,
    max_response_length INTEGER DEFAULT 500,
    
    -- Regras de Negócio (Estruturado)
    business_rules JSONB DEFAULT '[]'::jsonb,
    
    -- FAQs (Estruturado)
    faqs JSONB DEFAULT '[]'::jsonb,
    
    -- Embeddings para RAG
    context_embedding vector(1536), -- OpenAI ada-002 embeddings
    knowledge_graph JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Catálogo de Produtos
CREATE TABLE product_catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    
    -- Dados do Produto
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    category VARCHAR(100),
    sku VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    tags TEXT[],
    specifications JSONB DEFAULT '{}'::jsonb,
    images TEXT[], -- URLs das imagens
    
    -- Embeddings para busca semântica
    product_embedding vector(1536),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Conversas Simplificadas
CREATE TABLE conversations_simplified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, closed, archived
    context_summary TEXT,
    context_embedding vector(1536),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Mensagens Simplificadas
CREATE TABLE messages_simplified (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations_simplified(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    message_type VARCHAR(50) DEFAULT 'text', -- text, image, document, audio
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Performance
CREATE INDEX idx_users_phone ON users_simplified(phone);
CREATE INDEX idx_auth_codes_expires ON auth_codes(expires_at);
CREATE INDEX idx_instances_user ON whatsapp_instances(user_id);
CREATE INDEX idx_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_instances_deleted ON whatsapp_instances(deleted_at);
CREATE INDEX idx_billing_instance ON billing_cycles(instance_id);
CREATE INDEX idx_billing_status ON billing_cycles(status);
CREATE INDEX idx_billing_period ON billing_cycles(period_start, period_end);
CREATE INDEX idx_assistant_instance ON assistant_configs(instance_id);
CREATE INDEX idx_products_instance ON product_catalogs(instance_id);
CREATE INDEX idx_products_category ON product_catalogs(category);
CREATE INDEX idx_products_active ON product_catalogs(is_active);
CREATE INDEX idx_conversations_instance ON conversations_simplified(instance_id);
CREATE INDEX idx_conversations_phone ON conversations_simplified(customer_phone);
CREATE INDEX idx_conversations_status ON conversations_simplified(status);
CREATE INDEX idx_messages_conversation ON messages_simplified(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages_simplified(timestamp);

-- Índices para Vector Search
CREATE INDEX idx_assistant_embedding ON assistant_configs USING ivfflat (context_embedding vector_cosine_ops);
CREATE INDEX idx_product_embedding ON product_catalogs USING ivfflat (product_embedding vector_cosine_ops);
CREATE INDEX idx_conversation_embedding ON conversations_simplified USING ivfflat (context_embedding vector_cosine_ops);

-- Row Level Security (RLS)
ALTER TABLE users_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations_simplified ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_simplified ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own data" ON users_simplified FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "Auth codes by phone" ON auth_codes FOR ALL USING (true); -- Controlado pela aplicação
CREATE POLICY "Users can manage own instances" ON whatsapp_instances FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view own billing" ON billing_cycles FOR ALL USING (instance_id IN (SELECT id FROM whatsapp_instances WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own assistant configs" ON assistant_configs FOR ALL USING (instance_id IN (SELECT id FROM whatsapp_instances WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own products" ON product_catalogs FOR ALL USING (instance_id IN (SELECT id FROM whatsapp_instances WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own conversations" ON conversations_simplified FOR ALL USING (instance_id IN (SELECT id FROM whatsapp_instances WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own messages" ON messages_simplified FOR ALL USING (conversation_id IN (SELECT id FROM conversations_simplified WHERE instance_id IN (SELECT id FROM whatsapp_instances WHERE user_id = auth.uid())));

-- Funções de Negócio

-- 1. Função para criar ciclo de cobrança automaticamente
CREATE OR REPLACE FUNCTION create_billing_cycle_for_instance()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar ciclo de cobrança quando instância for ativada
    IF NEW.status = 'connected' AND (OLD.status IS NULL OR OLD.status != 'connected') THEN
        INSERT INTO billing_cycles (instance_id, period_start, period_end)
        VALUES (
            NEW.id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_billing_cycle
    AFTER UPDATE ON whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION create_billing_cycle_for_instance();

-- 2. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas relevantes
CREATE TRIGGER trigger_update_users_updated_at BEFORE UPDATE ON users_simplified FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_instances_updated_at BEFORE UPDATE ON whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_billing_updated_at BEFORE UPDATE ON billing_cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_assistant_updated_at BEFORE UPDATE ON assistant_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_products_updated_at BEFORE UPDATE ON product_catalogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_update_conversations_updated_at BEFORE UPDATE ON conversations_simplified FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Função para limpar códigos de autenticação expirados
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM auth_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Função para verificar acesso à instância (incluindo grace period)
CREATE OR REPLACE FUNCTION check_instance_access(instance_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    instance_record RECORD;
BEGIN
    SELECT * INTO instance_record 
    FROM whatsapp_instances 
    WHERE id = instance_uuid AND user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Se não foi deletada, acesso liberado
    IF instance_record.deleted_at IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Se foi deletada, verificar grace period de 30 dias
    IF instance_record.deleted_at + INTERVAL '30 days' > NOW() THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 5. Funções para busca vetorial (RAG)
CREATE OR REPLACE FUNCTION search_assistant_contexts(
    query_embedding vector(1536),
    instance_uuid UUID,
    match_threshold float DEFAULT 0.8,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        COALESCE(ac.company_description, '') || ' ' || 
        COALESCE(ac.business_rules::text, '') || ' ' || 
        COALESCE(ac.faqs::text, '') as content,
        1 - (ac.context_embedding <=> query_embedding) as similarity
    FROM assistant_configs ac
    WHERE ac.instance_id = instance_uuid
      AND ac.context_embedding IS NOT NULL
      AND 1 - (ac.context_embedding <=> query_embedding) > match_threshold
    ORDER BY ac.context_embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_products(
    query_embedding vector(1536),
    instance_uuid UUID,
    match_threshold float DEFAULT 0.8,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(100),
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.name,
        pc.description,
        pc.price,
        pc.category,
        1 - (pc.product_embedding <=> query_embedding) as similarity
    FROM product_catalogs pc
    WHERE pc.instance_id = instance_uuid
      AND pc.is_active = true
      AND pc.product_embedding IS NOT NULL
      AND 1 - (pc.product_embedding <=> query_embedding) > match_threshold
    ORDER BY pc.product_embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Função para criar usuário admin inicial
CREATE OR REPLACE FUNCTION create_admin_user(
    admin_phone VARCHAR(20),
    admin_name VARCHAR(255) DEFAULT 'Admin'
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    INSERT INTO users_simplified (phone, name)
    VALUES (admin_phone, admin_name)
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE users_simplified IS 'Usuários autenticados via WhatsApp';
COMMENT ON TABLE auth_codes IS 'Códigos de 6 dígitos para autenticação WhatsApp';
COMMENT ON TABLE whatsapp_instances IS 'Instâncias do Evolution API (R$250/mês cada)';
COMMENT ON TABLE billing_cycles IS 'Ciclos de cobrança mensais por instância';
COMMENT ON TABLE assistant_configs IS 'Configurações estruturadas do cérebro do assistente';
COMMENT ON TABLE product_catalogs IS 'Catálogo de produtos com busca semântica';
COMMENT ON TABLE conversations_simplified IS 'Conversas do WhatsApp com contexto';
COMMENT ON TABLE messages_simplified IS 'Mensagens individuais das conversas';

-- Inserir dados iniciais se necessário
-- Exemplo: SELECT create_admin_user('+5511999999999', 'Admin AIDA');