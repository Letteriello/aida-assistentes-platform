-- =============================================================================
-- WHATSAPP INSTANCES TABLE
-- =============================================================================
-- This table stores WhatsApp instance data for each assistant
-- Each assistant can have one WhatsApp instance connected

CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  instance_name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'connecting', 'connected', 'disconnected', 'error')),
  qr_code TEXT,
  qr_code_base64 TEXT,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_connection_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Constraints
  CONSTRAINT whatsapp_instances_assistant_unique UNIQUE (assistant_id),
  CONSTRAINT whatsapp_instances_instance_name_unique UNIQUE (instance_name)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for querying by assistant_id (most common query)
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_assistant_id 
  ON whatsapp_instances(assistant_id);

-- Index for querying by instance_name (for webhook handling)
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_name 
  ON whatsapp_instances(instance_name);

-- Index for querying by status (for monitoring and admin queries)
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status 
  ON whatsapp_instances(status);

-- Index for querying recent instances
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_created_at 
  ON whatsapp_instances(created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on whatsapp_instances table
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see instances for assistants in their business
CREATE POLICY "Users can view their business whatsapp instances" ON whatsapp_instances
  FOR SELECT
  USING (
    assistant_id IN (
      SELECT a.id 
      FROM assistants a 
      WHERE a.business_id IN (
        SELECT business_id 
        FROM business_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can create instances for assistants in their business
CREATE POLICY "Users can create whatsapp instances for their assistants" ON whatsapp_instances
  FOR INSERT
  WITH CHECK (
    assistant_id IN (
      SELECT a.id 
      FROM assistants a 
      WHERE a.business_id IN (
        SELECT business_id 
        FROM business_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can update instances for assistants in their business
CREATE POLICY "Users can update their business whatsapp instances" ON whatsapp_instances
  FOR UPDATE
  USING (
    assistant_id IN (
      SELECT a.id 
      FROM assistants a 
      WHERE a.business_id IN (
        SELECT business_id 
        FROM business_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can delete instances for assistants in their business
CREATE POLICY "Users can delete their business whatsapp instances" ON whatsapp_instances
  FOR DELETE
  USING (
    assistant_id IN (
      SELECT a.id 
      FROM assistants a 
      WHERE a.business_id IN (
        SELECT business_id 
        FROM business_users 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_instances_updated_at();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get active WhatsApp instance for an assistant
CREATE OR REPLACE FUNCTION get_active_whatsapp_instance(p_assistant_id UUID)
RETURNS whatsapp_instances AS $$
DECLARE
  result whatsapp_instances;
BEGIN
  SELECT * INTO result
  FROM whatsapp_instances
  WHERE assistant_id = p_assistant_id
    AND status IN ('connected', 'connecting')
  ORDER BY last_connection_at DESC NULLS LAST
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an assistant has an active WhatsApp connection
CREATE OR REPLACE FUNCTION has_active_whatsapp_connection(p_assistant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM whatsapp_instances
    WHERE assistant_id = p_assistant_id
      AND status = 'connected'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old disconnected instances (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_instances(p_days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM whatsapp_instances
  WHERE status IN ('disconnected', 'error')
    AND updated_at < NOW() - INTERVAL '1 day' * p_days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- INITIAL DATA / CONSTRAINTS
-- =============================================================================

-- Add comment to table for documentation
COMMENT ON TABLE whatsapp_instances IS 'Stores WhatsApp instance connections for each assistant';
COMMENT ON COLUMN whatsapp_instances.assistant_id IS 'Reference to the assistant that owns this WhatsApp instance';
COMMENT ON COLUMN whatsapp_instances.instance_name IS 'Unique instance name used in EvolutionAPI';
COMMENT ON COLUMN whatsapp_instances.status IS 'Current connection status of the instance';
COMMENT ON COLUMN whatsapp_instances.qr_code IS 'QR code for connecting WhatsApp';
COMMENT ON COLUMN whatsapp_instances.qr_code_base64 IS 'Base64 encoded QR code image';
COMMENT ON COLUMN whatsapp_instances.phone_number IS 'Connected WhatsApp phone number';
COMMENT ON COLUMN whatsapp_instances.last_connection_at IS 'Timestamp of last successful connection';
COMMENT ON COLUMN whatsapp_instances.error_message IS 'Error message if status is error';