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

    const hasModel = !!experience.model_url
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${experience.title} - Portal AR</title>
  <script src="https://aframe.io/releases/1.4.1/aframe.min.js"></script>
  <script src="/js/portal-effect.js"></script>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #000; }
    #ui { position: fixed; z-index: 10; left: 0; right: 0; bottom: 20px; display: flex; justify-content: center; }
    #startBtn { background:#111827; color:#fff; border:2px solid #000; border-radius:9999px; padding:14px 22px; font-weight:800; box-shadow:0 8px 20px rgba(0,0,0,0.35); }
    #hint { position: fixed; top: 16px; left: 16px; right: 16px; color:#fff; background: rgba(0,0,0,0.65); padding: 10px 12px; border-radius: 10px; z-index: 10; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto, sans-serif; font-weight: 600; }
    #reticle { display: none; }
  </style>
</head>
<body>
  <div id="hint">Move your device to find a surface, then tap to place the portal</div>
  <div id="ui"><button id="startBtn">Start AR</button></div>

  ${hasModel ? `
  <a-scene
    renderer="colorManagement: true, physicallyCorrectLights: true, alpha: true"
    webxr="optionalFeatures: hit-test, dom-overlay; overlayElement: #ui"
    vr-mode-ui="enabled: false"
    embedded
    loading-screen="enabled: false"
    background="color: #000000"
    id="scene"
  >
    <a-assets>
      <a-asset-item id="mdl" src="${experience.model_url}"></a-asset-item>
    </a-assets>

    <a-entity id="arCamera" camera look-controls position="0 1.6 0"></a-entity>

    <!-- Reticle -->
    <a-entity id="reticle" geometry="primitive: ring; radiusInner: 0.05; radiusOuter: 0.06" rotation="-90 0 0"
              material="color: #00ffff; emissive: #00ffff; emissiveIntensity: 0.9; shader: standard; opacity: 0.9; transparent: true"></a-entity>

    <!-- Container that will be placed -->
    <a-entity id="portalContainer" visible="false">
      <a-entity
        id="portalModel"
        gltf-model="#mdl"
        position="0 0 0"
        rotation="0 ${experience.model_rotation || 0} 0"
        scale="${experience.model_scale || 1} ${experience.model_scale || 1} ${experience.model_scale || 1}"
        animation-mixer="clip: *; loop: repeat; clampWhenFinished: false"
        ${experience.portal_enabled ? `portal-effect="enabled: true; color: ${experience.portal_color || '#00ffff'}; intensity: ${experience.portal_intensity || 0.8}; frameEnabled: ${experience.portal_frame_enabled !== false}; frameThickness: ${experience.portal_frame_thickness || 0.05}; animation: ${experience.portal_animation || 'pulse'}"` : ''}
      ></a-entity>
    </a-entity>

    <a-entity light="type: ambient; intensity: 0.8"></a-entity>
    <a-entity light="type: directional; intensity: 0.8" position="0 3 1"></a-entity>
  </a-scene>
  ` : '<div style="color:#fff;padding:20px;font-family:sans-serif;">No 3D model available for portal AR.</div>'}

  <script>
    const scene = document.getElementById('scene');
    const startBtn = document.getElementById('startBtn');
    const reticleEl = document.getElementById('reticle');
    const container = document.getElementById('portalContainer');

    let xrHitTestSource = null;
    let viewerSpace = null;
    let localSpace = null;
    let session = null;
    let placed = false;

    function onSessionEnd() {
      xrHitTestSource = null;
      viewerSpace = null;
      localSpace = null;
      session = null;
      placed = false;
      if (reticleEl) reticleEl.setAttribute('visible', false);
      if (container) container.setAttribute('visible', false);
    }

    async function startAR() {
      try {
        if (!scene) return;
        await scene.renderer.xr.setSession(await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: document.body }
        }));
        session = scene.renderer.xr.getSession();

        session.addEventListener('end', onSessionEnd);

        const refSpace = await session.requestReferenceSpace('local');
        localSpace = refSpace;
        viewerSpace = await session.requestReferenceSpace('viewer');
        const source = await session.requestHitTestSource({ space: viewerSpace });
        xrHitTestSource = source;

        // Render loop to update reticle
        scene.renderer.xr.addEventListener('sessionstart', () => {
          reticleEl && reticleEl.setAttribute('visible', true);
        });

        // Touch to place portal
        document.body.addEventListener('click', () => {
          if (reticleEl && reticleEl.object3D.visible && container) {
            const p = reticleEl.object3D.position;
            const r = reticleEl.object3D.rotation;
            container.object3D.position.set(p.x, p.y, p.z);
            container.object3D.rotation.set(0, r.y, 0);
            container.setAttribute('visible', true);
            placed = true;
            document.getElementById('hint')?.remove();
            document.getElementById('ui')?.remove();
          }
        });
      } catch (e) {
        alert('AR not supported on this device/browser');
        console.error(e);
      }
    }

    // Update reticle every frame
    AFRAME.registerComponent('hit-test-updater', {
      tick: function (time, delta) {
        if (!session || !xrHitTestSource || !localSpace || !reticleEl) return;
        const frame = scene.renderer.xr.getFrame();
        if (!frame) return;
        const hits = frame.getHitTestResults(xrHitTestSource);
        if (hits && hits.length) {
          const pose = hits[0].getPose(localSpace);
          reticleEl.object3D.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
          const q = pose.transform.orientation; // align reticle to facing camera
          const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w));
          reticleEl.object3D.rotation.set(-Math.PI/2, euler.y, 0);
          reticleEl.object3D.visible = true;
        } else {
          reticleEl.object3D.visible = false;
        }
      }
    });

    if (scene) scene.setAttribute('hit-test-updater', '');
    if (startBtn) startBtn.addEventListener('click', startAR);
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
    console.error('Error serving Portal AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
