# AR Experiences Creation Fix Summary

## Issue Description
The error `Could not find the 'video_file_url' column of 'ar_experiences' in the schema cache` indicates that the database table `ar_experiences` is missing required columns or has a different schema than expected.

## Root Cause
The `ar_experiences` table in the database is missing several required columns:
- `video_file_url` - for storing video file URLs
- `marker_image_url` - for storing marker image URLs  
- `mind_file_url` - for storing compiled mind file URLs
- `user_id` - for user authentication and RLS policies

## Files Modified

### 1. API Route (`app/api/ar-experiences/route.ts`)
- Added authentication check using Bearer token
- Added `marker_image_url` field requirement
- Added `user_id` field from authenticated user
- Fixed validation to include all required fields

### 2. Create Experience Page (`app/dashboard/create/page.tsx`)
- Added marker image upload field
- Added Supabase client import for authentication
- Updated form submission to include authentication token
- Added validation for marker image upload

### 3. New API Route (`app/api/upload/marker-image/route.ts`)
- Created new endpoint for uploading marker images
- Uploads to `markers` storage bucket
- Validates file type and size
- Returns public URL for the uploaded image

## Database Schema Fix

### Run the SQL Script
Execute `fix-ar-experiences-complete.sql` in your Supabase SQL editor to:
- Add missing columns if they don't exist
- Set up proper RLS policies
- Create necessary indexes
- Verify table structure

### Required Storage Buckets
Ensure these storage buckets exist in Supabase:
1. **`markers`** - for marker images (JPG, PNG, WebP)
2. **`videos`** - for video files (MP4)
3. **`mind-files`** - for compiled mind files (.mind)

## Steps to Fix

### 1. Database Schema
```sql
-- Run this in Supabase SQL editor
\i fix-ar-experiences-complete.sql
```

### 2. Storage Buckets
In Supabase Dashboard > Storage:
- Create `markers` bucket (if not exists)
- Create `videos` bucket (if not exists)  
- Create `mind-files` bucket (if not exists)

### 3. Environment Variables
Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Test the Fix
1. Go to `/dashboard/create`
2. Fill in the form with:
   - Title
   - Video file
   - Mind file (.mind)
   - Marker image (JPG/PNG/WebP)
3. Submit and verify no errors

## Expected Result
After applying the fix:
- AR experiences can be created successfully
- All required fields are properly stored
- User authentication works correctly
- RLS policies protect user data
- Storage uploads work for all file types

## Troubleshooting
If issues persist:
1. Check Supabase logs for detailed error messages
2. Verify all storage buckets exist and have proper policies
3. Ensure RLS is enabled on the `ar_experiences` table
4. Check that the service role key has proper permissions
