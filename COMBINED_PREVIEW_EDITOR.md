# Combined AR Preview & Position Editor

## 🎬 New Feature: Interactive Combined Preview

### Overview
When both video and 3D model are uploaded, users can now:
- **See both previews side-by-side**
- **Adjust 3D model position in 3D space** (X, Y, Z)
- **Use quick presets** for common layouts
- **Preview exactly how they'll appear together** in AR

---

## Features

### 1. Side-by-Side Preview
```
┌─────────────────────┐  ┌─────────────────────┐
│   Video Preview     │  │  3D Model Preview   │
│   (Layer 1)         │  │  (Layer 2)          │
│   [video player]    │  │  [3D viewer]        │
└─────────────────────┘  └─────────────────────┘
```

### 2. Position Controls
- **X Position**: Left (-1) to Right (+1)
- **Y Position**: Down (0) to Up (1)
- **Z Position**: Back (0) to Front (0.5)

### 3. Quick Presets
- **Default**: Center, raised (0, 0.3, 0.15)
- **Flat**: On video surface (0, 0, 0.2)
- **High**: Above video (0, 0.5, 0.15)
- **Right Side**: Offset right (0.3, 0.3, 0.15)
- **Left Side**: Offset left (-0.3, 0.3, 0.15)

### 4. Live Position Display
Shows real-time coordinates as you adjust sliders

---

## UI Components

### Combined Preview Section
**Appears when:** Both video AND 3D model are uploaded

**Features:**
- Toggle button to show/hide preview
- Purple gradient background (indicates "both" mode)
- Side-by-side video and 3D previews
- Layer indicators (Layer 1, Layer 2)
- Position diagram showing coordinates

### Position Editor
**Three sliders:**

1. **X Position** (Horizontal)
   - Range: -1 to 1
   - Step: 0.1
   - Labels: Left ← → Right

2. **Y Position** (Vertical)
   - Range: 0 to 1
   - Step: 0.05
   - Labels: Down ↓ ↑ Up

3. **Z Position** (Depth)
   - Range: 0 to 0.5
   - Step: 0.05
   - Labels: Back ← → Front

### Quick Presets
Five preset buttons for common layouts:
- Default (Center, Raised)
- Flat (On Video)
- High (Above Video)
- Right Side
- Left Side

---

## Database Schema

### New Columns Added
```sql
model_position_x DECIMAL DEFAULT 0      -- X position (-1 to 1)
model_position_y DECIMAL DEFAULT 0.3    -- Y position (0 to 1)
model_position_z DECIMAL DEFAULT 0.15   -- Z position (0 to 0.5)
```

---

## API Changes

### Request Body (POST /api/ar)
```json
{
  "title": "My AR Experience",
  "content_type": "both",
  "video_file_url": "https://...",
  "model_url": "https://...",
  "model_scale": 1.0,
  "model_rotation": 0,
  "model_position_x": 0,      // NEW
  "model_position_y": 0.3,    // NEW
  "model_position_z": 0.15,   // NEW
  "mind_file_url": "https://...",
  "marker_image_url": "https://...",
  "user_id": "uuid"
}
```

### AR Viewer
Uses custom position values:
```javascript
position="${experience.model_position_x || 0} ${experience.model_position_y || 0.3} ${experience.model_position_z || 0.15}"
```

---

## User Flow

### Step 1: Upload Files
```
1. Upload video file
2. Upload 3D model file
3. Upload marker image
4. Upload mind file
```

### Step 2: Combined Preview Appears
```
🎬 Combined AR Preview [Both]
See how your video and 3D model will look together in AR

[Show Preview & Edit] button
```

### Step 3: Click "Show Preview & Edit"
```
┌─────────────────────────────────────┐
│  Video Preview  │  3D Model Preview │
├─────────────────────────────────────┤
│  AR Positioning Diagram             │
├─────────────────────────────────────┤
│  🎮 Adjust 3D Model Position        │
│  [X slider] [Y slider] [Z slider]   │
│  [Quick Presets]                    │
└─────────────────────────────────────┘
```

### Step 4: Adjust Position
```
- Move sliders to adjust position
- Try quick presets
- See coordinates update in real-time
- Position diagram shows current values
```

### Step 5: Create Experience
```
- Adjusted position saved automatically
- AR viewer uses custom position
- 3D model appears exactly where configured
```

---

## Position Coordinate System

### Axes
```
        Y (Up)
        ↑
        │
        │
        └────→ X (Right)
       ╱
      ╱
     Z (Front)
```

### Example Positions

**Default (Center, Raised):**
```javascript
X: 0    // Center
Y: 0.3  // Raised above marker
Z: 0.15 // Slightly forward
```

**Flat (On Video):**
```javascript
X: 0    // Center
Y: 0    // On marker surface
Z: 0.2  // Forward (in front of video)
```

**High (Above Video):**
```javascript
X: 0    // Center
Y: 0.5  // High above marker
Z: 0.15 // Slightly forward
```

**Right Side:**
```javascript
X: 0.3  // Offset right
Y: 0.3  // Raised
Z: 0.15 // Slightly forward
```

**Left Side:**
```javascript
X: -0.3 // Offset left
Y: 0.3  // Raised
Z: 0.15 // Slightly forward
```

---

## Benefits

### For Users
1. **Visual Preview** - See both layers before creating
2. **Precise Control** - Adjust exact position in 3D space
3. **Quick Presets** - Common layouts with one click
4. **No Guesswork** - Know exactly how it will look
5. **Easy Adjustments** - Sliders are intuitive

### For Creators
1. **Professional Layouts** - Position models perfectly
2. **Layered Content** - Video background + 3D foreground
3. **Flexible Positioning** - Any position in 3D space
4. **Save Time** - No trial and error needed
5. **Better Results** - Precise control = better experiences

---

## Use Cases

### Product Launch
```
Video: Brand announcement (background)
3D Model: Product (floating above, center)
Position: (0, 0.4, 0.15) - High and centered
```

### Museum Exhibit
```
Video: Historical context (background)
3D Model: Artifact (center, raised)
Position: (0, 0.3, 0.2) - Default with more depth
```

### Interactive Ad
```
Video: Marketing message (background)
3D Model: Call-to-action button (right side)
Position: (0.3, 0.2, 0.25) - Right, low, forward
```

### Educational Content
```
Video: Teacher explanation (background)
3D Model: Anatomical model (left side, high)
Position: (-0.3, 0.5, 0.15) - Left, high
```

---

## Tips for Best Results

### Y Position (Vertical)
- **0 - 0.2**: Near marker surface
- **0.2 - 0.4**: Slightly raised (recommended)
- **0.4 - 0.6**: High above marker
- **0.6 - 1.0**: Very high (may go off screen)

### Z Position (Depth)
- **0 - 0.1**: Behind or at video plane
- **0.1 - 0.2**: Slightly in front (recommended)
- **0.2 - 0.3**: Well in front
- **0.3 - 0.5**: Very close to camera

### X Position (Horizontal)
- **-0.5 to -0.2**: Left side
- **-0.2 to 0.2**: Center area (recommended)
- **0.2 to 0.5**: Right side
- **Beyond ±0.5**: May go off screen

### General Tips
1. **Start with default** (0, 0.3, 0.15)
2. **Adjust Y first** to set height
3. **Then adjust Z** to set depth
4. **Finally adjust X** if needed for offset
5. **Test on mobile** to verify positioning

---

## Files Modified

### Frontend
- ✅ `app/dashboard/create/page.tsx`
  - Added combined preview section
  - Added position sliders (X, Y, Z)
  - Added quick preset buttons
  - Added position state management

### Backend
- ✅ `app/api/ar/route.ts`
  - Accepts position parameters
  - Stores in database

- ✅ `app/api/ar/[id]/route.ts`
  - Uses custom position values
  - Renders model at specified position

### Database
- ✅ `add-3d-support.sql`
  - Added `model_position_x` column
  - Added `model_position_y` column
  - Added `model_position_z` column

---

## Testing

### Test Case 1: Default Position
```
1. Upload video + 3D model
2. Click "Show Preview & Edit"
3. Don't change anything
4. Create experience
✅ Model appears at (0, 0.3, 0.15)
```

### Test Case 2: Custom Position
```
1. Upload video + 3D model
2. Click "Show Preview & Edit"
3. Adjust sliders: X=0.2, Y=0.5, Z=0.2
4. Create experience
✅ Model appears at (0.2, 0.5, 0.2)
```

### Test Case 3: Quick Preset
```
1. Upload video + 3D model
2. Click "Show Preview & Edit"
3. Click "Right Side" preset
4. Create experience
✅ Model appears at (0.3, 0.3, 0.15)
```

---

## Summary

✅ **Combined Preview** - See both layers side-by-side  
✅ **Position Editor** - Adjust X, Y, Z with sliders  
✅ **Quick Presets** - 5 common layouts  
✅ **Live Updates** - See coordinates in real-time  
✅ **Custom Positions** - Saved to database  
✅ **AR Viewer** - Uses exact position values  

Users can now create perfectly positioned combined AR experiences with video and 3D models! 🎬📦✨
