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
  </style>
</head>
<body>
  <div id="ui">
    <button id="backToMarker" class="btn">Use Marker</button>
    <button id="resetBtn" class="btn">Reset</button>
  </div>
  <div class="hint">Move your phone to detect a surface, then tap to place.</div>

  <a-scene
    renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true"
    xr-mode-ui="enabled: true"
    webxr="optionalFeatures: hit-test; requiredFeatures: hit-test"
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
      <a-entity id="model3D" gltf-model="#arModel"
        position="0 0 0"
        rotation="0 ${experience.model_rotation || 0} 0"
        scale="${experience.model_scale || 1} ${experience.model_scale || 1} ${experience.model_scale || 1}"
      ></a-entity>
    </a-entity>
    ` : ''}

    <a-camera position="0 1.6 0"></a-camera>
  </a-scene>

  <script>
    // Basic WebXR Hit Test reticle + tap-to-place for A-Frame
    AFRAME.registerComponent('hit-test-placer', {
      init: function () {
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
      },
      remove: function () {
        this.cleanupXR();
        this.el.sceneEl.canvas && this.el.sceneEl.canvas.removeEventListener('click', this._tapHandler);
      },
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
        if (!session) return;
        this.session = session;
        this.refSpace = await session.requestReferenceSpace('local');
        this.viewerSpace = await session.requestReferenceSpace('viewer');
        const hitTestSource = await session.requestHitTestSource({ space: this.viewerSpace });
        this.hitTestSource = hitTestSource;
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

    document.querySelector('a-scene').setAttribute('hit-test-placer', '');

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
      },
    })
  } catch (error) {
    console.error('Error serving Surface AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
