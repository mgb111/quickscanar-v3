-- ========================================
-- ADD PORTAL EFFECT SUPPORT TO 3D AR
-- ========================================
-- This script adds portal effect settings for 3D models

DO $$ 
BEGIN
    -- Add portal_enabled column to enable/disable portal effect
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'portal_enabled'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN portal_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added portal_enabled column';
    ELSE
        RAISE NOTICE 'portal_enabled column already exists';
    END IF;

    -- Add portal_color column for edge glow color (hex format)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'portal_color'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN portal_color TEXT DEFAULT '#00ffff';
        RAISE NOTICE 'Added portal_color column';
    ELSE
        RAISE NOTICE 'portal_color column already exists';
    END IF;

    -- Add portal_intensity column for glow intensity (0-1)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'portal_intensity'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN portal_intensity DECIMAL DEFAULT 0.8 CHECK (portal_intensity >= 0 AND portal_intensity <= 1);
        RAISE NOTICE 'Added portal_intensity column';
    ELSE
        RAISE NOTICE 'portal_intensity column already exists';
    END IF;

    -- Add portal_frame_enabled column to show/hide portal frame
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'portal_frame_enabled'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN portal_frame_enabled BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added portal_frame_enabled column';
    ELSE
        RAISE NOTICE 'portal_frame_enabled column already exists';
    END IF;

    -- Add portal_frame_thickness column for frame thickness (0.01-0.2)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'portal_frame_thickness'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN portal_frame_thickness DECIMAL DEFAULT 0.05 CHECK (portal_frame_thickness >= 0.01 AND portal_frame_thickness <= 0.2);
        RAISE NOTICE 'Added portal_frame_thickness column';
    ELSE
        RAISE NOTICE 'portal_frame_thickness column already exists';
    END IF;

    -- Add portal_animation column for animation type
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' 
        AND column_name = 'portal_animation'
    ) THEN
        ALTER TABLE ar_experiences 
        ADD COLUMN portal_animation TEXT DEFAULT 'pulse' CHECK (portal_animation IN ('none', 'pulse', 'rotate', 'shimmer'));
        RAISE NOTICE 'Added portal_animation column';
    ELSE
        RAISE NOTICE 'portal_animation column already exists';
    END IF;

END $$;

-- Create index for faster queries by portal_enabled
CREATE INDEX IF NOT EXISTS idx_ar_experiences_portal_enabled ON ar_experiences(portal_enabled);

DO $$
BEGIN
    RAISE NOTICE '✅ Portal effect support added successfully!';
END $$;
