-- Zapier-based Subscriptions Table Schema for Supabase
-- Run this in Supabase SQL Editor

-- Create subscriptions table for Zapier integration
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    polar_customer_id TEXT,
    plan TEXT NOT NULL,
    price_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'failed', 'trialing', 'past_due')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    campaign_limit INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_customer_id ON subscriptions(polar_customer_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.email() = email
    );

-- Policy: Service role can do everything (for Zapier)
CREATE POLICY "Service role full access" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically link subscriptions to users by email
CREATE OR REPLACE FUNCTION link_subscription_to_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find user by email and link subscription
    UPDATE subscriptions 
    SET user_id = (
        SELECT id FROM auth.users 
        WHERE email = NEW.email 
        LIMIT 1
    )
    WHERE id = NEW.id AND user_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link subscriptions when inserted
CREATE TRIGGER trigger_link_subscription_to_user
    AFTER INSERT ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION link_subscription_to_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample plan mappings (you can adjust these)
COMMENT ON TABLE subscriptions IS 'Subscriptions managed via Zapier webhook from Polar';

-- Plan limits mapping (for reference in your app code)
-- Free: 1 AR experience
-- Monthly: 3 AR experiences  
-- Annual: 36 AR experiences
