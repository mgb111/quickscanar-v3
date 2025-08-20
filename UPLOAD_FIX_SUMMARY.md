# Upload Fix Summary: Resolving 413 "Content Too Large" Error

## Problem
Your application was getting a 413 "Content Too Large" error when trying to upload large video files (35MB+) to Vercel API routes. This happened because:

1. **Vercel Payload Limit**: Vercel serverless functions have a ~4.5MB payload limit
2. **Direct File Upload**: Your frontend was sending entire video files to `/api/upload/r2`
3. **No Bypass**: Large files were hitting Vercel before reaching Cloudflare R2

## Solution: Two-Step Direct Upload Process

### Step 1: Presigned URL Generation
- **New Endpoint**: `/api/upload/presigned`
- **Purpose**: Generates secure upload URLs for R2
- **Payload**: Only file metadata (name, type, size) - a few bytes
- **Response**: Presigned URL + file key for direct upload

### Step 2: Direct Upload to R2
- **Client Action**: Uploads file directly to Cloudflare R2 using presigned URL
- **Bypasses Vercel**: File never goes through Vercel API routes
- **No Size Limits**: R2 can handle files up to 5TB

## Files Modified

### 1. New Presigned URL Endpoint
- **File**: `app/api/upload/presigned/route.ts`
- **Dependencies**: `@aws-sdk/s3-request-presigner` (installed)

### 2. Updated Dashboard Create Page
- **File**: `app/dashboard/create/page.tsx`
- **Changes**: 
  - Replaced FormData uploads with presigned URL flow
  - Added progress indicators for each step
  - Better error handling and user feedback

### 3. Test Upload Page
- **File**: `app/test-upload/page.tsx`
- **Purpose**: Test the new upload flow independently

## How It Works Now

```javascript
// OLD WAY (caused 413 error):
const formData = new FormData()
formData.append('file', videoFile) // 35MB file sent to Vercel
await fetch('/api/upload/r2', { body: formData })

// NEW WAY (no 413 error):
// Step 1: Get presigned URL (only metadata sent to Vercel)
const presignedResponse = await fetch('/api/upload/presigned', {
  body: JSON.stringify({ fileName, fileType, contentType }) // ~100 bytes
})

// Step 2: Upload directly to R2 (bypasses Vercel)
const { signedUrl } = await presignedResponse.json()
await fetch(signedUrl, { method: 'PUT', body: videoFile }) // 35MB file goes directly to R2
```

## Benefits

✅ **No More 413 Errors**: Large files bypass Vercel completely
✅ **Better Performance**: Direct upload to R2 is faster
✅ **Scalable**: Can handle files up to 5TB
✅ **Cost Effective**: No Vercel bandwidth charges for large uploads
✅ **Better UX**: Progress indicators and clearer status messages

## Testing

### 1. Test the New Upload Flow
Visit `/test-upload` to test the new system with any file size.

### 2. Test AR Experience Creation
Go to `/dashboard/create` and try uploading large video files.

### 3. Monitor Console Logs
Check browser console and Vercel logs for:
- `🔐 Generating presigned URL for direct upload`
- `✅ Presigned URL generated`
- `✅ File uploaded to R2`

## Environment Variables Required

Make sure these are set in your Vercel environment:
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=quickscanar
```

## What Happens Now

1. **User selects file** → Frontend validates file type/size
2. **Frontend requests presigned URL** → Sends only metadata to Vercel
3. **Vercel generates presigned URL** → Returns secure upload URL + file key
4. **Frontend uploads directly to R2** → File bypasses Vercel completely
5. **File available at public URL** → Ready for use in AR experiences

## Recent Updates

### Fixed R2 URL Configuration
- **Issue**: Hardcoded R2 public URL was incorrect
- **Solution**: Now dynamically generates public URLs using `https://pub-${CLOUDFLARE_ACCOUNT_ID}.r2.dev`
- **Result**: Presigned URLs and public URLs now match your actual R2 bucket configuration

### Added Debug Tools
- **New Endpoint**: `/api/upload/debug` - Shows R2 configuration and expected URLs
- **Enhanced Test Page**: `/test-upload` now includes R2 configuration checker
- **Better Logging**: Console logs show presigned URL data and upload responses

## Troubleshooting

### If you still get 413 errors:
- Check that you're using the new `/api/upload/presigned` endpoint
- Verify the old FormData upload code has been replaced
- Ensure the presigned URL is being used for the actual file upload

### If presigned URL generation fails:
- Check R2 environment variables
- Verify R2 bucket permissions
- Check Vercel function logs for detailed errors

### If direct upload to R2 fails:
- Check CORS settings on R2 bucket
- Verify presigned URL hasn't expired (15 minutes)
- Check file size limits on R2 bucket

### If presigned URLs point to wrong domain:
- **Use the debug endpoint**: Visit `/api/upload/debug` to check your R2 configuration
- **Verify environment variables**: Ensure `CLOUDFLARE_ACCOUNT_ID` is set correctly
- **Check R2 bucket settings**: Make sure your bucket is configured for public access
- **Expected format**: Public URLs should be `https://pub-{ACCOUNT_ID}.r2.dev/{filename}`

## Next Steps

1. **Test thoroughly** with various file sizes and types
2. **Monitor performance** and user experience
3. **Consider adding** upload progress bars for very large files
4. **Update documentation** for users about the new upload process

The 413 error should now be completely resolved! 🎉
