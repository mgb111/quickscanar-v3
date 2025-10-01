# Video Preview Troubleshooting

## Issue: Video Shows White/Blank in Preview

### Common Causes

#### 1. **Video Codec Not Supported**
Some video codecs may not be supported by the browser for preview.

**Supported formats:**
- ✅ H.264 (MP4) - Best compatibility
- ✅ VP8/VP9 (WebM) - Good compatibility
- ⚠️ HEVC (H.265) - Limited browser support
- ❌ ProRes, DNxHD - Not supported in browsers

**Solution:**
Convert video to H.264 MP4 format using:
- [HandBrake](https://handbrake.fr/) (free)
- [FFmpeg](https://ffmpeg.org/)
- Online converters

#### 2. **Video File Corrupted**
The video file might be partially uploaded or corrupted.

**Check:**
- Can you play the video in VLC or other media player?
- Is the file size correct?
- Did the upload complete?

**Solution:**
- Re-upload the video
- Try a different video file
- Check file integrity

#### 3. **Browser Compatibility**
Some browsers have stricter video requirements.

**Test in different browsers:**
- Chrome/Edge (best support)
- Firefox (good support)
- Safari (may have codec issues)

#### 4. **Video Resolution Too High**
Very high resolution videos may not preview well.

**Recommended:**
- Max resolution: 1920x1080 (Full HD)
- For preview: 1280x720 (HD) is ideal
- Mobile: 854x480 (SD) works best

---

## Fixes Applied

### 1. Added Error Handling
```tsx
onError={(e) => {
  console.error('Video error:', e);
  setVideoError(true);
}}
```

If video fails to load, shows fallback message instead of blank screen.

### 2. Improved Loading
```tsx
preload="metadata"
onLoadedData={(e) => {
  video.play().catch(err => console.error('Play error:', err));
}}
```

Ensures video metadata loads before attempting to play.

### 3. Better Display
```tsx
style={{ objectFit: 'contain' }}
className="bg-black"
```

- `objectFit: contain` - Video fits within container
- `bg-black` - Black background (not white)

### 4. Key Prop
```tsx
key={videoPreviewUrl}
```

Forces video element to re-render when URL changes.

---

## What You'll See Now

### If Video Loads Successfully
```
┌─────────────────────────┐
│  [Playing Video]        │
│                         │
│  ▶ Controls             │
└─────────────────────────┘
Preview - Click to play
```

### If Video Fails to Load
```
┌─────────────────────────┐
│ Video Preview           │
│ Unavailable             │
│                         │
│ File: video.mp4         │
│ Video will still work   │
│ in AR                   │
└─────────────────────────┘
```

---

## Debug Steps

### Step 1: Check Browser Console
Open browser console (F12) and look for:

```javascript
// Success
Video loaded: 1920 x 1080

// Error
Video error: [error details]
Play error: [error details]
```

### Step 2: Check Video File
```javascript
// In console
const video = document.querySelector('video');
console.log('Video source:', video.src);
console.log('Video ready state:', video.readyState);
console.log('Video error:', video.error);
```

### Step 3: Test Video URL
```javascript
// Copy blob URL from console
// Paste in new browser tab
// Should download/play the video
```

---

## Workarounds

### Option 1: Skip Preview
The preview is just for convenience. Even if preview doesn't work:
- ✅ Video will still upload
- ✅ Video will still work in AR
- ✅ You can create the experience

### Option 2: Convert Video
If preview consistently fails:

**Using FFmpeg:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k output.mp4
```

**Using HandBrake:**
1. Open HandBrake
2. Load your video
3. Select "Web" preset
4. Click "Start"

### Option 3: Use Different Video
Try with a known-good video:
- Download a sample MP4 from internet
- Test if preview works
- If yes, issue is with your original video

---

## Video Requirements

### For Best Preview
```
Format: MP4 (H.264)
Resolution: 1280x720 or 1920x1080
Frame Rate: 24, 25, or 30 fps
Bitrate: 2-5 Mbps
Audio: AAC, 128-192 kbps
```

### For AR Playback
```
Format: MP4, WebM, MOV
Max Size: 100MB
Resolution: Any (but lower is better for mobile)
```

---

## Console Logs to Check

### Video Loaded Successfully
```javascript
Video loaded: 1920 x 1080
```

### Video Error
```javascript
Video error: MediaError { code: 4 }
// Code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
```

### Play Error
```javascript
Play error: NotAllowedError: play() failed
// Usually means autoplay blocked
```

---

## Browser-Specific Issues

### Chrome/Edge
- Usually works well
- May block autoplay without user interaction
- Check: chrome://settings/content/sound

### Firefox
- Good H.264 support
- May have issues with some MOV files
- Try MP4 instead

### Safari
- Strict codec requirements
- Prefers H.264 baseline profile
- May not support WebM

---

## Summary

✅ **Video preview now has:**
- Error handling (shows message if fails)
- Better loading (preload metadata)
- Proper display (objectFit: contain)
- Console logging (for debugging)

✅ **If preview doesn't work:**
- Video will still work in AR
- Check console for errors
- Try converting to H.264 MP4
- Test with different video

✅ **Best practice:**
- Use H.264 MP4 format
- Keep resolution at 1080p or lower
- Test video in media player first
- Check file size under 100MB

The preview is a convenience feature - even if it doesn't work, your video will still work perfectly in the AR experience! 🎬✨
