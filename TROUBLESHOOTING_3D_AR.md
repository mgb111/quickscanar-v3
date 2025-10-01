# 3D AR Troubleshooting Guide

## Common Issues and Solutions

### 🔴 Issue 1: "video_url violates not-null constraint"

**Error Message:**
```
null value in column "video_url" of relation "ar_experiences" violates not-null constraint
```

**Cause:** The `video_url` column has a NOT NULL constraint, but 3D AR experiences don't have videos.

**Solution A - Quick Fix:**
Run the fix script in Supabase SQL Editor:
```sql
-- File: fix-video-url-constraint.sql
ALTER TABLE ar_experiences 
ALTER COLUMN video_url DROP NOT NULL;
```

**Solution B - Complete Migration:**
Run the updated migration script which includes the fix:
```sql
-- File: add-3d-support.sql (updated version)
-- This now includes making video_url nullable
```

**Verify the fix:**
```sql
SELECT 
    column_name, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
AND column_name = 'video_url';

-- Should show: is_nullable = 'YES'
```

---

### 🔴 Issue 2: "Column does not exist: model_url"

**Error Message:**
```
column "model_url" of relation "ar_experiences" does not exist
```

**Cause:** The migration script hasn't been run yet.

**Solution:**
Run the migration script in Supabase SQL Editor:
```sql
-- File: add-3d-support.sql
```

**Verify:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
AND column_name IN ('model_url', 'content_type', 'model_scale', 'model_rotation');

-- Should return all 4 columns
```

---

### 🔴 Issue 3: 3D Model Not Appearing in AR

**Symptoms:**
- Camera works
- Marker detected
- But no 3D model appears

**Possible Causes & Solutions:**

#### A. File Format Issue
**Check:**
```javascript
// In browser console
console.log('Model URL:', experience.model_url);
console.log('File extension:', experience.model_url.split('.').pop());
```

**Solution:**
- Ensure file is `.glb` or `.gltf`
- GLB is recommended (binary, compressed)
- Convert other formats using [glTF Tools](https://github.com/KhronosGroup/glTF)

#### B. File Size Too Large
**Check:**
```sql
-- Check file sizes in your R2 bucket
SELECT 
    title,
    content_type,
    LENGTH(model_url) as url_length
FROM ar_experiences 
WHERE content_type = '3d';
```

**Solution:**
- Keep models under 10MB for best performance
- Compress models using [glTF-Pipeline](https://github.com/CesiumGS/gltf-pipeline)
- Reduce polygon count in Blender

#### C. Scale Too Small/Large
**Check:**
```sql
SELECT 
    title,
    model_scale,
    model_rotation
FROM ar_experiences 
WHERE content_type = '3d';
```

**Solution:**
- Try scale = 1.0 first
- If too small, increase to 2.0, 5.0, 10.0
- If too large, decrease to 0.5, 0.1

#### D. CORS Issue
**Check browser console for:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solution:**
Configure R2 bucket CORS:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

#### E. Model Not Loading
**Check browser console:**
```javascript
// Look for errors like:
// "Failed to load model"
// "Invalid glTF"
```

**Solution:**
- Validate GLB file using [glTF Validator](https://github.khronos.org/glTF-Validator/)
- Test with a known-good sample model first
- Check network tab for 404 or 403 errors

---

### 🔴 Issue 4: Model Facing Wrong Direction

**Symptoms:**
- Model appears but faces wrong way
- Model is sideways or upside down

**Solution:**
Adjust rotation in the create form:
```
0°   = Original orientation
90°  = Quarter turn right
180° = Half turn
270° = Quarter turn left
```

Or update directly in database:
```sql
UPDATE ar_experiences 
SET model_rotation = 180 
WHERE id = 'your-experience-id';
```

---

### 🔴 Issue 5: Model Too Small to See

**Symptoms:**
- Marker detected
- No visible model (but it might be there, just tiny)

**Solution:**
Increase scale dramatically:
```sql
UPDATE ar_experiences 
SET model_scale = 10.0 
WHERE id = 'your-experience-id';
```

Try scales: 1.0 → 5.0 → 10.0 → 20.0 until visible

---

### 🔴 Issue 6: Upload Fails for GLB Files

**Error Message:**
```
Unsupported content type
```

**Solution:**
The upload API expects specific content types. Update your upload:

```javascript
// Correct content type for GLB
const contentType = file.name.endsWith('.glb') 
  ? 'application/octet-stream' 
  : 'model/gltf+json';
```

---

### 🔴 Issue 7: Video AR Stopped Working

**Symptoms:**
- 3D AR works
- But video AR experiences show errors

**Cause:** Migration might have affected existing records.

**Solution:**
Ensure existing video experiences have correct content_type:
```sql
-- Fix existing video experiences
UPDATE ar_experiences 
SET content_type = 'video' 
WHERE video_url IS NOT NULL 
AND content_type IS NULL;
```

---

### 🔴 Issue 8: Constraint Violation on Create

**Error Message:**
```
new row violates check constraint "check_content_url"
```

**Cause:** The constraint ensures video_url OR model_url matches content_type.

**Solution:**
Check your API request:
```javascript
// For video AR
{
  content_type: 'video',
  video_file_url: 'https://...',  // REQUIRED
  model_url: null
}

// For 3D AR
{
  content_type: '3d',
  video_file_url: null,
  model_url: 'https://...'  // REQUIRED
}
```

---

### 🔴 Issue 9: 3D Model Animations Not Playing

**Symptoms:**
- Model appears correctly
- But animations from the GLB file don't play

**Possible Causes & Solutions:**

#### A. Model Has No Animations
**Check:**
- Open your GLB file in [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
- Look for "Animations" section
- Verify animations play in the viewer

**Solution:**
If no animations exist, you need to:
- Add animations in Blender/3D software
- Re-export as GLB with animations included
- Ensure "Export Animations" is checked

#### B. Animation-Mixer Not Configured
**Check browser console for:**
```
Animation mixer found
Available animations: [...]
```

**Solution:**
The animation-mixer component should be configured as:
```html
animation-mixer="clip: *; loop: repeat; clampWhenFinished: false"
```

This is now included in the updated code.

#### C. Animations Not Auto-Playing
**Solution:**
Animations should auto-play when the model loads. If not:

```javascript
// In browser console, manually trigger:
const model = document.querySelector('#model3D');
const mixer = model.components['animation-mixer'];
if (mixer && mixer.mixer) {
  mixer.mixer._actions.forEach(action => action.play());
}
```

#### D. Animation Speed Issues
**Check:**
- Some animations may be very slow or fast
- Check timeScale in the GLB file

**Solution:**
Adjust animation speed in your 3D software before export, or add to the component:
```html
animation-mixer="clip: *; loop: repeat; timeScale: 1.0"
```

#### E. Multiple Animations
**Issue:**
GLB has multiple animations but only one plays.

**Solution:**
Current implementation plays all animations with `clip: *`. To play specific animation:
```html
animation-mixer="clip: AnimationName; loop: repeat"
```

---

## Debugging Checklist

### Database
- [ ] Migration script executed successfully
- [ ] `video_url` is nullable
- [ ] `model_url` column exists
- [ ] `content_type` column exists
- [ ] `model_scale` column exists
- [ ] `model_rotation` column exists
- [ ] Constraint `check_content_url` exists

### API
- [ ] `/api/ar` accepts `content_type` parameter
- [ ] `/api/ar` accepts `model_url` parameter
- [ ] `/api/upload/r2` accepts `fileType: '3d'`
- [ ] Upload returns valid public URL

### Frontend
- [ ] Content type selector appears
- [ ] Can select "3D Model AR"
- [ ] 3D model upload field appears
- [ ] Scale and rotation inputs appear
- [ ] Form submits successfully

### AR Viewer
- [ ] Model URL loads in browser
- [ ] No CORS errors in console
- [ ] A-Frame scene initializes
- [ ] MindAR initializes
- [ ] Target detection works
- [ ] Model entity exists in DOM

---

## SQL Diagnostic Queries

### Check Schema
```sql
-- Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ar_experiences'
ORDER BY ordinal_position;
```

### Check Constraints
```sql
-- List all constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'ar_experiences'::regclass;
```

### Check Existing Data
```sql
-- See what content types exist
SELECT 
    content_type,
    COUNT(*) as count,
    COUNT(video_url) as has_video,
    COUNT(model_url) as has_model
FROM ar_experiences
GROUP BY content_type;
```

### Check Specific Experience
```sql
-- Debug a specific experience
SELECT 
    id,
    title,
    content_type,
    video_url IS NOT NULL as has_video,
    model_url IS NOT NULL as has_model,
    model_scale,
    model_rotation
FROM ar_experiences
WHERE id = 'your-experience-id';
```

---

## Browser Console Debugging

### Check Model Loading
```javascript
// In browser console on AR viewer page
console.log('Content Type:', contentType);
console.log('Model URL:', document.querySelector('#arModel')?.getAttribute('src'));
console.log('Model Entity:', document.querySelector('#model3D'));
```

### Check A-Frame Scene
```javascript
// Check if A-Frame loaded
console.log('A-Frame version:', AFRAME.version);

// Check if MindAR loaded
console.log('MindAR loaded:', typeof MINDAR !== 'undefined');

// Check scene
const scene = document.querySelector('a-scene');
console.log('Scene loaded:', !!scene);
console.log('Scene is:', scene.is);
```

### Check Target Detection
```javascript
// Listen for target events
const target = document.querySelector('#target');
target.addEventListener('targetFound', () => {
  console.log('✅ Target found!');
});
target.addEventListener('targetLost', () => {
  console.log('❌ Target lost!');
});
```

---

## Performance Issues

### Model Loads Slowly
**Solutions:**
1. Compress model with [glTF-Pipeline](https://github.com/CesiumGS/gltf-pipeline)
2. Reduce texture sizes
3. Use GLB instead of GLTF
4. Remove unused animations
5. Optimize in Blender before export

### AR Experience Laggy
**Solutions:**
1. Reduce model polygon count
2. Use simpler materials
3. Remove complex animations
4. Test on target device
5. Consider multiple quality tiers

---

## Getting Help

If you're still stuck:

1. **Check Browser Console**
   - Look for red errors
   - Check network tab for failed requests

2. **Verify Sample Works**
   - Test with [Duck.glb](https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/Duck/glTF-Binary/Duck.glb)
   - If sample works, issue is with your model

3. **Test Model Separately**
   - Use [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
   - Verify model loads correctly

4. **Check Documentation**
   - Review `3D_AR_FEATURE_GUIDE.md`
   - Review `3D_AR_SETUP.md`

5. **Database State**
   - Run diagnostic queries above
   - Verify migration completed

---

## Quick Fixes Reference

```sql
-- Make video_url nullable
ALTER TABLE ar_experiences ALTER COLUMN video_url DROP NOT NULL;

-- Fix existing video experiences
UPDATE ar_experiences SET content_type = 'video' WHERE video_url IS NOT NULL;

-- Reset a 3D experience scale
UPDATE ar_experiences SET model_scale = 1.0 WHERE id = 'your-id';

-- Reset a 3D experience rotation
UPDATE ar_experiences SET model_rotation = 0 WHERE id = 'your-id';

-- Check if migration completed
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'ar_experiences' 
AND column_name IN ('model_url', 'content_type', 'model_scale', 'model_rotation');
-- Should return: 4
```

---

**Still having issues?** Review the error message carefully and match it to the issues above. Most problems are related to database schema, file formats, or CORS configuration.
