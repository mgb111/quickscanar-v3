# 🌀 Portal Effect for 3D AR

Transform your 3D AR experiences with stunning sci-fi portal effects! This feature adds glowing, animated portals around your 3D models, creating an immersive and futuristic experience.

![Portal Effect](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![A-Frame](https://img.shields.io/badge/A--Frame-1.4.1-orange)

## ✨ Features

- 🎨 **Customizable Colors** - Choose any color for your portal glow
- 💫 **Multiple Animations** - Pulse, rotate, shimmer, or static
- 🖼️ **Optional Frame** - Add a glowing frame around the portal
- ⚡ **Real-time Preview** - See changes instantly
- 📱 **Mobile Optimized** - Works on all modern devices
- 🎯 **Easy to Use** - Simple toggle and sliders

## 🚀 Quick Start

### 1. Setup (One-time)

```bash
# Run database migration
psql -h your-db-host -U postgres -d your-database -f add-portal-effect.sql
```

### 2. Create Portal AR Experience

1. Go to `/dashboard/create`
2. Upload your 3D model (GLB/GLTF)
3. Toggle "Portal Effect" ON
4. Customize:
   - **Color**: Pick your favorite (try cyan #00ffff!)
   - **Intensity**: 0.8 works great
   - **Animation**: Pulse for attention-grabbing effect
5. Upload marker and mind file
6. Create experience!

### 3. View Your Portal

Open your AR experience on mobile and point at the marker - your 3D model will emerge from a glowing portal!

## 📖 Documentation

- **[Complete Guide](PORTAL_EFFECT_GUIDE.md)** - Full documentation with examples
- **[Quick Start](PORTAL_EFFECT_QUICK_START.md)** - Get started in 5 minutes
- **[Implementation Summary](PORTAL_EFFECT_IMPLEMENTATION_SUMMARY.md)** - Technical details

## 🎨 Preset Examples

### Sci-Fi Tech Portal
```javascript
Color: #00ffff (cyan)
Intensity: 0.8
Frame: ON
Animation: Pulse
```
Perfect for: Tech products, gadgets, futuristic items

### Mystical Magic Portal
```javascript
Color: #9333ea (purple)
Intensity: 0.9
Frame: ON
Animation: Shimmer
```
Perfect for: Fantasy items, games, magical themes

### Professional Minimal
```javascript
Color: #3b82f6 (blue)
Intensity: 0.6
Frame: OFF
Animation: None
```
Perfect for: Business presentations, professional showcases

### Energy Portal
```javascript
Color: #10b981 (green)
Intensity: 0.85
Frame: ON
Animation: Rotate
```
Perfect for: Environmental themes, energy products

## 🎮 Try the Demo

Open `/portal-effect-demo.html` in your browser to see the portal effect in action with real-time controls!

## 🛠️ Technical Stack

- **A-Frame 1.4.1** - WebXR framework
- **Custom GLSL Shaders** - Portal rendering
- **MindAR 1.2.5** - Image tracking
- **Next.js** - Frontend framework
- **Supabase** - Database

## 📊 Performance

- **GPU Overhead**: ~2-3%
- **Memory**: +1-2MB
- **Load Time**: +50-100ms
- **FPS Impact**: Negligible on modern devices

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome (Android/Desktop) | 90+ | ✅ Supported |
| Safari (iOS/macOS) | 14+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |
| Samsung Internet | 14+ | ✅ Supported |

## 📱 Device Compatibility

**Minimum Requirements:**
- iPhone 11+ (iOS 14+)
- Android devices from 2018+ (Android 10+)
- 2GB+ RAM
- WebGL 2.0 support

**Tested On:**
- ✅ iPhone 13 Pro (iOS 16)
- ✅ Samsung Galaxy S21 (Android 12)
- ✅ Google Pixel 6 (Android 13)
- ✅ iPad Pro 2020 (iPadOS 16)

## 🎯 Use Cases

### E-Commerce
- Product launches with dramatic portal entrance
- Virtual showrooms with themed portals
- Interactive product demonstrations

### Gaming
- Character reveals through mystical portals
- Level previews with animated portals
- Collectible items with unique portal colors

### Education
- Historical artifacts emerging from time portals
- Scientific models with color-coded portals
- Interactive learning experiences

### Events
- Conference booth attractions
- Trade show displays
- Brand activations

## 🔧 Customization Options

| Setting | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| Enabled | Boolean | - | false | Enable/disable portal |
| Color | Hex | Any | #00ffff | Portal glow color |
| Intensity | Number | 0.0-1.0 | 0.8 | Glow brightness |
| Frame Enabled | Boolean | - | true | Show/hide frame |
| Frame Thickness | Number | 0.01-0.2 | 0.05 | Frame thickness |
| Animation | Enum | 4 types | pulse | Animation style |

## 📝 API Reference

### Create AR Experience with Portal

```javascript
POST /api/ar

{
  "title": "My Portal AR",
  "content_type": "3d",
  "model_url": "https://...",
  "portal_enabled": true,
  "portal_color": "#00ffff",
  "portal_intensity": 0.8,
  "portal_frame_enabled": true,
  "portal_frame_thickness": 0.05,
  "portal_animation": "pulse",
  // ... other fields
}
```

### Portal Effect Component

```html
<a-entity 
  gltf-model="#model"
  portal-effect="
    enabled: true;
    color: #00ffff;
    intensity: 0.8;
    frameEnabled: true;
    frameThickness: 0.05;
    animation: pulse
  "
></a-entity>
```

## 🐛 Troubleshooting

### Portal Not Appearing
1. Check browser console for errors
2. Verify `/js/portal-effect.js` is accessible
3. Ensure `portal_enabled` is true in database
4. Clear browser cache

### Wrong Color
1. Verify hex format (#RRGGBB)
2. Check `portal_color` in database
3. Try a different color

### Performance Issues
1. Reduce glow intensity
2. Disable portal frame
3. Use 'none' animation
4. Optimize 3D model size

### Portal Too Small/Large
- Portal size is fixed at 2.0 x 2.5 units
- Adjust 3D model scale instead
- Position model relative to portal

## 🔄 Updates & Roadmap

### Current Version: 1.0.0
- ✅ Custom colors
- ✅ Adjustable intensity
- ✅ Optional frame
- ✅ 4 animation types
- ✅ Mobile support

### Planned Features
- [ ] Custom portal shapes (circular, hexagonal)
- [ ] Adjustable portal size
- [ ] Particle effects
- [ ] Sound effects
- [ ] Multiple portals per scene
- [ ] Portal-to-portal transitions

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue!

## 📄 License

Part of QuickScanAR project.

## 🙏 Credits

Built with:
- A-Frame by Mozilla
- MindAR by hiukim
- Custom GLSL shaders
- Love for AR ❤️

## 📞 Support

Need help?
1. Check the [Complete Guide](PORTAL_EFFECT_GUIDE.md)
2. Try the [Demo](public/portal-effect-demo.html)
3. Review [Troubleshooting](#-troubleshooting)
4. Open an issue

---

**Made with 🌀 for amazing AR experiences**

[Get Started](PORTAL_EFFECT_QUICK_START.md) | [Full Docs](PORTAL_EFFECT_GUIDE.md) | [Demo](public/portal-effect-demo.html)
