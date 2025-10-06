-- Add video_scale to ar_experiences
ALTER TABLE ar_experiences
ADD COLUMN IF NOT EXISTS video_scale DECIMAL DEFAULT 1.0;
