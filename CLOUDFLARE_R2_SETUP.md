# 🚀 Cloudflare R2 Setup Guide for QuickScanAR

## **Overview**
This guide will help you set up Cloudflare R2 object storage to replace Supabase storage for your AR video and mind files. R2 provides 10GB of free storage with no monthly limits.

## **🎯 Step 1: Create Cloudflare Account**
1. Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Sign up or sign in to your Cloudflare account

## **🎯 Step 2: Get Your Account ID**
1. In your Cloudflare dashboard, look at the **right sidebar**
2. You'll see your **Account ID** (32-character string like `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
3. **Copy this Account ID** - this is your `CLOUDFLARE_ACCOUNT_ID`

## **🎯 Step 3: Create R2 Bucket**
1. In your Cloudflare dashboard, go to **R2 Object Storage** (left sidebar)
2. Click **Create bucket**
3. **Bucket name**: `quickscanar` (exactly as shown)
4. **Important**: Check ✅ **"Public bucket"** option
5. Click **Create bucket**

## **🎯 Step 3.5: Get Your Public URL**
1. Click on your `quickscanar` bucket
2. Go to **Settings** tab
3. Look for **"Public access"** section
4. **Copy the public URL** (format: `https://pub-xxxxxxxx.r2.dev`)
5. **Save this URL** - you'll need it for your environment variables

## **🎯 Step 4: Configure CORS for AR Files**
**CRITICAL**: You must set CORS rules for your R2 bucket to allow AR files to load properly.

1. In your R2 bucket, go to **Settings** → **CORS**
2. Click **Add CORS rule**
3. Add this CORS rule:
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET", "HEAD"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }
   ```
4. Click **Save**

## **🎯 Step 5: Create API Token**
1. In R2 Object Storage, click **Manage R2 API tokens**
2. Click **Create API token**
3. **Select "Custom token"**
4. **Permissions:**
   - ✅ Object Read
   - ✅ Object Write
   - ✅ Bucket Read
5. **Resources:** Include All accounts
6. Click **Create API Token**
7. **Copy both values:**
   - `CLOUDFLARE_ACCESS_KEY_ID` = Access Key ID
   - `CLOUDFLARE_SECRET_ACCESS_KEY` = Secret Access Key

## **🎯 Step 6: Add to Environment Variables**
Add these to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_32_character_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET_NAME=quickscanar

# Your Public R2 URL (from bucket Settings → Public access)
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev
```

## **🎯 Step 7: Test Your Setup**
1. Start your development server: `npm run dev`
2. Go to `/dashboard/create`
3. Try uploading a video file
4. Check the console for R2 upload logs

## **🔧 How It Works**
- **Video files** are uploaded to: `https://pub-xxxxxxxx.r2.dev/video-{timestamp}-{id}.mp4`
- **Mind files** are uploaded to: `https://pub-xxxxxxxx.r2.dev/mind-{timestamp}-{id}.mp4`
- **Get your public URL** from R2 bucket Settings → Public access
- **File size limit**: 100MB per file
- **Supported video formats**: MP4, WebM, OGG, AVI, MOV, QuickTime

## **✅ Benefits of R2**
- **10GB free storage** (vs Supabase's 500MB-1GB)
- **No monthly storage limits**
- **Global CDN** for fast video delivery
- **No egress fees**
- **S3-compatible API**

## **🚨 Troubleshooting**
- **"Missing environment variables"**: Check all 4 R2 variables are set
- **"Access denied"**: Verify your API token has correct permissions
- **"Bucket not found"**: Ensure bucket name is exactly `quickscanar`
- **"File too large"**: Check file size is under 100MB
- **"Failed to fetch mind file"**: Make sure CORS is configured in R2 bucket settings

## **📱 Next Steps**
After setup:
1. Your video uploads will go directly to R2
2. No more Supabase storage quota issues
3. Faster video loading with Cloudflare's global network
4. Better scalability for your AR platform

## **🔗 Useful Links**
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/platform/pricing/)
- [QuickScanAR R2 Integration](https://quickscanar.com)
