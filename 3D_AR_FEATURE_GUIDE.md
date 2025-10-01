# 3D AR Feature Guide

## Overview

QuickScanAR now supports **both Video AR and 3D Model AR** experiences! Users can choose to display either videos or 3D models when their camera detects a marker image.

## What's New

### Content Types
- **Video AR**: Display videos overlaid on marker images (existing feature)
- **3D Model AR**: Display interactive 3D models on marker images (NEW!)

### Supported 3D Formats
- **GLB** (GL Transmission Format Binary) - Recommended
- **GLTF** (GL Transmission Format JSON)

## Database Changes

### New Columns in `ar_experiences` Table

Run the SQL migration file `add-3d-support.sql` to add:

```sql
-- New columns
model_url TEXT              -- URL to the 3D model file (GLB/GLTF)
content_type TEXT           -- 'video' or '3d'
model_scale DECIMAL         -- Scale factor for 3D models (default: 1.0)
model_rotation INTEGER      -- Y-axis rotation in degrees (default: 0)
```

### Migration Steps

1. Run the SQL migration in your Supabase SQL editor:
   ```bash
   # Execute: add-3d-support.sql
   ```

2. Verify the columns were added:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'ar_experiences';
   ```

## API Changes

### POST `/api/ar` - Create AR Experience

**New Request Body Fields:**
```json
{
  "title": "My 3D AR Experience",
  "content_type": "3d",           // NEW: 'video' or '3d'
  "model_url": "https://...",     // NEW: URL to GLB/GLTF file
  "model_scale": 1.5,             // NEW: Scale factor (optional, default: 1.0)
  "model_rotation": 90,           // NEW: Rotation in degrees (optional, default: 0)
  "video_file_url": null,         // Only required if content_type is 'video'
  "mind_file_url": "https://...",
  "marker_image_url": "https://...",
  "user_id": "uuid",
  "link_url": "https://..."       // Optional
}
```

### GET `/api/ar/[id]` - View AR Experience

The AR viewer now automatically detects `content_type` and renders either:
- Video plane (for video AR)
- 3D model entity (for 3D AR)

## Upload API Changes

### POST `/api/upload/r2` - Upload Files

**New File Type Support:**
```json
{
  "fileName": "model.glb",
  "fileType": "3d",              // NEW: Supports '3d' or 'model'
  "contentType": "application/octet-stream"
}
```

**Supported Content Types for 3D:**
- `model/gltf-binary`
- `model/gltf+json`
- `application/octet-stream`

**File Size Limits:**
- Videos: 100MB
- 3D Models: 50MB
- Images: 10MB
- Mind files: No specific limit

## Frontend Changes

### Create Experience Page (`/dashboard/create`)

**New UI Elements:**

1. **Content Type Selector**
   - Two-button toggle between Video AR and 3D Model AR
   - Visual icons for each type
   - Conditional form fields based on selection

2. **3D Model Upload Section** (shown when 3D is selected)
   - File upload for GLB/GLTF files
   - Accepts: `.glb`, `.gltf`
   - Max size: 50MB

3. **3D Model Settings** (shown when 3D is selected)
   - **Model Scale**: Numeric input (0.1 - 10.0, step 0.1)
   - **Model Rotation**: Numeric input (0 - 360 degrees, step 15)

### User Flow

1. User selects content type (Video or 3D)
2. User uploads appropriate content file
3. User uploads marker image
4. User compiles marker to .mind file
5. User uploads .mind file
6. User configures settings (scale/rotation for 3D)
7. User submits to create AR experience

## AR Viewer Implementation

### A-Frame Components

**For Video AR:**
```html
<a-plane 
  material="src: #arVideo; transparent: true"
  visible="false">
</a-plane>
```

**For 3D Model AR:**
```html
<a-entity
  gltf-model="#arModel"
  scale="1.5 1.5 1.5"
  rotation="0 90 0"
  visible="false"
  animation-mixer>
</a-entity>
```

### Features

- **Smooth Animations**: Models fade in/out with scale animation
- **Auto-rotation**: Y-axis rotation configurable by user
- **Stabilization**: Uses same one-euro-smoother for stable tracking
- **Animation Support**: GLB files with animations will auto-play

## Testing the Feature

### Test with Video AR

1. Go to `/dashboard/create`
2. Select "Video AR"
3. Upload a video file (MP4)
4. Upload marker image and .mind file
5. Create experience
6. Open AR viewer on mobile
7. Point camera at marker - video should play

### Test with 3D AR

1. Go to `/dashboard/create`
2. Select "3D Model AR"
3. Upload a GLB file (download sample from Sketchfab)
4. Set scale to 1.0 and rotation to 0
5. Upload marker image and .mind file
6. Create experience
7. Open AR viewer on mobile
8. Point camera at marker - 3D model should appear

### Sample 3D Models for Testing

Free GLB models available at:
- [Sketchfab](https://sketchfab.com/features/gltf) - Filter by "Downloadable"
- [Poly Haven](https://polyhaven.com/models)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)

## Troubleshooting

### 3D Model Not Appearing

1. **Check file format**: Ensure it's GLB or GLTF
2. **Check file size**: Must be under 50MB
3. **Check model scale**: Try adjusting scale (0.5 - 2.0 range)
4. **Check console**: Open browser console for errors
5. **Check CORS**: Ensure R2 bucket has proper CORS settings

### Model Too Small/Large

- Adjust the **Model Scale** setting
- Scale of 1.0 = original size
- Scale of 0.5 = half size
- Scale of 2.0 = double size

### Model Facing Wrong Direction

- Adjust the **Model Rotation** setting
- Rotation is around Y-axis (vertical)
- Try increments of 90 degrees (0, 90, 180, 270)

### Model Not Animating

- Ensure GLB file contains animations
- Check that `animation-mixer` component is present
- Some models may need manual animation triggers

## Performance Tips

1. **Optimize 3D Models**
   - Use GLB format (compressed)
   - Reduce polygon count
   - Compress textures
   - Remove unnecessary animations

2. **File Size**
   - Keep models under 10MB for best performance
   - Use texture compression
   - Remove unused materials

3. **Mobile Performance**
   - Test on target devices
   - Lower-end phones may struggle with complex models
   - Consider providing multiple quality options

## Future Enhancements

Potential features to add:
- [ ] Model preview before upload
- [ ] Multiple 3D models per marker
- [ ] Interactive 3D models (click/touch events)
- [ ] Model position adjustment (X, Y, Z)
- [ ] Animation controls (play/pause)
- [ ] Lighting controls
- [ ] Shadow support
- [ ] Model library/gallery

## Code Structure

### Key Files Modified

1. **Database Schema**
   - `add-3d-support.sql` - Migration script

2. **API Routes**
   - `app/api/ar/route.ts` - Create AR experience
   - `app/api/ar/[id]/route.ts` - View AR experience
   - `app/api/upload/r2/route.ts` - File upload

3. **Frontend**
   - `app/dashboard/create/page.tsx` - Create experience UI

4. **AR Viewer**
   - `app/api/ar/[id]/route.ts` - Dynamic HTML generation with A-Frame

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migration completed
3. Check R2 bucket CORS settings
4. Test with sample GLB files first
5. Review A-Frame and MindAR documentation

## Resources

- [A-Frame Documentation](https://aframe.io/docs/)
- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [glTF Format Specification](https://www.khronos.org/gltf/)
- [Three.js GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
