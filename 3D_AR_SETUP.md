# 3D AR Feature - Quick Setup Guide

## 🚀 Quick Start

Follow these steps to enable 3D AR support in your QuickScanAR application.

## Step 1: Database Migration

Run the SQL migration to add 3D support to your database:

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `add-3d-support.sql`
4. Execute the SQL script
5. Verify success - you should see: ✅ 3D model support added successfully!

**What this does:**
- Adds `model_url` column for 3D model files
- Adds `content_type` column to distinguish video/3D
- Adds `model_scale` column for size adjustment
- Adds `model_rotation` column for orientation
- Creates index for faster queries

## Step 2: Verify Changes

Check that all changes are in place:

```sql
-- Verify new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'ar_experiences'
AND column_name IN ('model_url', 'content_type', 'model_scale', 'model_rotation');
```

Expected output:
```
model_url       | text    | NULL
content_type    | text    | 'video'
model_scale     | numeric | 1.0
model_rotation  | integer | 0
```

## Step 3: Test the Feature

### Option A: Test with Video AR (Existing Feature)

1. Navigate to `/dashboard/create`
2. Select **"Video AR"** content type
3. Upload a video file
4. Upload marker image and .mind file
5. Create experience
6. Test on mobile device

### Option B: Test with 3D AR (New Feature)

1. Navigate to `/dashboard/create`
2. Select **"3D Model AR"** content type
3. Download a sample GLB file:
   - [Duck.glb](https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/Duck/glTF-Binary/Duck.glb)
   - [Avocado.glb](https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/Avocado/glTF-Binary/Avocado.glb)
4. Upload the GLB file
5. Set scale to **1.0** and rotation to **0**
6. Upload marker image and .mind file
7. Create experience
8. Test on mobile device

## Step 4: Configure Settings (Optional)

### Model Scale
- **0.5** = Half size (smaller)
- **1.0** = Original size (default)
- **2.0** = Double size (larger)

### Model Rotation
- **0°** = Original orientation
- **90°** = Quarter turn
- **180°** = Half turn
- **270°** = Three-quarter turn

## Step 5: Deploy

All code changes are already in place. Just ensure:

1. ✅ Database migration completed
2. ✅ R2 bucket CORS configured for GLB/GLTF files
3. ✅ Application redeployed (if needed)

## Troubleshooting

### Issue: "video_url violates not-null constraint"

**Solution:** The `video_url` column needs to be nullable for 3D AR. Run the fix script:

```bash
# Execute in Supabase SQL Editor
# File: fix-video-url-constraint.sql
```

Or manually:
```sql
ALTER TABLE ar_experiences 
ALTER COLUMN video_url DROP NOT NULL;
```

### Issue: "Column does not exist" error

**Solution:** Run the database migration script again.

```sql
-- Check if migration was successful
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_name = 'ar_experiences' 
  AND column_name = 'model_url'
);
```

### Issue: 3D model not uploading

**Solution:** Check R2 bucket configuration:

1. Verify `CLOUDFLARE_ACCOUNT_ID` is set
2. Verify `CLOUDFLARE_ACCESS_KEY_ID` is set
3. Verify `CLOUDFLARE_SECRET_ACCESS_KEY` is set
4. Check bucket CORS allows GLB/GLTF files

### Issue: Model not appearing in AR

**Solution:** Check these common issues:

1. **File format**: Must be `.glb` or `.gltf`
2. **File size**: Must be under 50MB
3. **Scale**: Try adjusting between 0.5 - 2.0
4. **Browser console**: Check for JavaScript errors
5. **Mobile device**: Ensure camera permissions granted

### Issue: Model too small/large

**Solution:** Adjust the model scale:

- Model barely visible? Increase scale to 2.0 or higher
- Model too large? Decrease scale to 0.5 or lower
- Start with 1.0 and adjust by 0.5 increments

### Issue: Model facing wrong direction

**Solution:** Adjust the rotation:

- Try 90° increments (0, 90, 180, 270)
- Y-axis rotation turns the model horizontally
- Most models face forward at 0° or 180°

## Testing Checklist

- [ ] Database migration completed successfully
- [ ] Can select "Video AR" content type
- [ ] Can select "3D Model AR" content type
- [ ] Can upload video files (for Video AR)
- [ ] Can upload GLB files (for 3D AR)
- [ ] Can upload GLTF files (for 3D AR)
- [ ] Can adjust model scale
- [ ] Can adjust model rotation
- [ ] Video AR experiences work on mobile
- [ ] 3D AR experiences work on mobile
- [ ] Models appear at correct scale
- [ ] Models appear at correct rotation
- [ ] Smooth animations when target found/lost

## Next Steps

1. **Create your first 3D AR experience**
   - Find a GLB model you like
   - Upload it with a marker image
   - Test on your mobile device

2. **Optimize for performance**
   - Keep models under 10MB
   - Use compressed GLB format
   - Test on target devices

3. **Share with users**
   - Generate QR codes for experiences
   - Share AR experience links
   - Collect feedback

## Resources

- **Sample 3D Models**: [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
- **Free Models**: [Sketchfab](https://sketchfab.com/features/gltf)
- **Documentation**: See `3D_AR_FEATURE_GUIDE.md` for detailed info
- **A-Frame Docs**: [aframe.io](https://aframe.io/docs/)
- **MindAR Docs**: [MindAR](https://hiukim.github.io/mind-ar-js-doc/)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review the troubleshooting section above
3. Verify database migration completed
4. Test with sample GLB files first
5. Check R2 bucket configuration

---

**🎉 You're all set!** Start creating amazing 3D AR experiences!
