-- Fix marker_image_url column to be nullable
-- Run this in your Supabase SQL editor

-- Make marker_image_url nullable since marker images are now contained in .mind files
ALTER TABLE ar_experiences ALTER COLUMN marker_image_url DROP NOT NULL;

-- Update existing records to have NULL marker_image_url if they don't have one
UPDATE ar_experiences SET marker_image_url = NULL WHERE marker_image_url = '';

-- Verify the change
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' AND column_name = 'marker_image_url';
