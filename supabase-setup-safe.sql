-- ========================================
-- QUICKSCANAR SAFE DATABASE SETUP
-- ========================================
-- This script safely sets up the database without errors if tables already exist
-- Run this in your Supabase SQL editor

-- ========================================
-- DATABASE SETUP (Safe Version)
-- ========================================

-- Create the ar_experiences table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ar_experiences') THEN
        CREATE TABLE ar_experiences (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          marker_image_url TEXT NOT NULL,
          mind_file_url TEXT NOT NULL,
          video_url TEXT NOT NULL,
          preview_image_url TEXT,
          plane_width DECIMAL DEFAULT 1,
          plane_height DECIMAL DEFAULT 0.5625,
          video_rotation INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created ar_experiences table';
    ELSE
        RAISE NOTICE 'ar_experiences table already exists, skipping creation';
    END IF;
END $$;

-- Enable Row Level Security (safe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'ar_experiences' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE ar_experiences ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on ar_experiences table';
    ELSE
        RAISE NOTICE 'RLS already enabled on ar_experiences table';
    END IF;
END $$;

-- ========================================
-- RLS POLICIES (Safe Version)
-- ========================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own experiences" ON ar_experiences;
DROP POLICY IF EXISTS "Users can insert their own experiences" ON ar_experiences;
DROP POLICY IF EXISTS "Users can update their own experiences" ON ar_experiences;
DROP POLICY IF EXISTS "Users can delete their own experiences" ON ar_experiences;
DROP POLICY IF EXISTS "Public can view experiences" ON ar_experiences;

-- Create RLS policies
CREATE POLICY "Users can view their own experiences" ON ar_experiences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiences" ON ar_experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences" ON ar_experiences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences" ON ar_experiences
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access for viewing experiences
CREATE POLICY "Public can view experiences" ON ar_experiences
  FOR SELECT USING (true);

-- ========================================
-- TRIGGERS (Safe Version)
-- ========================================

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_ar_experiences_updated_at ON ar_experiences;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ar_experiences_updated_at 
  BEFORE UPDATE ON ar_experiences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INDEXES (Safe Version)
-- ========================================

-- Create indexes (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ar_experiences_user_id') THEN
        CREATE INDEX idx_ar_experiences_user_id ON ar_experiences(user_id);
        RAISE NOTICE 'Created index idx_ar_experiences_user_id';
    ELSE
        RAISE NOTICE 'Index idx_ar_experiences_user_id already exists';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ar_experiences_created_at') THEN
        CREATE INDEX idx_ar_experiences_created_at ON ar_experiences(created_at DESC);
        RAISE NOTICE 'Created index idx_ar_experiences_created_at';
    ELSE
        RAISE NOTICE 'Index idx_ar_experiences_created_at already exists';
    END IF;
END $$;

-- ========================================
-- VIEWS (Safe Version)
-- ========================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public_experiences;

-- Create view for public experience data
CREATE VIEW public_experiences AS
SELECT 
  id,
  title,
  description,
  marker_image_url,
  mind_file_url,
  video_url,
  plane_width,
  plane_height,
  video_rotation,
  created_at
FROM ar_experiences;

-- ========================================
-- STORAGE POLICIES (Safe Version)
-- ========================================

-- Enable RLS on storage.objects (if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on storage.objects';
    ELSE
        RAISE NOTICE 'RLS already enabled on storage.objects';
    END IF;
END $$;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload markers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view markers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own markers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own markers" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload mind files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view mind files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own mind files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own mind files" ON storage.objects;

DROP POLICY IF EXISTS "Block access to other buckets" ON storage.objects;

-- Create storage policies
-- Markers bucket policies
CREATE POLICY "Users can upload markers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'markers' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

CREATE POLICY "Public can view markers" ON storage.objects
FOR SELECT USING (bucket_id = 'markers');

CREATE POLICY "Users can update their own markers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'markers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own markers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'markers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Videos bucket policies
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'mp4'
);

CREATE POLICY "Public can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Mind files bucket policies
CREATE POLICY "Users can upload mind files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mind-files' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'mind'
);

CREATE POLICY "Public can view mind files" ON storage.objects
FOR SELECT USING (bucket_id = 'mind-files');

CREATE POLICY "Users can update their own mind files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'mind-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own mind files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mind-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Block access to other buckets
CREATE POLICY "Block access to other buckets" ON storage.objects
FOR ALL USING (
  bucket_id IN ('markers', 'videos', 'mind-files')
);

-- ========================================
-- HELPER FUNCTIONS (Safe Version)
-- ========================================

-- Function to get user's storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ob.bucket_id::TEXT as bucket_name,
    COUNT(*) as file_count,
    COALESCE(SUM(ob.metadata->>'size')::BIGINT, 0) as total_size
  FROM storage.objects ob
  WHERE (storage.foldername(ob.name))[1] = user_uuid::TEXT
  GROUP BY ob.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_user_files(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all files belonging to the user
  DELETE FROM storage.objects 
  WHERE (storage.foldername(name))[1] = user_uuid::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if everything is set up correctly
DO $$
BEGIN
    RAISE NOTICE '=== QUICKSCANAR SETUP VERIFICATION ===';
    
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ar_experiences') THEN
        RAISE NOTICE '✅ ar_experiences table exists';
    ELSE
        RAISE NOTICE '❌ ar_experiences table missing';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'ar_experiences' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS enabled on ar_experiences';
    ELSE
        RAISE NOTICE '❌ RLS not enabled on ar_experiences';
    END IF;
    
    -- Check if policies exist
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'ar_experiences') THEN
        RAISE NOTICE '✅ RLS policies created for ar_experiences';
    ELSE
        RAISE NOTICE '❌ RLS policies missing for ar_experiences';
    END IF;
    
    -- Check if storage policies exist
    IF EXISTS (SELECT FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') THEN
        RAISE NOTICE '✅ Storage policies created';
    ELSE
        RAISE NOTICE '❌ Storage policies missing';
    END IF;
    
    RAISE NOTICE '=== SETUP COMPLETE ===';
END $$; 