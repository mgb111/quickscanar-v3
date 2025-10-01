-- ========================================
-- FIX: Make video_url nullable for 3D AR support
-- ========================================
-- Run this if you already ran the migration and got the NOT NULL error

-- Remove NOT NULL constraint from video_url
ALTER TABLE ar_experiences 
ALTER COLUMN video_url DROP NOT NULL;

-- Add constraint to ensure either video_url OR model_url is present
ALTER TABLE ar_experiences 
DROP CONSTRAINT IF EXISTS check_content_url;

ALTER TABLE ar_experiences 
ADD CONSTRAINT check_content_url 
CHECK (
    (content_type = 'video' AND video_url IS NOT NULL) OR
    (content_type = '3d' AND model_url IS NOT NULL)
);

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
AND column_name IN ('video_url', 'model_url', 'content_type');

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ video_url is now nullable! 3D AR experiences can now be created.';
END $$;
