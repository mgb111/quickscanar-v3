-- Polar.sh Integration Schema for QuickScanAR
-- Run these commands in your Supabase SQL editor

-- Create user subscriptions table
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  polar_customer_id VARCHAR(255) NOT NULL,
  price_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  polar_price_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL CHECK (interval IN ('month', 'year')),
  features JSONB,
  payment_link VARCHAR(500), -- Payment link for the plan
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment history table
CREATE TABLE payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  polar_invoice_id VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'canceled')),
  payment_method VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage tracking table
CREATE TABLE usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 1,
  usage_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription limits table
CREATE TABLE subscription_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  limit_value INTEGER NOT NULL,
  limit_type VARCHAR(20) NOT NULL CHECK (limit_type IN ('count', 'storage_mb', 'bandwidth_gb')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_polar_id ON user_subscriptions (polar_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions (status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions (current_period_end);

CREATE INDEX idx_subscription_plans_price_id ON subscription_plans (polar_price_id);
CREATE INDEX idx_subscription_plans_active ON subscription_plans (is_active);

CREATE INDEX idx_payment_history_user_id ON payment_history (user_id);
CREATE INDEX idx_payment_history_subscription_id ON payment_history (subscription_id);
CREATE INDEX idx_payment_history_status ON payment_history (status);
CREATE INDEX idx_payment_history_created_at ON payment_history (created_at);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking (user_id);
CREATE INDEX idx_usage_tracking_subscription_id ON usage_tracking (subscription_id);
CREATE INDEX idx_usage_tracking_feature ON usage_tracking (feature);
CREATE INDEX idx_usage_tracking_date ON usage_tracking (usage_date);

CREATE INDEX idx_subscription_limits_plan_id ON subscription_limits (plan_id);
CREATE INDEX idx_subscription_limits_feature ON subscription_limits (feature);

-- Insert default subscription plans
INSERT INTO subscription_plans (polar_price_id, name, description, amount, currency, interval, features, payment_link) VALUES
('price_free', 'Free Plan', 'Get started with AR experiences', 0, 'USD', 'month', '["1 AR Experience", "Basic Analytics", "Community Support"]', NULL),
('price_monthly', 'Monthly Plan', 'Perfect for growing creators', 4900, 'USD', 'month', '["3 AR Campaigns", "Advanced Analytics", "Priority Support", "Custom Branding"]', 'https://polar.sh/your-org/monthly-plan'),
('price_annual', 'Annual Plan', 'Save $89/year with annual billing', 49900, 'USD', 'year', '["3 AR Campaigns per month", "Premium Analytics", "24/7 Support", "White-label Solutions"]', 'https://polar.sh/your-org/annual-plan');

-- Insert default subscription limits
INSERT INTO subscription_limits (plan_id, feature, limit_value, limit_type) VALUES
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_free'), 'ar_experiences', 1, 'count'),
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_free'), 'storage', 100, 'storage_mb'),
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_free'), 'analytics_retention', 30, 'count'), -- days

((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_monthly'), 'ar_experiences', 3, 'count'),
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_monthly'), 'storage', 1000, 'storage_mb'),
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_monthly'), 'analytics_retention', 90, 'count'),

((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_annual'), 'ar_experiences', 36, 'count'), -- 3 campaigns per month × 12 months
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_annual'), 'storage', 10000, 'storage_mb'),
((SELECT id FROM subscription_plans WHERE polar_price_id = 'price_annual'), 'analytics_retention', 365, 'count');

-- Create RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;

-- Policy for user subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for subscription plans (read-only for all users)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- Policy for payment history
CREATE POLICY "Users can view their own payment history" ON payment_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment history" ON payment_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for usage tracking
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage" ON usage_tracking
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for subscription limits (read-only for all users)
CREATE POLICY "Anyone can view subscription limits" ON subscription_limits
  FOR SELECT USING (true);

-- Create functions for subscription management
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  status VARCHAR(50),
  plan_name VARCHAR(255),
  features JSONB,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.status,
    sp.name,
    sp.features,
    us.current_period_end,
    CASE 
      WHEN us.status = 'active' AND us.current_period_end > NOW() THEN true
      ELSE false
    END as is_active
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.price_id = sp.polar_price_id
  WHERE us.user_id = user_uuid
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create AR experience
CREATE OR REPLACE FUNCTION can_create_ar_experience(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_limit INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get user's AR experience limit
  SELECT sl.limit_value INTO user_limit
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.price_id = sp.polar_price_id
  JOIN subscription_limits sl ON sp.id = sl.plan_id
  WHERE us.user_id = user_uuid 
    AND sl.feature = 'ar_experiences'
    AND us.status = 'active'
    AND us.current_period_end > NOW();
  
  -- If no limit found or subscription inactive, return false
  IF user_limit IS NULL THEN
    RETURN false;
  END IF;
  
  -- If unlimited (-1), return true
  IF user_limit = -1 THEN
    RETURN true;
  END IF;
  
  -- Get current usage count
  SELECT COUNT(*) INTO current_usage
  FROM ar_experiences
  WHERE user_id = user_uuid
    AND created_at >= (
      SELECT current_period_start 
      FROM user_subscriptions 
      WHERE user_id = user_uuid 
        AND status = 'active'
      LIMIT 1
    );
  
  RETURN current_usage < user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
  user_uuid UUID,
  feature_name VARCHAR(100),
  usage_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, subscription_id, feature, usage_count)
  SELECT 
    user_uuid,
    us.id,
    feature_name,
    usage_count
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

CREATE TRIGGER trigger_update_plan_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Create view for subscription overview
CREATE VIEW subscription_overview AS
SELECT 
  u.id as user_id,
  u.email,
  us.status as subscription_status,
  sp.name as plan_name,
  sp.amount as plan_amount,
  sp.currency as plan_currency,
  sp.interval as billing_interval,
  sp.payment_link,
  us.current_period_end,
  us.created_at as subscription_start,
  CASE 
    WHEN us.status = 'active' AND us.current_period_end > NOW() THEN true
    ELSE false
  END as is_active
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
LEFT JOIN subscription_plans sp ON us.price_id = sp.polar_price_id
WHERE us.id IS NOT NULL;
