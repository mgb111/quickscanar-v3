# Combined Video + 3D AR Feature

## 🎉 New Feature: Upload Video AND 3D Model Together!

### Overview
Users can now create AR experiences with:
- **Video only** - Traditional video AR
- **3D model only** - 3D object AR
- **Both video + 3D model** - Combined AR experience! ⭐ NEW

---

## What's New

### Previous Behavior
- Had to choose between video OR 3D model
- Content type selector forced one choice
- Couldn't combine both in same experience

### New Behavior
- Upload video, 3D model, or **both**
- No forced choice - flexible uploads
- Both content types appear together in AR
- Live previews for both simultaneously

---

## Content Type Options

| Content Type | Video | 3D Model | Use Case |
|--------------|-------|----------|----------|
| **video** | ✅ Required | ❌ None | Video-only AR (product demos, tutorials) |
| **3d** | ❌ None | ✅ Required | 3D-only AR (product visualization, models) |
| **both** | ✅ Required | ✅ Required | Combined AR (video background + 3D overlay) |

---

## How It Works

### 1. Upload Flow

```
User uploads files:
├── Video file (optional)
├── 3D model file (optional)
├── Marker image (required)
└── Mind file (required)

System determines content_type:
├── If video only → content_type = 'video'
├── If 3D only → content_type = '3d'
└── If both → content_type = 'both'
```

### 2. Validation

**At least ONE is required:**
- Video file OR
- 3D model file OR
- Both

**Always required:**
- Marker image
- Mind file
- Title

### 3. AR Rendering

**Video Only:**
```html
<a-plane material="src: #arVideo" />
```

**3D Only:**
```html
<a-entity gltf-model="#arModel" />
```

**Both (Combined):**
```html
<a-plane material="src: #arVideo" position="0 0 0.01" />
<a-entity gltf-model="#arModel" position="0 0 0.02" />
```
*3D model appears in front of video*

---

## UI Changes

### Before
```tsx
// Content type selector (forced choice)
<button onClick={() => setContentType('video')}>Video AR</button>
<button onClick={() => setContentType('3d')}>3D AR</button>

// Conditional uploads
{contentType === 'video' && <VideoUpload />}
{contentType === '3d' && <ModelUpload />}
```

### After
```tsx
// Info banner (no forced choice)
<InfoBanner>
  Upload video, 3D model, or both!
</InfoBanner>

// Both uploads always visible
<VideoUpload /> // Optional
<ModelUpload /> // Optional

// Settings appear when model uploaded
{modelFile && <ModelSettings />}
```

---

## Database Schema

### Content Type Values
```sql
content_type TEXT CHECK (content_type IN ('video', '3d', 'both'))
```

### Constraints
```sql
CHECK (
    (content_type = 'video' AND video_url IS NOT NULL) OR
    (content_type = '3d' AND model_url IS NOT NULL) OR
    (content_type = 'both' AND video_url IS NOT NULL AND model_url IS NOT NULL)
)
```

---

## API Changes

### Request Body
```json
{
  "title": "My AR Experience",
  "video_file_url": "https://...",  // Optional
  "model_url": "https://...",       // Optional
  "content_type": "both",           // Auto-determined
  "model_scale": 1.5,
  "model_rotation": 90,
  "mind_file_url": "https://...",
  "marker_image_url": "https://...",
  "user_id": "uuid"
}
```

### Content Type Determination
```typescript
let contentType = 'video' // default
if (videoUrl && modelUrl) {
  contentType = 'both'
} else if (modelUrl && !videoUrl) {
  contentType = '3d'
} else if (videoUrl && !modelUrl) {
  contentType = 'video'
}
```

### AR Viewer Logic
```typescript
const isVideo = contentType === 'video' || contentType === 'both'
const is3D = contentType === '3d' || contentType === 'both'

// Render video if isVideo
// Render 3D if is3D
// Both render if contentType === 'both'
```

---

## Preview Feature

### Video Preview
- Live video player
- Playback controls
- Shows for video-only and combined experiences

### 3D Model Preview
- Interactive 3D viewer
- Drag to rotate
- Shows for 3D-only and combined experiences

### Combined Preview
When both are uploaded:
```
┌─────────────────────┐
│   Video Preview     │
│  [video player]     │
└─────────────────────┘
┌─────────────────────┐
│   3D Model Preview  │
│  [3D viewer]        │
└─────────────────────┘
```

---

## Use Cases

### 1. Video Only
**Example:** Product tutorial
- Upload: Tutorial video
- Result: Video plays on marker

### 2. 3D Model Only
**Example:** Product showcase
- Upload: 3D product model
- Result: 3D model appears on marker

### 3. Combined (Video + 3D) ⭐
**Example:** Interactive product demo
- Upload: Background video + 3D product model
- Result: Video plays with 3D model overlay
- **Perfect for:** Product launches, interactive ads, museum exhibits

---

## File Requirements

| File Type | Required? | Max Size | Formats |
|-----------|-----------|----------|---------|
| Video | Optional* | 100MB | MP4, WebM, MOV |
| 3D Model | Optional* | 50MB | GLB, GLTF |
| Marker Image | **Required** | 10MB | JPG, PNG, WebP |
| Mind File | **Required** | No limit | .mind |

*At least one (video or 3D model) is required

---

## Implementation Details

### Files Modified

**Frontend:**
- `app/dashboard/create/page.tsx`
  - Removed content type selector
  - Made both uploads optional
  - Added info banner
  - Dynamic content type determination
  - Conditional model settings

**Backend:**
- `app/api/ar/route.ts`
  - Added 'both' validation
  - Updated constraints
  - Dynamic content type handling

- `app/api/ar/[id]/route.ts`
  - Updated isVideo/is3D logic
  - Renders both when content_type = 'both'

**Database:**
- `add-3d-support.sql`
  - Added 'both' to content_type enum
  - Updated check constraints
  - Supports combined experiences

---

## Testing

### Test Case 1: Video Only
```
1. Upload video file
2. Skip 3D model
3. Upload marker + mind
4. Create experience
✅ content_type = 'video'
✅ Only video appears in AR
```

### Test Case 2: 3D Only
```
1. Skip video file
2. Upload 3D model
3. Upload marker + mind
4. Create experience
✅ content_type = '3d'
✅ Only 3D model appears in AR
```

### Test Case 3: Combined ⭐
```
1. Upload video file
2. Upload 3D model
3. Upload marker + mind
4. Create experience
✅ content_type = 'both'
✅ Both video and 3D appear in AR
✅ 3D model in front of video
```

### Test Case 4: Neither
```
1. Skip video file
2. Skip 3D model
3. Try to submit
❌ Error: "Please upload at least a video file or a 3D model file (or both)"
```

---

## Benefits

### For Users
1. **Maximum Flexibility** - Choose what works best
2. **Creative Freedom** - Combine video + 3D
3. **No Forced Choices** - Upload what you need
4. **Live Previews** - See both before creating
5. **Rich Experiences** - More engaging AR content

### For Creators
1. **Video Background + 3D Foreground** - Layered content
2. **Storytelling** - Video context + 3D interaction
3. **Product Demos** - Video explanation + 3D product
4. **Educational** - Video lecture + 3D model
5. **Marketing** - Video ad + 3D call-to-action

---

## Examples

### Example 1: Product Launch
```
Video: Brand story/announcement
3D Model: New product
Result: Video plays with product floating above
```

### Example 2: Museum Exhibit
```
Video: Historical context
3D Model: Artifact reconstruction
Result: Educational AR experience
```

### Example 3: Real Estate
```
Video: Neighborhood tour
3D Model: House model
Result: Context + interactive model
```

### Example 4: Education
```
Video: Teacher explanation
3D Model: Anatomical model
Result: Lecture + interactive learning
```

---

## Migration Guide

### Existing Experiences
All existing experiences continue to work:
- Video-only experiences: `content_type = 'video'`
- 3D-only experiences: `content_type = '3d'`
- No changes needed

### New Experiences
Can now be:
- Video-only: Upload just video
- 3D-only: Upload just 3D model
- Combined: Upload both

---

## Summary

✅ **Flexible Uploads** - Video, 3D, or both  
✅ **No Forced Choice** - Upload what you need  
✅ **Live Previews** - See both simultaneously  
✅ **Combined AR** - Video + 3D together  
✅ **Backward Compatible** - Existing experiences work  
✅ **Creative Freedom** - Unlimited possibilities  

Users can now create the most engaging AR experiences by combining video and 3D content! 🎉🚀
