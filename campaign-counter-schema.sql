-- Update user_campaign_claims table to support persistent campaign counting
-- This ensures deleted campaigns still count toward subscription limits

-- Add campaigns_created_count column if it doesn't exist
ALTER TABLE user_campaign_claims 
ADD COLUMN IF NOT EXISTS campaigns_created_count INTEGER DEFAULT 0;

-- Add last_created_at column to track most recent campaign creation
ALTER TABLE user_campaign_claims 
ADD COLUMN IF NOT EXISTS last_created_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have a count of 1 (they created at least one campaign)
UPDATE user_campaign_claims 
SET campaigns_created_count = 1 
WHERE campaigns_created_count IS NULL OR campaigns_created_count = 0;

-- Create index for better performance on user lookups
CREATE INDEX IF NOT EXISTS idx_user_campaign_claims_user_id 
ON user_campaign_claims(user_id);

-- Optional: Create a function to safely increment campaign count
CREATE OR REPLACE FUNCTION increment_user_campaign_count(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Try to update existing record
    UPDATE user_campaign_claims 
    SET campaigns_created_count = campaigns_created_count + 1,
        last_created_at = NOW()
    WHERE user_id = target_user_id
    RETURNING campaigns_created_count INTO new_count;
    
    -- If no record was updated, insert a new one
    IF NOT FOUND THEN
        INSERT INTO user_campaign_claims (user_id, campaigns_created_count, first_created_at, last_created_at)
        VALUES (target_user_id, 1, NOW(), NOW())
        RETURNING campaigns_created_count INTO new_count;
    END IF;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;
