# 3D Model Animations Guide

## Why Animations Might Not Play

The `animation-mixer` component in A-Frame handles GLB/GLTF animations, but there are several reasons why animations might not play automatically:

### 1. **Animation-Mixer Configuration**

The component needs proper configuration to auto-play animations.

**Updated Configuration (Now Included):**
```html
<a-entity
  gltf-model="#arModel"
  animation-mixer="clip: *; loop: repeat; clampWhenFinished: false"
></a-entity>
```

**What each parameter does:**
- `clip: *` - Play all animations in the model
- `loop: repeat` - Loop animations continuously
- `clampWhenFinished: false` - Don't freeze on last frame

### 2. **Explicit Animation Triggering**

The code now explicitly plays animations when the target is found:

```javascript
// When target is detected
const mixer = model3D.components['animation-mixer'];
if (mixer && mixer.mixer) {
  mixer.mixer.clipAction(mixer.mixer._actions[0]?._clip).play();
}
```

## How to Verify Your Model Has Animations

### Method 1: Use glTF Viewer
1. Go to [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
2. Drag and drop your GLB file
3. Look for "Animations" dropdown in the UI
4. If animations exist, you can play them in the viewer

### Method 2: Check in Blender
1. Open your GLB file in Blender
2. Go to **Dope Sheet** or **Timeline** editor
3. Look for keyframes or animation data
4. Check if animations are included in export settings

### Method 3: Browser Console
```javascript
// In AR viewer, open console and run:
const model = document.querySelector('#model3D');
model.addEventListener('model-loaded', () => {
  const mixer = model.components['animation-mixer'];
  console.log('Animations:', mixer?.mixer?._actions);
});
```

## Common Animation Issues

### Issue 1: No Animations in GLB File

**Symptoms:**
- Model loads fine
- No animations play
- Console shows: `Available animations: []` or `none`

**Solution:**
Your GLB file doesn't contain animations. You need to:

1. **Add animations in Blender:**
   - Create keyframe animations
   - Use armature/bone animations
   - Add shape key animations

2. **Export with animations:**
   - File → Export → glTF 2.0 (.glb)
   - Check ✅ **Include Animations**
   - Check ✅ **Export Deformation Bones Only** (if using armature)

3. **Test the export:**
   - Open in glTF Viewer to verify animations included

### Issue 2: Animation Plays Once Then Stops

**Symptoms:**
- Animation plays when model appears
- Stops after one cycle
- Doesn't loop

**Solution:**
Ensure `loop: repeat` is set:
```html
animation-mixer="clip: *; loop: repeat"
```

### Issue 3: Animation Too Fast/Slow

**Symptoms:**
- Animation speed doesn't match original

**Solution A - Adjust in 3D Software:**
- Modify animation timeline before export
- Adjust keyframe spacing

**Solution B - Adjust timeScale:**
```html
animation-mixer="clip: *; loop: repeat; timeScale: 0.5"
```
- `timeScale: 0.5` = Half speed
- `timeScale: 2.0` = Double speed

### Issue 4: Multiple Animations, Only One Plays

**Symptoms:**
- Model has multiple animations
- Only first animation plays

**Solution A - Play All:**
```html
animation-mixer="clip: *; loop: repeat"
```

**Solution B - Play Specific Animation:**
```html
animation-mixer="clip: Walk; loop: repeat"
```

**Solution C - Switch Animations Programmatically:**
```javascript
const mixer = model.components['animation-mixer'];
mixer.stopAction(); // Stop current
mixer.playAction('Run'); // Play specific animation
```

### Issue 5: Animation Doesn't Start Until Target Found

**This is expected behavior!**

Animations start when:
1. Model loads
2. Target is detected
3. Model becomes visible

This is intentional to save performance and provide better UX.

## Testing Animations

### Test 1: Verify Animation Exists
```javascript
// In browser console on AR viewer
const model = document.querySelector('#model3D');
const mixer = model.components['animation-mixer'];
console.log('Has animations:', mixer?.mixer?._actions?.length > 0);
```

### Test 2: Manually Play Animation
```javascript
// Force play all animations
const model = document.querySelector('#model3D');
const mixer = model.components['animation-mixer'];
if (mixer && mixer.mixer) {
  mixer.mixer._actions.forEach(action => {
    action.play();
    console.log('Playing:', action._clip.name);
  });
}
```

### Test 3: Check Animation Names
```javascript
// List all animation names
const model = document.querySelector('#model3D');
const mixer = model.components['animation-mixer'];
if (mixer && mixer.mixer) {
  mixer.mixer._actions.forEach(action => {
    console.log('Animation:', action._clip.name, 'Duration:', action._clip.duration);
  });
}
```

## Sample Animated Models for Testing

### Free Animated GLB Models:

1. **Animated Fox**
   - [Download](https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/Fox/glTF-Binary/Fox.glb)
   - Has run cycle animation

2. **Animated Cesium Man**
   - [Download](https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb)
   - Has walking animation

3. **Animated Robot**
   - [Download](https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/RobotExpressive/glTF-Binary/RobotExpressive.glb)
   - Has multiple animations (idle, walk, run, etc.)

## Creating Animated GLB Files

### In Blender:

1. **Create/Import Model**
   - Create or import your 3D model

2. **Add Armature (for character animation)**
   - Add → Armature
   - Parent model to armature (Ctrl+P → With Automatic Weights)

3. **Create Animation**
   - Switch to Animation workspace
   - Set keyframes (I key)
   - Create animation timeline

4. **Export as GLB**
   - File → Export → glTF 2.0 (.glb)
   - Format: **glTF Binary (.glb)**
   - ✅ Include: Animations
   - ✅ Include: Skins (if using armature)
   - Export

5. **Test**
   - Open in glTF Viewer
   - Verify animations play

### Animation Types Supported:

- ✅ **Transform animations** (position, rotation, scale)
- ✅ **Armature/bone animations** (character rigging)
- ✅ **Shape key animations** (morph targets)
- ✅ **Material animations** (color, opacity changes)
- ❌ **Particle systems** (not supported in glTF)
- ❌ **Physics simulations** (bake to keyframes first)

## Advanced: Custom Animation Control

### Play Specific Animation on Target Found:
```javascript
target.addEventListener('targetFound', () => {
  const model = document.querySelector('#model3D');
  const mixer = model.components['animation-mixer'];
  
  if (mixer && mixer.mixer) {
    // Stop all animations
    mixer.mixer._actions.forEach(action => action.stop());
    
    // Play specific animation
    const walkAction = mixer.mixer._actions.find(a => a._clip.name === 'Walk');
    if (walkAction) walkAction.play();
  }
});
```

### Pause Animation on Target Lost:
```javascript
target.addEventListener('targetLost', () => {
  const model = document.querySelector('#model3D');
  const mixer = model.components['animation-mixer'];
  
  if (mixer && mixer.mixer) {
    mixer.mixer._actions.forEach(action => action.paused = true);
  }
});
```

## Performance Tips

1. **Optimize Animation Data**
   - Remove unnecessary keyframes
   - Use linear interpolation where possible
   - Reduce animation complexity

2. **Limit Animation Count**
   - Include only necessary animations
   - Remove unused animation tracks

3. **Bake Complex Animations**
   - Bake physics simulations to keyframes
   - Bake constraints before export

4. **File Size**
   - Animations add to file size
   - Keep total GLB under 10MB for best performance

## Troubleshooting Checklist

- [ ] GLB file contains animations (verify in glTF Viewer)
- [ ] `animation-mixer` component is present
- [ ] `clip: *` is set to play all animations
- [ ] `loop: repeat` is set for continuous playback
- [ ] Model loads successfully (check console)
- [ ] Target detection works
- [ ] Model becomes visible when target found
- [ ] No JavaScript errors in console
- [ ] Animations exported correctly from 3D software

## Summary

**The updated code now includes:**
1. ✅ Proper `animation-mixer` configuration
2. ✅ Explicit animation triggering on target found
3. ✅ Console logging for debugging
4. ✅ Auto-play for all animations in the model

**If animations still don't play:**
1. Verify your GLB file has animations (use glTF Viewer)
2. Check browser console for errors
3. Test with a known-good animated model
4. Ensure model loads successfully before target detection

**Resources:**
- [A-Frame Animation Mixer](https://github.com/n5ro/aframe-extras/tree/master/src/loaders#animation)
- [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
- [Blender glTF Export](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
