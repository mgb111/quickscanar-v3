-- Complete fix for AR Experiences table schema
-- Run this in your Supabase SQL editor to ensure all required columns exist

-- 1. Check current table structure
SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
-- Note: These commands will fail if the columns already exist, which is fine

-- Add marker_image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'marker_image_url'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN marker_image_url TEXT;
        RAISE NOTICE 'Added marker_image_url column';
    ELSE
        RAISE NOTICE 'marker_image_url column already exists';
    END IF;
END $$;

-- Add video_file_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'video_file_url'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN video_file_url TEXT;
        RAISE NOTICE 'Added video_file_url column';
    ELSE
        RAISE NOTICE 'video_file_url column already exists';
    END IF;
END $$;

-- Add mind_file_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'mind_file_url'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN mind_file_url TEXT;
        RAISE NOTICE 'Added mind_file_url column';
    ELSE
        RAISE NOTICE 'mind_file_url column already exists';
    END IF;
END $$;

-- Add link_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'link_url'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN link_url TEXT;
        RAISE NOTICE 'Added link_url column';
    ELSE
        RAISE NOTICE 'link_url column already exists';
    END IF;
END $$;

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Add plane_width column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'plane_width'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN plane_width DECIMAL DEFAULT 1;
        RAISE NOTICE 'Added plane_width column';
    ELSE
        RAISE NOTICE 'plane_width column already exists';
    END IF;
END $$;

-- Add plane_height column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'plane_height'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN plane_height DECIMAL DEFAULT 0.5625;
        RAISE NOTICE 'Added plane_height column';
    ELSE
        RAISE NOTICE 'plane_height column already exists';
    END IF;
END $$;

-- Add video_rotation column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ar_experiences' AND column_name = 'video_rotation'
    ) THEN
        ALTER TABLE ar_experiences ADD COLUMN video_rotation INTEGER DEFAULT 0;
        RAISE NOTICE 'Added video_rotation column';
    ELSE
        RAISE NOTICE 'video_rotation column already exists';
    END IF;
END $$;

-- 3. Make marker_image_url nullable (since it's optional in some cases)
ALTER TABLE ar_experiences ALTER COLUMN marker_image_url DROP NOT NULL;

-- 4. Verify final table structure
SELECT column_name, is_nullable, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
ORDER BY ordinal_position;

-- 5. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'ar_experiences';

-- 6. Enable RLS if not already enabled
ALTER TABLE ar_experiences ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies if they don't exist
-- Users can view their own experiences
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ar_experiences' AND policyname = 'Users can view their own experiences'
    ) THEN
        CREATE POLICY "Users can view their own experiences" ON ar_experiences
          FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Created RLS policy: Users can view their own experiences';
    ELSE
        RAISE NOTICE 'RLS policy already exists: Users can view their own experiences';
    END IF;
END $$;

-- Users can insert their own experiences
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ar_experiences' AND policyname = 'Users can insert their own experiences'
    ) THEN
        CREATE POLICY "Users can insert their own experiences" ON ar_experiences
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created RLS policy: Users can insert their own experiences';
    ELSE
        RAISE NOTICE 'RLS policy already exists: Users can insert their own experiences';
    END IF;
END $$;

-- Users can update their own experiences
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ar_experiences' AND policyname = 'Users can update their own experiences'
    ) THEN
        CREATE POLICY "Users can update their own experiences" ON ar_experiences
          FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created RLS policy: Users can update their own experiences';
    ELSE
        RAISE NOTICE 'RLS policy already exists: Users can update their own experiences';
    END IF;
END $$;

-- Users can delete their own experiences
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ar_experiences' AND policyname = 'Users can delete their own experiences'
    ) THEN
        CREATE POLICY "Users can delete their own experiences" ON ar_experiences
          FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created RLS policy: Users can delete their own experiences';
    ELSE
        RAISE NOTICE 'RLS policy already exists: Users can delete their own experiences';
    END IF;
END $$;

-- Public can view experiences
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ar_experiences' AND policyname = 'Public can view experiences'
    ) THEN
        CREATE POLICY "Public can view experiences" ON ar_experiences
          FOR SELECT USING (true);
        RAISE NOTICE 'Created RLS policy: Public can view experiences';
    ELSE
        RAISE NOTICE 'RLS policy already exists: Public can view experiences';
    END IF;
END $$;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ar_experiences_user_id ON ar_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_experiences_created_at ON ar_experiences(created_at DESC);

-- 9. Final verification
SELECT 'Schema fix completed successfully!' as status;
