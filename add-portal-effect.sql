-- Add portal fields to ar_experiences
ALTER TABLE ar_experiences
ADD COLUMN IF NOT EXISTS portal_env_url TEXT,
ADD COLUMN IF NOT EXISTS portal_distance DECIMAL DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS portal_scale DECIMAL DEFAULT 1.0;
