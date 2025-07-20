-- AIDA Platform - Billing System Database Schema
-- Implements the flexible pricing model: R$99 base + add-ons
-- Migration: 005_billing_system.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL DEFAULT 'aida-flexible',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    
    -- Billing period
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    
    -- Pricing
    base_price_cents INTEGER NOT NULL DEFAULT 9900, -- R$ 99.00
    
    -- Add-ons purchased
    additional_instances INTEGER NOT NULL DEFAULT 0,
    additional_message_packs INTEGER NOT NULL DEFAULT 0, -- Number of 1000-message packs
    additional_document_packs INTEGER NOT NULL DEFAULT 0, -- Number of 10-document packs
    
    -- Billing dates
    next_billing_date TIMESTAMPTZ NOT NULL,
    last_billing_date TIMESTAMPTZ,
    
    -- Payment method
    payment_method_id VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    UNIQUE(business_id, status) -- Only one active subscription per business
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Current usage in this billing period
    messages_used INTEGER NOT NULL DEFAULT 0,
    documents_used INTEGER NOT NULL DEFAULT 0,
    instances_used INTEGER NOT NULL DEFAULT 1,
    
    -- Current limits (base + add-ons)
    message_limit INTEGER NOT NULL DEFAULT 1000,
    document_limit INTEGER NOT NULL DEFAULT 10,
    instance_limit INTEGER NOT NULL DEFAULT 1,
    
    -- Tracking
    last_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When usage was reset (billing period start)
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_id, subscription_id),
    
    -- Check constraints
    CHECK (messages_used >= 0),
    CHECK (documents_used >= 0),
    CHECK (instances_used >= 0),
    CHECK (message_limit > 0),
    CHECK (document_limit > 0),
    CHECK (instance_limit > 0)
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Billing period
    billing_period_start TIMESTAMPTZ NOT NULL,
    billing_period_end TIMESTAMPTZ NOT NULL,
    
    -- Amounts
    total_amount_cents INTEGER NOT NULL,
    base_amount_cents INTEGER NOT NULL,
    add_on_amount_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    paid_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (total_amount_cents >= 0),
    CHECK (base_amount_cents >= 0),
    CHECK (add_on_amount_cents >= 0),
    CHECK (total_amount_cents = base_amount_cents + add_on_amount_cents)
);

-- Invoice line items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Line item details
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_cents INTEGER NOT NULL,
    total_price_cents INTEGER NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('base', 'additional_instance', 'additional_messages', 'additional_documents')),
    
    -- Constraints
    CHECK (quantity > 0),
    CHECK (unit_price_cents >= 0),
    CHECK (total_price_cents >= 0),
    CHECK (total_price_cents = quantity * unit_price_cents)
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('charge', 'refund', 'adjustment')),
    
    -- Payment provider info
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'pix', 'boleto', etc.
    provider_transaction_id VARCHAR(255),
    provider_fee_cents INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CHECK (amount_cents > 0),
    CHECK (provider_fee_cents >= 0)
);

-- Usage events table (for detailed tracking)
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('message_sent', 'message_received', 'document_uploaded', 'document_processed', 'instance_created')),
    resource_id UUID, -- ID of the related resource (message, document, instance)
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- Context
    metadata JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Billing preferences table
CREATE TABLE IF NOT EXISTS billing_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Notification preferences
    notify_usage_threshold BOOLEAN DEFAULT true,
    usage_threshold_percentage INTEGER DEFAULT 90 CHECK (usage_threshold_percentage BETWEEN 0 AND 100),
    
    -- Auto-upgrade preferences
    auto_upgrade_messages BOOLEAN DEFAULT false,
    auto_upgrade_documents BOOLEAN DEFAULT false,
    max_auto_upgrade_amount_cents INTEGER DEFAULT 10000, -- R$ 100.00 max auto-upgrade
    
    -- Payment preferences
    preferred_payment_method VARCHAR(20) DEFAULT 'credit_card',
    invoice_email VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);

CREATE INDEX IF NOT EXISTS idx_usage_records_business_id ON usage_records(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_subscription_id ON usage_records(subscription_id);

CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_type ON invoice_line_items(type);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_business_id ON payment_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);

CREATE INDEX IF NOT EXISTS idx_usage_events_business_id ON usage_events(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at);

CREATE INDEX IF NOT EXISTS idx_billing_preferences_business_id ON billing_preferences(business_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_records_updated_at BEFORE UPDATE ON usage_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_billing_preferences_updated_at BEFORE UPDATE ON billing_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for usage_records
CREATE POLICY "Users can view own usage" ON usage_records
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all usage records" ON usage_records
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all invoices" ON invoices
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can view own invoice line items" ON invoice_line_items
    FOR SELECT USING (invoice_id IN (
        SELECT id FROM invoices WHERE business_id IN (
            SELECT business_id FROM user_businesses 
            WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Service role can manage all line items" ON invoice_line_items
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view own transactions" ON payment_transactions
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all transactions" ON payment_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for usage_events
CREATE POLICY "Users can view own usage events" ON usage_events
    FOR SELECT USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all usage events" ON usage_events
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for billing_preferences
CREATE POLICY "Users can manage own billing preferences" ON billing_preferences
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_businesses 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role can manage all billing preferences" ON billing_preferences
    FOR ALL USING (auth.role() = 'service_role');