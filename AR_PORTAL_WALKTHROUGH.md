# AR Portal Walk-Through Implementation

## Overview

The AR Portal feature has been updated to implement a true walk-through experience based on the reference implementation from [3D-AR-Portal](https://github.com/cynthiachiu/3D-AR-Portal). Users can now physically walk toward and through the portal to enter another world, or tap it for instant transition.

## Key Features

### 1. **Walk-Through Detection**
- Camera position tracking monitors user movement in 3D space
- Automatically detects when user crosses the portal plane
- Seamless transition between real world and portal world

### 2. **Distorting Portal Effect**
- Portal uses `MeshDistortMaterial` for dynamic, organic distortion
- Floating animation with `Float` component (intensity: 3, rotation: 1, speed: 5)
- Visual feedback that the portal is active and interactive

### 3. **Stencil Buffer Masking**
- Uses WebGL stencil buffer for proper portal rendering
- Portal acts as a "window" showing the other world
- When inverted, shows real world through portal while user is in portal world

### 4. **Dual Interaction Methods**
- **Walk-Through**: Physically move toward and through the portal
- **Tap**: Touch/click the portal for instant transition

## Technical Implementation

### Components

#### `MaskedContent`
Shows the 360° portal world environment using stencil buffer masking.

```typescript
- Sphere geometry (radius: 500) with BackSide rendering
- Texture-mapped with portal environment image
- Stencil function changes based on invert state
```

#### `PortalPlane`
The interactive portal itself - a floating, distorting plane.

```typescript
- Plane geometry (1.5 x 1.5) with high subdivision (128x128)
- MeshDistortMaterial with distortion parameters
- Stencil buffer writes to create mask
- Interactive component for tap detection
```

#### `CameraTracker`
Monitors camera position to detect walk-through events.

```typescript
- Tracks camera Z position relative to portal Z position
- Detects plane crossing by comparing current vs previous side
- Triggers invert state change when crossing detected
```

### State Management

- `invert`: Boolean controlling which world is visible
- `colorWrite`: Controls stencil buffer color writing
- `portalPosition`: Vector3 position of portal in 3D space

### Stencil Buffer Configuration

**Portal Plane (Mask Writer):**
- `stencilWrite: true` - Writes to stencil buffer
- `stencilRef: 1` - Reference value
- `stencilFunc: 519 (ALWAYS)` when colorWrite is true
- Creates the "hole" through which portal world is visible

**Portal World (Masked Content):**
- `stencilWrite: false` - Only reads stencil buffer
- `stencilFunc: 517 (NOTEQUAL)` when inverted, `514 (EQUAL)` when not
- Renders only where stencil matches/doesn't match

## User Experience Flow

### Before Entering Portal
1. User sees floating, distorting portal in AR space
2. Portal shows glimpses of another world through it
3. Message: "Walk toward the portal to enter, or tap it"

### Entering Portal
**Option A - Walk Through:**
1. User physically walks toward portal
2. Camera crosses portal plane (Z-axis)
3. Automatic transition triggered
4. World inverts - user now in portal world

**Option B - Tap:**
1. User taps/clicks portal
2. Instant transition
3. Same result as walk-through

### Inside Portal World
1. User sees 360° immersive environment
2. Portal now shows real world through it
3. Message: "You are inside the portal world"
4. Can walk back through or tap to exit

## Configuration

Portal behavior is controlled by database fields in `ar_experiences`:

- `portal_env_url`: URL to 360° equirectangular image
- `portal_distance`: Distance from camera (default: 2 meters)
- `portal_scale`: Scale multiplier (default: 1)
- `content_type`: Must be set to `'portal'`

## Dependencies

Required packages (already in package.json):
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helper components (Float, MeshDistortMaterial)
- `@react-three/xr` - WebXR support (ARButton, XR, Interactive)
- `three` - 3D graphics library

## Browser Compatibility

- Requires WebXR support (modern mobile browsers)
- Best experienced on mobile devices with AR capabilities
- iOS: Safari 15+ with WebXR Viewer
- Android: Chrome 79+ with ARCore support

## Performance Considerations

1. **Texture Loading**: 360° images should be optimized (max 4096x2048)
2. **Geometry Subdivision**: Portal uses 128x128 for smooth distortion
3. **Stencil Buffer**: Minimal performance impact on modern GPUs
4. **Frame Rate**: Targets 60fps on mobile devices

## Differences from Reference Implementation

The reference implementation uses:
- React Three Fiber with standard WebXR
- Mask component from drei (we use manual stencil buffer)
- Simpler camera tracking (we added Z-axis crossing detection)

Our implementation adds:
- Database-driven configuration
- Supabase integration
- Next.js app router compatibility
- Enhanced camera tracking for walk-through detection

## Future Enhancements

Potential improvements:
- [ ] Add proximity-based portal activation (fade in when near)
- [ ] Multiple portals in same scene
- [ ] Portal-to-portal linking
- [ ] Audio transition effects
- [ ] Particle effects on crossing
- [ ] Haptic feedback on mobile devices
- [ ] Distance-based portal size scaling
