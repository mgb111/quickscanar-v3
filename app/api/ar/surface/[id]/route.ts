import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: experience, error } = await supabase
      .from('ar_experiences')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !experience) {
      return new NextResponse('Experience not found', { status: 404 })
    }

    const is3D = (experience.content_type === '3d' || experience.content_type === 'both') && !!experience.model_url

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <title>${experience.title} - Surface AR</title>
  <script src="https://aframe.io/releases/1.4.1/aframe.min.js"></script>
  <style>
    html, body { margin:0; height:100%; overflow:hidden; background:#000; }
    a-scene { width:100vw; height:100vh; }
    #ui { position: fixed; top: 12px; left: 12px; z-index: 10; display:flex; gap:8px; }
    .btn { background:#111827; color:#fff; border:1px solid #000; border-radius:12px; padding:10px 14px; font-weight:600; }
    .hint { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); color:#fff; background: rgba(0,0,0,0.5); padding:10px 14px; border-radius:12px; font-family: system-ui, sans-serif; }
    #status { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color:#000; background:#fff; border:2px solid #000; border-radius:16px; padding:16px 18px; font-family: system-ui, sans-serif; z-index: 20; display:none; max-width: 90vw; }
    #startAR { position: fixed; top: 12px; right: 12px; z-index: 10; }
  </style>
</head>
<body>
  <div id="ui">
    <button id="backToMarker" class="btn">Use Marker</button>
    <button id="resetBtn" class="btn">Reset</button>
  </div>
  <div class="hint">Move your phone to detect a surface, then tap to place.</div>
  <div id="status"></div>
  <button id="startAR" class="btn">Start AR</button>

  <a-scene
    renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true"
    xr-mode-ui="enabled: true"
    webxr="optionalFeatures: hit-test, dom-overlay; requiredFeatures: hit-test; overlayElement: #ui"
    embedded
    vr-mode-ui="enabled: false"
  >
    <a-assets>
      ${is3D ? `<a-asset-item id="arModel" src="${experience.model_url}"></a-asset-item>` : ''}
    </a-assets>

    <a-entity light="type: ambient; intensity: 0.8"></a-entity>
    <a-entity light="type: directional; intensity: 0.8" position="1 2 1"></a-entity>

    <a-entity id="reticle" visible="false" rotation="-90 0 0">
      <a-ring color="#4ade80" radius-inner="0.025" radius-outer="0.04"></a-ring>
      <a-entity position="0 0 0" geometry="primitive: cylinder; height: 0.002; radius: 0.04" material="color: #22c55e; opacity: 0.25"></a-entity>
    </a-entity>

    ${is3D ? `
    <a-entity id="placed" visible="false">
      <a-entity id="model3D" gltf-model="#arModel" gesture-controls="dragSpeed: 0.003; rotateSpeed: 1; minScale: 0.05; maxScale: 5"
        position="0 0 0"
        rotation="0 ${experience.model_rotation || 0} 0"
        scale="${experience.model_scale || 1} ${experience.model_scale || 1} ${experience.model_scale || 1}"
      ></a-entity>
    </a-entity>
    ` : ''}

    <a-camera position="0 1.6 0"></a-camera>
  </a-scene>

  <script>
    // Touch gesture controls for 3D model: drag (move X/Z), pinch (scale), two-finger rotate (Y)
    AFRAME.registerComponent('gesture-controls', {
      schema: {
        enabled: { type: 'boolean', default: true },
        dragSpeed: { type: 'number', default: 0.003 },
        rotateSpeed: { type: 'number', default: 1.0 },
        minScale: { type: 'number', default: 0.05 },
        maxScale: { type: 'number', default: 5.0 }
      },
      init: function () {
        this._mode = 'none';
        this._startTouches = [];
        this._startPosition = new THREE.Vector3();
        this._startScale = new THREE.Vector3();
        this._startRotY = 0;
        this._startDistance = 0;
        this._startAngle = 0;
        this._onStart = this.onTouchStart.bind(this);
        this._onMove = this.onTouchMove.bind(this);
        this._onEnd = this.onTouchEnd.bind(this);
        this.sceneEl = this.el.sceneEl;
        this.canvas = this.sceneEl && this.sceneEl.canvas;
        if (!this.canvas) {
          this.sceneEl.addEventListener('render-target-loaded', () => {
            this.canvas = this.sceneEl.canvas;
            this.addListeners();
          });
        } else {
          this.addListeners();
        }
      },
      remove: function () { this.removeListeners(); },
      addListeners: function () {
        if (!this.canvas) return;
        this.canvas.addEventListener('touchstart', this._onStart, { passive: false });
        this.canvas.addEventListener('touchmove', this._onMove, { passive: false });
        this.canvas.addEventListener('touchend', this._onEnd, { passive: false });
        this.canvas.addEventListener('touchcancel', this._onEnd, { passive: false });
      },
      removeListeners: function () {
        if (!this.canvas) return;
        this.canvas.removeEventListener('touchstart', this._onStart);
        this.canvas.removeEventListener('touchmove', this._onMove);
        this.canvas.removeEventListener('touchend', this._onEnd);
        this.canvas.removeEventListener('touchcancel', this._onEnd);
      },
      onTouchStart: function (e) {
        if (!this.data.enabled || !this.el.getAttribute('visible')) return;
        if (e.touches.length === 0) return;
        e.preventDefault();
        this._startTouches = this.cloneTouches(e.touches);
        this._startPosition.copy(this.el.object3D.position);
        this._startScale.copy(this.el.object3D.scale);
        const rot = this.el.getAttribute('rotation');
        this._startRotY = rot ? rot.y : 0;
        if (e.touches.length === 1) this._mode = 'drag';
        else { this._mode = 'pinchrotate'; const { dist, angle } = this.touchMetrics(this._startTouches[0], this._startTouches[1]); this._startDistance = dist || 1; this._startAngle = angle || 0; }
      },
      onTouchMove: function (e) {
        if (!this.data.enabled || this._mode === 'none') return;
        e.preventDefault();
        const touches = this.cloneTouches(e.touches);
        if (this._mode === 'drag' && touches.length === 1 && this._startTouches.length === 1) {
          const dx = touches[0].clientX - this._startTouches[0].clientX;
          const dy = touches[0].clientY - this._startTouches[0].clientY;
          const speed = this.data.dragSpeed;
          const newX = this._startPosition.x + dx * speed;
          const newZ = this._startPosition.z + dy * speed;
          this.el.object3D.position.set(newX, this._startPosition.y, newZ);
        } else if (this._mode === 'pinchrotate' && touches.length >= 2 && this._startTouches.length >= 2) {
          const mNow = this.touchMetrics(touches[0], touches[1]);
          const mStart = this.touchMetrics(this._startTouches[0], this._startTouches[1]);
          const scaleFactor = (mNow.dist || 1) / (mStart.dist || 1);
          const base = this._startScale.x;
          let targetScale = base * scaleFactor;
          targetScale = Math.min(this.data.maxScale, Math.max(this.data.minScale, targetScale));
          this.el.object3D.scale.set(targetScale, targetScale, targetScale);
          const dAngleRad = (mNow.angle - this._startAngle);
          const dAngleDeg = THREE.MathUtils.radToDeg(dAngleRad) * this.data.rotateSpeed;
          const newY = this._startRotY + dAngleDeg;
          const currentRot = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
          this.el.setAttribute('rotation', { x: currentRot.x, y: newY, z: currentRot.z });
        }
      },
      onTouchEnd: function (e) {
        if (!this.data.enabled) return;
        e.preventDefault();
        if (e.touches.length === 0) this._mode = 'none';
        else if (e.touches.length === 1) { this._mode = 'drag'; this._startTouches = this.cloneTouches(e.touches); this._startPosition.copy(this.el.object3D.position); }
        else { this._mode = 'pinchrotate'; this._startTouches = this.cloneTouches(e.touches); this._startScale.copy(this.el.object3D.scale); const rot = this.el.getAttribute('rotation'); this._startRotY = rot ? rot.y : 0; const { dist, angle } = this.touchMetrics(this._startTouches[0], this._startTouches[1]); this._startDistance = dist || 1; this._startAngle = angle || 0; }
      },
      cloneTouches: function (touchList) { const arr = []; for (let i = 0; i < touchList.length; i++) { const t = touchList.item(i); arr.push({ clientX: t.clientX, clientY: t.clientY, identifier: t.identifier }); } return arr; },
      touchMetrics: function (t1, t2) { const dx = (t2.clientX - t1.clientX); const dy = (t2.clientY - t1.clientY); const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx); return { dist, angle }; }
    });
    // Basic WebXR Hit Test reticle + tap-to-place for A-Frame
    AFRAME.registerComponent('hit-test-placer', {
      init: function () {
        this.status = document.getElementById('status');
        this.session = null;
        this.viewerSpace = null;
        this.refSpace = null;
        this.hitTestSource = null;
        this.reticle = document.getElementById('reticle');
        this.placed = document.getElementById('placed');
        this.model = document.getElementById('model3D');
        this._tapHandler = this.onTap.bind(this);
        this.el.sceneEl.addEventListener('enter-vr', () => this.setupXR());
        this.el.sceneEl.addEventListener('exit-vr', () => this.cleanupXR());
        this.el.sceneEl.canvas && this.el.sceneEl.canvas.addEventListener('click', this._tapHandler);
        // Detect support
        this.detectSupport();
      },
      remove: function () {
        this.cleanupXR();
        this.el.sceneEl.canvas && this.el.sceneEl.canvas.removeEventListener('click', this._tapHandler);
      },
      async detectSupport() {
        try {
          if (!('xr' in navigator)) {
            this.showStatus('WebXR not supported on this device/browser. Use the Marker mode or try a newer device/browser over HTTPS.');
            return;
          }
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          if (!supported) {
            this.showStatus('AR session not supported (immersive-ar). Use the Marker mode or try Chrome/Android with WebXR.');
            return;
          }
          this.showStatus('Tap Start AR to begin surface placement.');
        } catch (e) {
          this.showStatus('Unable to check AR support. Ensure HTTPS and camera permissions.');
        }
      },
      showStatus(msg) { if (this.status) { this.status.textContent = msg; this.status.style.display = 'block'; } },
      hideStatus() { if (this.status) this.status.style.display = 'none'; },
      tick: function (time, dt) {
        const xrSession = this.el.sceneEl.renderer.xr.getSession();
        if (!xrSession || !this.hitTestSource) return;
        const frame = this.el.sceneEl.frame;
        if (!frame || !this.refSpace || !this.viewerSpace) return;
        const hitTestResults = frame.getHitTestResults(this.hitTestSource);
        if (hitTestResults.length > 0) {
          const pose = hitTestResults[0].getPose(this.refSpace);
          if (pose && this.reticle) {
            this.reticle.object3D.visible = true;
            this.reticle.object3D.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
            const orient = new THREE.Quaternion(
              pose.transform.orientation.x,
              pose.transform.orientation.y,
              pose.transform.orientation.z,
              pose.transform.orientation.w
            );
            // Align reticle to the plane (face up)
            const e = new THREE.Euler(-Math.PI / 2, 0, 0);
            this.reticle.object3D.quaternion.copy(orient).multiply(new THREE.Quaternion().setFromEuler(e));
          }
        } else {
          if (this.reticle) this.reticle.object3D.visible = false;
        }
      },
      async setupXR() {
        const renderer = this.el.sceneEl.renderer;
        const session = renderer.xr.getSession();
        if (!session) {
          this.showStatus('Failed to start AR session. Ensure camera permission is granted and you are on HTTPS.');
          return;
        }
        this.session = session;
        this.refSpace = await session.requestReferenceSpace('local');
        this.viewerSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await session.requestHitTestSource({ space: this.viewerSpace });
        this.hitTestSource = hitTestSource;
        this.hideStatus();
      },
      cleanupXR() {
        if (this.hitTestSource) { this.hitTestSource.cancel && this.hitTestSource.cancel(); }
        this.hitTestSource = null; this.viewerSpace = null; this.refSpace = null; this.session = null;
        if (this.reticle) this.reticle.object3D.visible = false;
      },
      onTap(e) {
        if (!this.reticle || !this.placed) return;
        if (!this.reticle.object3D.visible) return;
        // Place container at reticle and show model
        this.placed.object3D.position.copy(this.reticle.object3D.position);
        this.placed.object3D.quaternion.copy(this.reticle.object3D.quaternion);
        this.placed.setAttribute('visible', 'true');
      }
    });

    const sceneEl = document.querySelector('a-scene');
    sceneEl.setAttribute('hit-test-placer', '');
    // Manual Start AR fallback
    const startBtn = document.getElementById('startAR');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        // Enter AR via A-Frame API
        if (sceneEl && sceneEl.enterVR) sceneEl.enterVR();
      });
    }

    // UI actions
    document.getElementById('backToMarker').addEventListener('click', () => {
      window.location.href = '/api/ar/${experience.id}';
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
      const placed = document.getElementById('placed');
      if (placed) placed.setAttribute('visible', 'false');
    });
  </script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Permissions-Policy': "camera=(self), xr-spatial-tracking=(self)"
      },
    })
  } catch (error) {
    console.error('Error serving Surface AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
