-- Complete fix for marker_image_url issues
-- Run this in your Supabase SQL editor

-- 1. Make the column nullable
ALTER TABLE ar_experiences ALTER COLUMN marker_image_url DROP NOT NULL;

-- 2. Clean up ALL existing marker URLs (empty strings, nulls, broken URLs)
UPDATE ar_experiences 
SET marker_image_url = NULL 
WHERE marker_image_url = '' 
   OR marker_image_url IS NULL 
   OR marker_image_url = 'null'
   OR marker_image_url LIKE '%null%';

-- 3. Verify the fix
SELECT 
  id, 
  title, 
  marker_image_url,
  CASE 
    WHEN marker_image_url IS NULL THEN '✅ Fixed'
    ELSE '❌ Still has value: ' || marker_image_url
  END as status
FROM ar_experiences 
ORDER BY created_at DESC;

-- 4. Check if any records still have marker_image_url values
SELECT COUNT(*) as records_with_marker_url
FROM ar_experiences 
WHERE marker_image_url IS NOT NULL AND marker_image_url != '';

-- 5. Show table structure
SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;
