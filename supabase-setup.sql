-- QuickScanAR Database Setup
-- Run this in your Supabase SQL editor

-- Create the ar_experiences table
CREATE TABLE ar_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  marker_image_url TEXT NOT NULL,
  mind_file_url TEXT NOT NULL,
  video_file_url TEXT NOT NULL,
  preview_image_url TEXT,
  plane_width DECIMAL DEFAULT 1,
  plane_height DECIMAL DEFAULT 0.5625,
  video_rotation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ar_experiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user access
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

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ar_experiences_updated_at 
  BEFORE UPDATE ON ar_experiences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ar_experiences_user_id ON ar_experiences(user_id);
CREATE INDEX idx_ar_experiences_created_at ON ar_experiences(created_at DESC);

-- Optional: Create a view for public experience data
CREATE VIEW public_experiences AS
SELECT 
  id,
  title,
  description,
  marker_image_url,
  mind_file_url,
  video_file_url,
  plane_width,
  plane_height,
  video_rotation,
  created_at
FROM ar_experiences;

-- ========================================
-- STORAGE BUCKETS SETUP
-- ========================================

-- Create storage buckets
-- Note: These commands need to be run in the Supabase dashboard Storage section
-- as SQL cannot directly create storage buckets

-- ========================================
-- STORAGE POLICIES SETUP
-- ========================================

-- Markers bucket policies
-- Run these after creating the 'markers' bucket in Storage

-- Allow authenticated users to upload marker images
CREATE POLICY "Users can upload markers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'markers' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

-- Allow public read access to marker images
CREATE POLICY "Public can view markers" ON storage.objects
FOR SELECT USING (bucket_id = 'markers');

-- Allow users to update their own marker images
CREATE POLICY "Users can update their own markers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'markers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own marker images
CREATE POLICY "Users can delete their own markers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'markers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================

-- Videos bucket policies
-- Run these after creating the 'videos' bucket in Storage

-- Allow authenticated users to upload videos
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'mp4'
);

-- Allow public read access to videos
CREATE POLICY "Public can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- Allow users to update their own videos
CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own videos
CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================

-- Mind files bucket policies
-- Run these after creating the 'mind-files' bucket in Storage

-- Allow authenticated users to upload mind files
CREATE POLICY "Users can upload mind files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mind-files' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'mind'
);

-- Allow public read access to mind files
CREATE POLICY "Public can view mind files" ON storage.objects
FOR SELECT USING (bucket_id = 'mind-files');

-- Allow users to update their own mind files
CREATE POLICY "Users can update their own mind files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'mind-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own mind files
CREATE POLICY "Users can delete their own mind files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mind-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 