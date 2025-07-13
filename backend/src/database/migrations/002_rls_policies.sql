-- AIDA Platform - Row Level Security (RLS) Policies
-- CRITICAL: Multi-tenant data isolation - prevents cross-tenant data access
-- All tables with business_id must have RLS policies

-- Helper function to get current business ID from JWT or context
-- This function should be called by the application layer to set the context
CREATE OR REPLACE FUNCTION get_current_business_id() 
RETURNS UUID AS $$
BEGIN
    -- In a real implementation, this would extract business_id from JWT claims
    -- For now, we use a session variable that must be set by the application
    RETURN COALESCE(
        current_setting('app.current_business_id', true)::UUID,
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific role within their business
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_business_id UUID;
    user_role_value user_role;
BEGIN
    -- Get current user's business_id and role from auth context
    SELECT business_id, role INTO user_business_id, user_role_value
    FROM users 
    WHERE email = current_setting('app.current_user_email', true);
    
    -- Check if business matches and role is sufficient
    RETURN user_business_id = get_current_business_id() AND user_role_value = required_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_permissions JSONB;
BEGIN
    SELECT permissions INTO user_permissions
    FROM users 
    WHERE email = current_setting('app.current_user_email', true)
      AND business_id = get_current_business_id();
    
    RETURN COALESCE((user_permissions ->> permission_name)::boolean, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables that need tenant isolation
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relations ENABLE ROW LEVEL SECURITY;

-- Businesses table policies
-- Users can only access their own business
CREATE POLICY business_isolation ON businesses
    FOR ALL 
    USING (id = get_current_business_id());

-- Users table policies  
-- Users can only access other users in their business
CREATE POLICY users_business_isolation ON users
    FOR ALL
    USING (business_id = get_current_business_id());

-- Additional policy for user management - only admins can modify users
CREATE POLICY users_admin_modify ON users
    FOR UPDATE
    USING (
        business_id = get_current_business_id() AND
        (user_has_role('owner') OR user_has_role('admin') OR user_has_permission('can_manage_users'))
    );

-- Evolution instances policies
-- Only users in the business can access WhatsApp instances
CREATE POLICY evolution_instances_business_isolation ON evolution_instances
    FOR ALL
    USING (business_id = get_current_business_id());

-- Assistants table policies
-- Users can only access assistants belonging to their business
CREATE POLICY assistants_business_isolation ON assistants
    FOR ALL
    USING (business_id = get_current_business_id());

-- Additional policy for assistant creation - requires permission
CREATE POLICY assistants_create_permission ON assistants
    FOR INSERT
    WITH CHECK (
        business_id = get_current_business_id() AND
        user_has_permission('can_create_assistants')
    );

-- Conversations table policies
-- Users can only access conversations for assistants in their business
CREATE POLICY conversations_business_isolation ON conversations
    FOR ALL
    USING (
        assistant_id IN (
            SELECT id FROM assistants WHERE business_id = get_current_business_id()
        )
    );

-- Messages table policies  
-- Users can only access messages in conversations they have access to
CREATE POLICY messages_conversation_access ON messages
    FOR ALL
    USING (
        conversation_id IN (
            SELECT c.id 
            FROM conversations c
            JOIN assistants a ON c.assistant_id = a.id
            WHERE a.business_id = get_current_business_id()
        )
    );

-- Knowledge nodes policies
-- Users can only access knowledge belonging to their business
CREATE POLICY knowledge_nodes_business_isolation ON knowledge_nodes
    FOR ALL
    USING (business_id = get_current_business_id());

-- Additional policy for knowledge management - requires permission
CREATE POLICY knowledge_nodes_manage_permission ON knowledge_nodes
    FOR INSERT
    WITH CHECK (
        business_id = get_current_business_id() AND
        user_has_permission('can_manage_knowledge')
    );

CREATE POLICY knowledge_nodes_update_permission ON knowledge_nodes
    FOR UPDATE
    USING (
        business_id = get_current_business_id() AND
        user_has_permission('can_manage_knowledge')
    );

-- Knowledge relations policies
-- Users can only access relations between knowledge nodes they own
CREATE POLICY knowledge_relations_business_isolation ON knowledge_relations
    FOR ALL
    USING (
        from_node_id IN (
            SELECT id FROM knowledge_nodes WHERE business_id = get_current_business_id()
        ) AND
        to_node_id IN (
            SELECT id FROM knowledge_nodes WHERE business_id = get_current_business_id()
        )
    );

-- Service role bypasses (for application-level operations)
-- These policies allow the service role to perform necessary operations

CREATE POLICY service_role_bypass_businesses ON businesses
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_users ON users
    FOR ALL  
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_evolution_instances ON evolution_instances
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_assistants ON assistants
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_conversations ON conversations
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_messages ON messages
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_knowledge_nodes ON knowledge_nodes
    FOR ALL
    TO service_role
    USING (true);

CREATE POLICY service_role_bypass_knowledge_relations ON knowledge_relations
    FOR ALL
    TO service_role
    USING (true);

-- Audit trigger for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    business_id UUID,
    user_email TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}'::jsonb
);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_log (table_name, operation, business_id, user_email, details)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.business_id, OLD.business_id),
        current_setting('app.current_user_email', true),
        jsonb_build_object(
            'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_businesses AFTER INSERT OR UPDATE OR DELETE ON businesses
    FOR EACH ROW EXECUTE FUNCTION log_security_event();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_security_event();

CREATE TRIGGER audit_assistants AFTER INSERT OR UPDATE OR DELETE ON assistants
    FOR EACH ROW EXECUTE FUNCTION log_security_event();

-- Function to validate business context is set
CREATE OR REPLACE FUNCTION ensure_business_context()
RETURNS TRIGGER AS $$
BEGIN
    IF get_current_business_id() IS NULL THEN
        RAISE EXCEPTION 'Business context not set. All operations must include business_id context.';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add business context validation to critical tables
CREATE TRIGGER ensure_business_context_users BEFORE INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION ensure_business_context();

CREATE TRIGGER ensure_business_context_assistants BEFORE INSERT OR UPDATE OR DELETE ON assistants
    FOR EACH ROW EXECUTE FUNCTION ensure_business_context();

-- Create indexes on audit log for performance
CREATE INDEX idx_security_audit_table ON security_audit_log(table_name);
CREATE INDEX idx_security_audit_business ON security_audit_log(business_id);
CREATE INDEX idx_security_audit_timestamp ON security_audit_log(timestamp DESC);

-- Grant necessary permissions to application roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_current_business_id() IS 'Returns the current business_id from application context for RLS policies';
COMMENT ON FUNCTION user_has_role(user_role) IS 'Checks if current user has specified role within their business';
COMMENT ON FUNCTION user_has_permission(TEXT) IS 'Checks if current user has specified permission';
COMMENT ON TABLE security_audit_log IS 'Audit log for all security-sensitive database operations';

-- Refresh the RLS policies
REFRESH MATERIALIZED VIEW IF EXISTS pg_policies;