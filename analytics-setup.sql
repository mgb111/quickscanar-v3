-- Analytics Schema for QuickScanAR
-- Run these commands in your Supabase SQL editor

-- Create analytics events table
CREATE TABLE IF NOT EXISTS ar_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES ar_experiences(id),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'interaction', 'completion', 'error', 'conversion', 'target_recognition', 'session_start', 'session_end')),
  device_info JSONB,
  location_info JSONB,
  duration INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics sessions table
CREATE TABLE IF NOT EXISTS ar_analytics_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  experience_id UUID NOT NULL REFERENCES ar_experiences(id),
  user_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  total_interactions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  device_info JSONB,
  location_info JSONB
);

-- Create analytics aggregates table for performance
CREATE TABLE IF NOT EXISTS ar_analytics_daily_aggregates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  experience_id UUID NOT NULL REFERENCES ar_experiences(id),
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_interactions INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  avg_session_duration DECIMAL(10,2),
  avg_completion_rate DECIMAL(5,2),
  target_recognition_success_rate DECIMAL(5,2),
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(date, experience_id)
);

-- Create analytics conversions table
CREATE TABLE IF NOT EXISTS ar_analytics_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES ar_experiences(id),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255) NOT NULL,
  conversion_type VARCHAR(100) NOT NULL,
  conversion_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics performance metrics table
CREATE TABLE IF NOT EXISTS ar_analytics_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES ar_experiences(id),
  session_id VARCHAR(255) NOT NULL,
  target_recognition_time INTEGER,
  loading_time INTEGER,
  ar_init_time INTEGER,
  error_type VARCHAR(100),
  error_message TEXT,
  device_compatibility_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics geographic data table
CREATE TABLE IF NOT EXISTS ar_analytics_geographic (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES ar_experiences(id),
  session_id VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  country_code VARCHAR(3),
  city VARCHAR(100),
  region VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table for analytics limits
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'free' CHECK (status IN ('free', 'monthly', 'annual', 'enterprise')),
  plan_name VARCHAR(100) DEFAULT 'Free',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_experience_id ON ar_analytics_events (experience_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON ar_analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON ar_analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON ar_analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON ar_analytics_events (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_experience_id ON ar_analytics_sessions (experience_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON ar_analytics_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start_time ON ar_analytics_sessions (start_time);

CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_date ON ar_analytics_daily_aggregates (date);
CREATE INDEX IF NOT EXISTS idx_analytics_aggregates_experience_id ON ar_analytics_daily_aggregates (experience_id);

CREATE INDEX IF NOT EXISTS idx_analytics_conversions_experience_id ON ar_analytics_conversions (experience_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_user_id ON ar_analytics_conversions (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_type ON ar_analytics_conversions (conversion_type);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_created_at ON ar_analytics_conversions (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_performance_experience_id ON ar_analytics_performance (experience_id);
CREATE INDEX IF NOT EXISTS idx_analytics_performance_session_id ON ar_analytics_performance (session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_performance_created_at ON ar_analytics_performance (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_geographic_experience_id ON ar_analytics_geographic (experience_id);
CREATE INDEX IF NOT EXISTS idx_analytics_geographic_country ON ar_analytics_geographic (country);
CREATE INDEX IF NOT EXISTS idx_analytics_geographic_city ON ar_analytics_geographic (city);
CREATE INDEX IF NOT EXISTS idx_analytics_geographic_created_at ON ar_analytics_geographic (created_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions (status);

-- Create RLS (Row Level Security) policies
ALTER TABLE ar_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_analytics_daily_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_analytics_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_analytics_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_analytics_geographic ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own analytics
CREATE POLICY "Users can view their own analytics events" ON ar_analytics_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own analytics events" ON ar_analytics_events
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view their own analytics sessions" ON ar_analytics_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own analytics sessions" ON ar_analytics_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view their own analytics aggregates" ON ar_analytics_daily_aggregates
  FOR SELECT USING (
    experience_id IN (
      SELECT id FROM ar_experiences WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own conversions" ON ar_analytics_conversions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversions" ON ar_analytics_conversions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can view their own performance data" ON ar_analytics_performance
  FOR SELECT USING (
    experience_id IN (
      SELECT id FROM ar_experiences WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert performance data" ON ar_analytics_performance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own geographic data" ON ar_analytics_geographic
  FOR SELECT USING (
    experience_id IN (
      SELECT id FROM ar_experiences WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert geographic data" ON ar_analytics_geographic
  FOR INSERT WITH CHECK (true);

-- User subscriptions policies
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own subscription" ON user_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Create functions for analytics aggregation
CREATE OR REPLACE FUNCTION update_daily_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ar_analytics_daily_aggregates (
    date,
    experience_id,
    total_views,
    unique_viewers,
    total_interactions,
    total_conversions,
    avg_session_duration,
    avg_completion_rate,
    updated_at
  )
  SELECT 
    CURRENT_DATE,
    NEW.experience_id,
    COUNT(*) FILTER (WHERE event_type = 'view'),
    COUNT(DISTINCT user_id) FILTER (WHERE event_type = 'view'),
    COUNT(*) FILTER (WHERE event_type = 'interaction'),
    COUNT(*) FILTER (WHERE event_type = 'conversion'),
    AVG(duration) FILTER (WHERE event_type = 'session_end'),
    AVG(CASE WHEN event_type = 'completion' THEN 
      (metadata->>'completionRate')::DECIMAL 
      ELSE NULL END),
    NOW()
  FROM ar_analytics_events 
  WHERE experience_id = NEW.experience_id 
    AND DATE(created_at) = CURRENT_DATE
  ON CONFLICT (date, experience_id) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_viewers = EXCLUDED.unique_viewers,
    total_interactions = EXCLUDED.total_interactions,
    total_conversions = EXCLUDED.total_conversions,
    avg_session_duration = EXCLUDED.avg_session_duration,
    avg_completion_rate = EXCLUDED.avg_completion_rate,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic aggregation
DROP TRIGGER IF EXISTS trigger_update_daily_aggregates ON ar_analytics_events;
CREATE TRIGGER trigger_update_daily_aggregates
  AFTER INSERT ON ar_analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_aggregates();

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_composite 
  ON ar_analytics_events (experience_id, event_type, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_sessions_composite 
  ON ar_analytics_sessions (experience_id, start_time);

-- Create materialized view for dashboard metrics
DROP MATERIALIZED VIEW IF EXISTS analytics_dashboard_metrics;
CREATE MATERIALIZED VIEW analytics_dashboard_metrics AS
SELECT 
  e.user_id,
  COUNT(DISTINCT ae.session_id) as total_sessions,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'view') as total_views,
  COUNT(DISTINCT ae.user_id) FILTER (WHERE ae.event_type = 'view') as unique_viewers,
  AVG(ae.duration) FILTER (WHERE ae.event_type = 'session_end') as avg_session_duration,
  COUNT(ae.id) FILTER (WHERE ae.event_type = 'conversion') as total_conversions,
  CASE 
    WHEN COUNT(ae.id) FILTER (WHERE ae.event_type = 'view') > 0 
    THEN (COUNT(ae.id) FILTER (WHERE ae.event_type = 'conversion')::DECIMAL / 
          COUNT(ae.id) FILTER (WHERE ae.event_type = 'view') * 100)
    ELSE 0 
  END as conversion_rate
FROM ar_experiences e
LEFT JOIN ar_analytics_events ae ON e.id = ae.experience_id
WHERE ae.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY e.user_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_dashboard_metrics_user_id ON analytics_dashboard_metrics (user_id);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_analytics_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Insert default subscription for existing users
INSERT INTO user_subscriptions (user_id, status, plan_name, features, is_active)
SELECT 
  id, 
  'free', 
  'Free', 
  '["basic_analytics", "limited_data"]', 
  true
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Create sample analytics data for testing (optional)
-- This will help users see analytics immediately
INSERT INTO ar_analytics_events (experience_id, user_id, session_id, event_type, device_info, created_at)
SELECT 
  e.id,
  e.user_id,
  'sample_session_' || e.id,
  'view',
  '{"isMobile": true, "platform": "iOS", "userAgent": "Sample Data"}',
  NOW() - INTERVAL '1 day'
FROM ar_experiences e
LIMIT 5
ON CONFLICT DO NOTHING;

-- Verify setup
DO $$
BEGIN
    RAISE NOTICE '=== ANALYTICS SETUP COMPLETE ===';
    RAISE NOTICE '✅ Analytics tables created';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Triggers and functions created';
    RAISE NOTICE '✅ Sample data inserted';
    RAISE NOTICE '=== READY TO TRACK ANALYTICS ===';
END $$;
