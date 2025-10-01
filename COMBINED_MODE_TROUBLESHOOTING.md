# Combined Mode Troubleshooting (Video + 3D)

## Issue: Neither Video nor 3D Model Working When Both Uploaded

### Common Causes

#### 1. **JavaScript Logic Mismatch**
**Problem:** The `isVideo` and `is3D` flags weren't checking for `'both'` content type.

**Fixed:**
```javascript
// Before (WRONG)
const isVideo = contentType === 'video';
const is3D = contentType === '3d';

// After (CORRECT)
const isVideo = contentType === 'video' || contentType === 'both';
const is3D = contentType === '3d' || contentType === 'both';
```

#### 2. **Overlapping Positions**
**Problem:** 3D model at `position="0 0 0"` was behind the video plane.

**Fixed:**
```javascript
// 3D model position when both are present
position="0 0.3 0.15"  // Raised up and forward

// Video stays at
position="0 0 0.01"    // Flat on marker
```

#### 3. **Content Type Not Set to 'both'**
**Problem:** Frontend determines content type, but might not be set correctly.

**Check:**
```javascript
// In create page
let determinedContentType = 'video'
if (videoUrl && modelUrl) {
  determinedContentType = 'both'  // ✅ Must be 'both'
}
```

---

## Debugging Steps

### Step 1: Check Browser Console

Open browser console and look for:

```javascript
// Should see:
AR Elements found: {
  contentType: "both",    // ✅ Should be "both"
  isVideo: true,          // ✅ Should be true
  is3D: true,             // ✅ Should be true
  video: true,            // ✅ Video element exists
  model3D: true,          // ✅ Model element exists
  videoUrl: "present",    // ✅ Video URL exists
  modelUrl: "present"     // ✅ Model URL exists
}

// Should also see:
🎬 Combined AR mode - Both video and 3D model will appear together
Video plane at z: 0.01, 3D model at y: 0.3, z: 0.15
```

### Step 2: Check Database

```sql
SELECT 
  id,
  title,
  content_type,
  video_url IS NOT NULL as has_video,
  model_url IS NOT NULL as has_model
FROM ar_experiences
WHERE id = 'your-experience-id';

-- Should return:
-- content_type: 'both'
-- has_video: true
-- has_model: true
```

### Step 3: Check A-Frame Scene

In browser console:
```javascript
// Check if both elements exist
const video = document.querySelector('#arVideo');
const model = document.querySelector('#model3D');
const videoPlane = document.querySelector('#videoPlane');

console.log('Video element:', video);
console.log('Model element:', model);
console.log('Video plane:', videoPlane);

// All should exist when content_type = 'both'
```

### Step 4: Check Target Found Event

```javascript
// In console, when target is found, should see:
Target found!
Playing model animations
✅ Target Found! AR content should be visible
```

---

## Common Issues & Solutions

### Issue 1: Only Video Shows, No 3D Model

**Symptoms:**
- Video plays correctly
- 3D model doesn't appear
- Console shows `is3D: false`

**Cause:** JavaScript logic not checking for 'both'

**Solution:**
```javascript
// Ensure this in the AR viewer
const is3D = contentType === '3d' || contentType === 'both';
```

**Verify:**
```javascript
// In console
console.log(contentType);  // Should be 'both'
console.log(is3D);         // Should be true
```

---

### Issue 2: Only 3D Model Shows, No Video

**Symptoms:**
- 3D model appears correctly
- Video doesn't play
- Console shows `isVideo: false`

**Cause:** JavaScript logic not checking for 'both'

**Solution:**
```javascript
// Ensure this in the AR viewer
const isVideo = contentType === 'video' || contentType === 'both';
```

**Verify:**
```javascript
// In console
console.log(contentType);  // Should be 'both'
console.log(isVideo);      // Should be true
```

---

### Issue 3: Neither Shows

**Symptoms:**
- Nothing appears when marker detected
- Console shows elements exist
- No errors

**Possible Causes:**

**A. Content Type Wrong**
```javascript
// Check in console
console.log(contentType);
// If it's 'video' or '3d' instead of 'both', 
// the database wasn't updated correctly
```

**B. Visibility Not Set**
```javascript
// Check visibility on target found
const videoPlane = document.querySelector('#videoPlane');
const model3D = document.querySelector('#model3D');

console.log('Video visible:', videoPlane?.getAttribute('visible'));
console.log('Model visible:', model3D?.getAttribute('visible'));
// Both should be 'true' after target found
```

**C. Z-Fighting (Overlapping)**
```javascript
// Check positions
const model3D = document.querySelector('#model3D');
console.log('Model position:', model3D?.getAttribute('position'));
// Should be: {x: 0, y: 0.3, z: 0.15} when content_type = 'both'
```

---

### Issue 4: 3D Model Behind Video

**Symptoms:**
- Both render but 3D model not visible
- Video blocks 3D model

**Cause:** Z-position conflict

**Solution:**
The code now automatically adjusts position when `content_type = 'both'`:
```javascript
position="0 ${contentType === 'both' ? '0.3' : '0'} ${contentType === 'both' ? '0.15' : '0'}"
```

**Manual Override:**
If needed, adjust in database:
```sql
UPDATE ar_experiences 
SET model_scale = 0.5  -- Make smaller
WHERE id = 'your-id';
```

---

### Issue 5: Content Type Not 'both'

**Symptoms:**
- Uploaded both files
- Database shows `content_type = 'video'` or `'3d'`

**Cause:** Frontend logic didn't set it correctly

**Check Frontend:**
```typescript
// In app/dashboard/create/page.tsx
let determinedContentType = 'video'
if (videoUrl && modelUrl) {
  determinedContentType = 'both'  // This should execute
}
```

**Manual Fix:**
```sql
UPDATE ar_experiences 
SET content_type = 'both'
WHERE id = 'your-id'
AND video_url IS NOT NULL 
AND model_url IS NOT NULL;
```

---

## Testing Checklist

### Before Creating Experience
- [ ] Upload video file
- [ ] Upload 3D model file
- [ ] Upload marker image
- [ ] Upload mind file
- [ ] See both previews

### After Creating Experience
- [ ] Check database: `content_type = 'both'`
- [ ] Check database: `video_url` is not null
- [ ] Check database: `model_url` is not null
- [ ] Open AR experience
- [ ] Check console: `contentType: "both"`
- [ ] Check console: `isVideo: true`
- [ ] Check console: `is3D: true`
- [ ] Point at marker
- [ ] Video plays
- [ ] 3D model appears
- [ ] Both visible simultaneously

---

## Positioning Guide

### Default Positions (content_type = 'both')

```
Z-axis (depth, away from marker):
│
├─ 0.15 ← 3D Model (front)
├─ 0.01 ← Video Plane
├─ 0.005 ← Background Plane
└─ 0.00 ← Marker Surface

Y-axis (vertical):
│
├─ 0.3 ← 3D Model (raised up)
└─ 0.0 ← Video Plane (on marker)

X-axis (horizontal):
    0 ← Both centered
```

### Adjusting Positions

**Make 3D Model Higher:**
```javascript
// Increase Y value
position="0 0.5 0.15"  // Was 0.3
```

**Make 3D Model Further Forward:**
```javascript
// Increase Z value
position="0 0.3 0.3"  // Was 0.15
```

**Make 3D Model Smaller:**
```sql
UPDATE ar_experiences 
SET model_scale = 0.5  -- Half size
WHERE id = 'your-id';
```

---

## Console Commands for Debugging

### Check Content Type
```javascript
const scene = document.querySelector('a-scene');
console.log('Content type:', '${contentType}');
```

### Check Elements Exist
```javascript
console.log('Video:', !!document.querySelector('#arVideo'));
console.log('Model:', !!document.querySelector('#model3D'));
console.log('Video Plane:', !!document.querySelector('#videoPlane'));
```

### Check Visibility
```javascript
const videoPlane = document.querySelector('#videoPlane');
const model3D = document.querySelector('#model3D');
console.log('Video visible:', videoPlane?.getAttribute('visible'));
console.log('Model visible:', model3D?.getAttribute('visible'));
```

### Manually Show Both
```javascript
// Force show video
const videoPlane = document.querySelector('#videoPlane');
videoPlane?.setAttribute('visible', 'true');

// Force show model
const model3D = document.querySelector('#model3D');
model3D?.setAttribute('visible', 'true');
```

### Check Positions
```javascript
const model3D = document.querySelector('#model3D');
console.log('Model position:', model3D?.getAttribute('position'));
console.log('Model scale:', model3D?.getAttribute('scale'));
```

---

## Summary of Fixes

✅ **Fixed JavaScript Logic**
```javascript
const isVideo = contentType === 'video' || contentType === 'both';
const is3D = contentType === '3d' || contentType === 'both';
```

✅ **Fixed 3D Model Position**
```javascript
position="0 ${contentType === 'both' ? '0.3' : '0'} ${contentType === 'both' ? '0.15' : '0'}"
```

✅ **Added Debug Logging**
```javascript
console.log('🎬 Combined AR mode - Both video and 3D model will appear together');
```

✅ **Updated Database Constraint**
```sql
CHECK (
  (content_type = 'both' AND video_url IS NOT NULL AND model_url IS NOT NULL)
)
```

---

## Still Not Working?

1. **Clear browser cache** and reload
2. **Check browser console** for errors
3. **Verify database** has correct content_type
4. **Test with sample files** (known-good video + 3D model)
5. **Try video-only** first, then 3D-only, then both
6. **Check file URLs** are accessible (not 404)

---

**Both video and 3D should now work together!** 🎬📦✨
