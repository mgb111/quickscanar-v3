# AR Tracking Persistence Guide

## Issue: AR Experience Disappears Too Quickly

### Problem
When you move the camera away from the marker, the AR content disappears immediately, making the experience frustrating.

### Solution
Increased tracking persistence with two key changes:

---

## 1. MindAR Miss Tolerance

**Changed:** `missTolerance: 10` → `missTolerance: 50`

```html
<a-scene
  mindar-image="
    imageTargetSrc: ${mindFileUrl}; 
    missTolerance: 50;
  "
>
```

**What it does:**
- Controls how many frames the marker can be "missed" before tracking is lost
- Higher value = more persistent tracking
- `50` means the marker can be out of view for ~50 frames before losing tracking
- At 30fps, that's about 1.6 seconds of persistence

**Values:**
- `10` (old) - Very sensitive, loses tracking quickly
- `50` (new) - More forgiving, maintains tracking longer
- `100` - Very persistent, but may track incorrectly

---

## 2. Target Lost Debounce

**Changed:** `50ms` → `1000ms` (1 second)

```javascript
targetLostTimeout = setTimeout(() => {
  // Hide AR content
}, 1000); // Was 50ms
```

**What it does:**
- Delays hiding the AR content after marker is lost
- Prevents flickering when marker briefly goes out of view
- Gives user time to reacquire the marker

**Timeline:**
```
Marker lost → Wait 1 second → Still lost? → Hide content
              ↑
              If marker found during this time, 
              content stays visible
```

**Values:**
- `50ms` (old) - Content disappears almost instantly
- `1000ms` (new) - Content stays for 1 second after losing marker
- `2000ms` - Even more persistent (may feel laggy)

---

## How It Works Together

### Scenario 1: Brief Marker Loss
```
1. User viewing AR content
2. Camera moves slightly away from marker
3. MindAR misses marker for a few frames
4. Within 50 frames, marker is found again
5. ✅ Content stays visible (no interruption)
```

### Scenario 2: Temporary Occlusion
```
1. User viewing AR content
2. Hand briefly covers marker
3. Marker lost for < 1 second
4. Hand moves away, marker visible again
5. ✅ Content stays visible (smooth experience)
```

### Scenario 3: Intentional Move Away
```
1. User viewing AR content
2. Camera moves completely away from marker
3. Marker lost for > 1 second
4. Content fades out gracefully
5. ✅ Clean exit from AR experience
```

---

## Configuration Options

### Conservative (Current Settings)
```javascript
// MindAR settings
missTolerance: 50

// Debounce timeout
targetLostTimeout: 1000ms
```
**Best for:** Most use cases, balanced persistence

### Aggressive Persistence
```javascript
// MindAR settings
missTolerance: 100

// Debounce timeout
targetLostTimeout: 2000ms
```
**Best for:** Challenging environments, shaky cameras
**Warning:** May track incorrectly if marker is very far

### Sensitive (Original)
```javascript
// MindAR settings
missTolerance: 10

// Debounce timeout
targetLostTimeout: 50ms
```
**Best for:** Precise tracking requirements
**Warning:** Content disappears quickly

---

## Additional Tracking Parameters

### Warm-up Tolerance
```javascript
warmupTolerance: 50
```
- How many frames needed to initially detect marker
- Higher = slower initial detection but more accurate
- Lower = faster detection but may have false positives

### Filter Settings
```javascript
filterMinCF: 0.0001  // Minimum cutoff frequency
filterBeta: 0.001    // Speed coefficient
```
- Controls smoothing of tracking
- Lower values = smoother but more lag
- Higher values = more responsive but jittery

---

## Testing Different Settings

### Test 1: Quick Movement
```
1. Point at marker
2. Quickly move camera away
3. Observe: Content should stay ~1 second
```

### Test 2: Partial Occlusion
```
1. Point at marker
2. Cover half of marker with hand
3. Observe: Content should stay visible
```

### Test 3: Slow Pan
```
1. Point at marker
2. Slowly pan camera away
3. Observe: Content fades smoothly after 1 second
```

---

## Troubleshooting

### Content Disappears Too Quickly
**Increase persistence:**
```javascript
missTolerance: 100        // Was 50
targetLostTimeout: 2000   // Was 1000
```

### Content Stays Too Long
**Decrease persistence:**
```javascript
missTolerance: 30         // Was 50
targetLostTimeout: 500    // Was 1000
```

### Tracking Feels Laggy
**Reduce smoothing:**
```javascript
filterMinCF: 0.001        // Was 0.0001
filterBeta: 0.01          // Was 0.001
```

### Tracking Too Jittery
**Increase smoothing:**
```javascript
filterMinCF: 0.00001      // Was 0.0001
filterBeta: 0.0001        // Was 0.001
```

---

## Best Practices

### 1. Balance Persistence and Responsiveness
- Too persistent = feels laggy
- Too sensitive = frustrating flickering
- Current settings provide good balance

### 2. Consider Use Case
- **Product demos:** Higher persistence (users examining from angles)
- **Games:** Lower persistence (need precise tracking)
- **Education:** Medium persistence (users may look away)

### 3. Test on Target Devices
- Mobile devices have varying camera quality
- Test on low-end and high-end devices
- Adjust settings based on target audience

### 4. Provide Visual Feedback
- Show "Target Lost" message after debounce
- Give users time to reacquire marker
- Don't hide content instantly

---

## Summary

**Current Settings (Recommended):**
```javascript
// MindAR
missTolerance: 50          // 50 frames tolerance
warmupTolerance: 50        // 50 frames to detect

// JavaScript
targetFoundTimeout: 100ms  // Quick to show
targetLostTimeout: 1000ms  // Slow to hide
```

**Result:**
- ✅ Content appears quickly (100ms)
- ✅ Content stays visible when marker briefly lost
- ✅ Smooth experience with minimal flickering
- ✅ Graceful fade-out after 1 second
- ✅ Works well in various lighting conditions

---

## Advanced: Per-Experience Settings

To allow users to customize persistence per experience, you could add:

```typescript
// Database schema
persistence_level: 'low' | 'medium' | 'high'

// Frontend
<select name="persistence">
  <option value="low">Precise (quick hide)</option>
  <option value="medium">Balanced (recommended)</option>
  <option value="high">Persistent (slow hide)</option>
</select>

// AR Viewer
const persistenceSettings = {
  low: { missTolerance: 20, timeout: 500 },
  medium: { missTolerance: 50, timeout: 1000 },
  high: { missTolerance: 100, timeout: 2000 }
}
```

---

## References

- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [A-Frame Documentation](https://aframe.io/docs/)
- [AR Tracking Best Practices](https://developers.google.com/ar/develop/best-practices)

---

**Your AR experiences now have better tracking persistence!** 🎯✨
