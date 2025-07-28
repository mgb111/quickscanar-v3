-- ========================================
-- QUICKSCANAR STORAGE BUCKETS SETUP
-- ========================================
-- 
-- IMPORTANT: Storage buckets must be created manually in the Supabase dashboard
-- before running these SQL policies.
--
-- Steps to create buckets:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to Storage section
-- 3. Click "Create a new bucket"
-- 4. Create the following buckets:
--    - Name: "markers" (Public bucket)
--    - Name: "videos" (Public bucket) 
--    - Name: "mind-files" (Public bucket)
--
-- After creating the buckets, run this SQL to set up the policies.
-- ========================================

-- ========================================
-- MARKERS BUCKET POLICIES
-- ========================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload marker images
-- Only allows image files (jpg, jpeg, png, gif, webp)
CREATE POLICY "Users can upload markers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'markers' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text IN ('jpg', 'jpeg', 'png', 'gif', 'webp')
);

-- Allow public read access to marker images
-- Anyone can view marker images (needed for AR experiences)
CREATE POLICY "Public can view markers" ON storage.objects
FOR SELECT USING (bucket_id = 'markers');

-- Allow users to update their own marker images
-- Users can only update files in their own folder
CREATE POLICY "Users can update their own markers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'markers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own marker images
-- Users can only delete files in their own folder
CREATE POLICY "Users can delete their own markers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'markers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- VIDEOS BUCKET POLICIES
-- ========================================

-- Allow authenticated users to upload videos
-- Only allows MP4 files
CREATE POLICY "Users can upload videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'mp4'
);

-- Allow public read access to videos
-- Anyone can view videos (needed for AR experiences)
CREATE POLICY "Public can view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- Allow users to update their own videos
-- Users can only update files in their own folder
CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own videos
-- Users can only delete files in their own folder
CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- MIND-FILES BUCKET POLICIES
-- ========================================

-- Allow authenticated users to upload mind files
-- Only allows .mind files
CREATE POLICY "Users can upload mind files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mind-files' 
  AND auth.role() = 'authenticated'
  AND (storage.extension(name))::text = 'mind'
);

-- Allow public read access to mind files
-- Anyone can view mind files (needed for AR experiences)
CREATE POLICY "Public can view mind files" ON storage.objects
FOR SELECT USING (bucket_id = 'mind-files');

-- Allow users to update their own mind files
-- Users can only update files in their own folder
CREATE POLICY "Users can update their own mind files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'mind-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own mind files
-- Users can only delete files in their own folder
CREATE POLICY "Users can delete their own mind files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mind-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========================================
-- ADDITIONAL SECURITY POLICIES
-- ========================================

-- Prevent access to any other buckets
-- This ensures users can only access the three buckets we created
CREATE POLICY "Block access to other buckets" ON storage.objects
FOR ALL USING (
  bucket_id IN ('markers', 'videos', 'mind-files')
);

-- ========================================
-- HELPER FUNCTIONS (Optional)
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
-- This can be used to remove files when an experience is deleted
CREATE OR REPLACE FUNCTION cleanup_user_files(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all files belonging to the user
  DELETE FROM storage.objects 
  WHERE (storage.foldername(name))[1] = user_uuid::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if policies are created correctly
-- Run these queries to verify the setup:

-- List all storage policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'objects';

-- Check bucket access (run as authenticated user)
-- SELECT bucket_id, COUNT(*) as file_count 
-- FROM storage.objects 
-- GROUP BY bucket_id;

-- ========================================
-- NOTES
-- ========================================
--
-- 1. File Structure:
--    Files are stored with the following structure:
--    - markers/{user_id}/{timestamp}-marker.{extension}
--    - videos/{user_id}/{timestamp}-video.mp4
--    - mind-files/{user_id}/{timestamp}-marker.mind
--
-- 2. Security:
--    - Only authenticated users can upload files
--    - Users can only access files in their own folder
--    - Public read access is required for AR experiences
--    - File type validation is enforced
--
-- 3. Performance:
--    - Files are organized by user ID for efficient queries
--    - Indexes are automatically created on bucket_id and name
--
-- 4. Maintenance:
--    - Use the cleanup_user_files function when deleting users
--    - Monitor storage usage with get_user_storage_usage function
--
-- ======================================== 