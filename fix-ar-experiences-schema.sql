-- Fix AR Experiences Schema - Column Name Mismatch
-- Run this in your Supabase SQL editor

-- Rename video_url to video_file_url to match the API
ALTER TABLE ar_experiences RENAME COLUMN video_url TO video_file_url;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;
