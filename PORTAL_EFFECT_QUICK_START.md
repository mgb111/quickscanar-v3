# Portal Effect - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration
```bash
# Via Supabase SQL Editor - paste and execute:
```
Copy contents from `add-portal-effect.sql` and run in your Supabase SQL Editor.

### Step 2: Deploy Files
Ensure these files are deployed:
- ✅ `public/js/portal-effect.js`
- ✅ Updated `app/dashboard/create/page.tsx`
- ✅ Updated `app/api/ar/route.ts`
- ✅ Updated `app/api/ar/[id]/route.ts`

### Step 3: Test It Out
1. Go to `/dashboard/create`
2. Upload a 3D model (GLB/GLTF)
3. Enable "Portal Effect" toggle
4. Choose a color (try cyan `#00ffff`)
5. Set intensity to `0.8`
6. Select "Pulse" animation
7. Create your AR experience!

## 🎨 Quick Settings Presets

### Sci-Fi Tech Portal
```
Color: #00ffff (cyan)
Intensity: 0.8
Frame: ON
Thickness: 0.05
Animation: Pulse
```

### Mystical Magic Portal
```
Color: #9333ea (purple)
Intensity: 0.9
Frame: ON
Thickness: 0.08
Animation: Shimmer
```

### Professional Minimal
```
Color: #3b82f6 (blue)
Intensity: 0.6
Frame: OFF
Animation: None
```

## 📱 Browser Support
- ✅ Chrome 90+ (Android/Desktop)
- ✅ Safari 14+ (iOS/macOS)
- ✅ Firefox 88+
- ✅ Edge 90+

## 🎯 Best Practices
1. Keep 3D models under 10MB
2. Use intensity 0.7-0.9 for best visibility
3. Test on mobile devices
4. Pulse animation works best for most cases

## 🐛 Quick Troubleshooting
- **Portal not showing?** Check browser console for errors
- **Wrong color?** Verify hex format (#RRGGBB)
- **Performance issues?** Reduce intensity or disable frame

## 📚 Full Documentation
See `PORTAL_EFFECT_GUIDE.md` for complete details.

---

**Ready to create amazing portal effects!** 🌟
