-- Fix AR Experiences Schema - Column Name Mismatch
-- Run this in your Supabase SQL editor

-- Step 1: Rename video_url to video_file_url to match the API
ALTER TABLE ar_experiences RENAME COLUMN video_url TO video_file_url;

-- Step 2: Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;

-- Step 3: Check if there are any existing experiences that need data migration
-- (This will show empty results if the table is new)
SELECT id, title, video_file_url, mind_file_url 
FROM ar_experiences 
LIMIT 5;
