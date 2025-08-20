-- Remove marker_image_url column from ar_experiences table
-- Run this in your Supabase SQL editor

-- 1. Drop the dependent view first
DROP VIEW IF EXISTS public_experiences;

-- 2. Remove the marker_image_url column
ALTER TABLE ar_experiences DROP COLUMN IF EXISTS marker_image_url;

-- 3. Recreate the public_experiences view without marker_image_url
CREATE VIEW public_experiences AS
SELECT 
  id,
  title,
  description,
  mind_file_url,
  video_url,
  plane_width,
  plane_height,
  video_rotation,
  created_at
FROM ar_experiences;

-- 4. Verify the column was removed
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;

-- 5. Show updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;
