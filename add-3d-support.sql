-- ========================================
-- ADD 3D MODEL SUPPORT TO AR EXPERIENCES
-- ========================================
-- This script adds support for 3D models alongside video AR

-- First, make video_url nullable since 3D AR won't have videos
DO $$
BEGIN
    -- Remove NOT NULL constraint from video_url
    ALTER TABLE ar_experiences 
    ALTER COLUMN video_url DROP NOT NULL;
    RAISE NOTICE 'Made video_url nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'video_url already nullable or error: %', SQLERRM;
END $$;

-- Add new columns to ar_experiences table
DO $$ 
BEGIN
    -- Add model_url column for 3D model files (GLB/GLTF)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'model_url'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN model_url TEXT;
        RAISE NOTICE 'Added model_url column';
    ELSE
        RAISE NOTICE 'model_url column already exists';
    END IF;

    -- Add content_type column to distinguish between video, 3D, or both
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'content_type'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', '3d', 'both'));
        RAISE NOTICE 'Added content_type column';
    ELSE
        RAISE NOTICE 'content_type column already exists';
        -- Update constraint to include 'both'
        ALTER TABLE ar_experiences 
        DROP CONSTRAINT IF EXISTS ar_experiences_content_type_check;
        ALTER TABLE ar_experiences 
        ADD CONSTRAINT ar_experiences_content_type_check CHECK (content_type IN ('video', '3d', 'both'));
    END IF;

    -- Add model_scale column for 3D model scaling
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'model_scale'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN model_scale DECIMAL DEFAULT 1.0;
        RAISE NOTICE 'Added model_scale column';
    ELSE
        RAISE NOTICE 'model_scale column already exists';
    END IF;

    -- Add model_rotation column for 3D model rotation (in degrees)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'model_rotation'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN model_rotation INTEGER DEFAULT 0;
        RAISE NOTICE 'Added model_rotation column';
    ELSE
        RAISE NOTICE 'model_rotation column already exists';
    END IF;
END $$;

-- Update existing records to have content_type = 'video' if they have video_url
UPDATE ar_experiences 
SET content_type = 'video' 
WHERE video_url IS NOT NULL AND content_type IS NULL;

-- Create index for faster queries by content_type
CREATE INDEX IF NOT EXISTS idx_ar_experiences_content_type ON ar_experiences(content_type);

-- Add constraint to ensure either video_url OR model_url is present
DO $$
BEGIN
    -- Drop constraint if it exists
    ALTER TABLE ar_experiences 
    DROP CONSTRAINT IF EXISTS check_content_url;
    
    -- Add constraint: content URLs must match content type
    ALTER TABLE ar_experiences 
    ADD CONSTRAINT check_content_url 
    CHECK (
        (content_type = 'video' AND video_url IS NOT NULL) OR
        (content_type = '3d' AND model_url IS NOT NULL) OR
        (content_type = 'both' AND video_url IS NOT NULL AND model_url IS NOT NULL)
    );
    RAISE NOTICE 'Added constraint to ensure content URL matches content type';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint already exists or error: %', SQLERRM;
END $$;

DO $$
BEGIN
    RAISE NOTICE '✅ 3D model support added successfully!';
END $$;
