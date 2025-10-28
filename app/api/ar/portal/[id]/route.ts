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

    if (!experience.model_url) {
      return new NextResponse('Portal requires a 3D model (GLB/GLTF)', { status: 400 })
    }

    const modelScale = Math.max(0.001, Number(experience.model_scale) || 1.0)
    const modelRotation = Number(experience.model_rotation) || 0

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#0f0f23" />
  <title>${experience.title} - AR Portal</title>
  <script src="https://aframe.io/releases/1.4.1/aframe.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/aframe-extras@6.1.1/dist/aframe-extras.loaders.min.js"></script>
  <script type="module" src="https://unpkg.com/@google/model-viewer@3.3.0/dist/model-viewer.min.js"></script>
  <style>
    html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
    a-scene { width: 100vw; height: 100vh; }
    .hint { position: fixed; left: 50%; transform: translateX(-50%); bottom: 24px; color: #fff; background: rgba(0,0,0,0.6); border: 1px solid #000; border-radius: 12px; padding: 10px 14px; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-weight: 700; z-index: 10; }
    .hint small { display: block; font-weight: 500; opacity: 0.9; }
    /* Overlay for pre-AR interactive preview */
    #overlay { position: fixed; inset: 0; background: radial-gradient(1200px 600px at 50% 100%, rgba(15,23,42,0.95), rgba(0,0,0,0.98)); z-index: 20; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
    #overlay.hidden { display: none; }
    #startBtn { background: #dc2626; color: #fff; border: 2px solid #000; border-radius: 9999px; padding: 14px 22px; font-weight: 800; font-size: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.35); cursor: pointer; }
    #startBtn:active { transform: scale(0.98); }
    #preview { width: min(520px, 92vw); height: min(66vh, 520px); background: transparent; border-radius: 16px; overflow: hidden; }
    #note { color: #cbd5e1; font-weight: 600; font-size: 14px; text-align: center; }
  </style>
  <script>
    // Simple inside/outside portal logic
    AFRAME.registerComponent('portal-gate', {
      schema: {
        width: { type: 'number', default: 1.2 },
        height: { type: 'number', default: 2.2 },
        depth: { type: 'number', default: 0.1 },
        planeNormal: { type: 'vec3', default: { x: 0, y: 0, z: 1 } },
        immersiveDistance: { type: 'number', default: -0.2 } // relative to portal local Z
      },
      init: function () {
        this.camera = this.el.sceneEl && this.el.sceneEl.camera && this.el.sceneEl.camera.el
        this._inside = false
        this.portalPlane = new THREE.Plane(new THREE.Vector3(0,0,1), 0) // local +Z plane
        // Visual frame (door arch)
        const frame = document.createElement('a-entity')
        frame.setAttribute('id', 'portalFrame')
        // Outer ring
        const ring = document.createElement('a-entity')
        ring.setAttribute('geometry', 'primitive: torus; radius: 0.9; radiusTubular: 0.06; segmentsRadial: 20; segmentsTubular: 80')
        ring.setAttribute('material', 'color: #7dd3fc; metalness: 0.2; roughness: 0.4; emissive: #0ea5e9; emissiveIntensity: 0.6')
        ring.setAttribute('rotation', '-90 0 0')
        ring.setAttribute('position', '0 1.5 0')
        frame.appendChild(ring)
        // Inner glowing circle for guidance
        const glow = document.createElement('a-ring')
        glow.setAttribute('radius-inner', '0.75')
        glow.setAttribute('radius-outer', '0.78')
        glow.setAttribute('material', 'color: #93c5fd; emissive: #60a5fa; emissiveIntensity: 0.9; side: double; transparent: true; opacity: 0.9')
        glow.setAttribute('position', '0 1.5 0.01')
        frame.appendChild(glow)
        this.el.appendChild(frame)

        // A subtle floor disc inside portal for orientation
        const floor = document.createElement('a-cylinder')
        floor.setAttribute('radius', '0.65')
        floor.setAttribute('height', '0.02')
        floor.setAttribute('position', '0 0.01 -0.6')
        floor.setAttribute('rotation', '0 0 0')
        floor.setAttribute('material', 'color: #111827; metalness: 0.1; roughness: 1.0; opacity: 0.85')
        this.el.appendChild(floor)

        // Black vignette behind the gate to create contrast with camera feed
        const backdrop = document.createElement('a-circle')
        backdrop.setAttribute('radius', '0.8')
        backdrop.setAttribute('position', '0 1.5 -0.02')
        backdrop.setAttribute('material', 'color: #000; opacity: 0.6; side: double')
        this.el.appendChild(backdrop)

        // Immersive environment container (initially hidden until inside)
        const env = document.createElement('a-entity')
        env.setAttribute('id', 'envContainer')
        env.setAttribute('visible', 'false')
        // Make a huge inverted sphere so it surrounds the user when inside
        const sky = document.createElement('a-sphere')
        sky.setAttribute('radius', '20')
        sky.setAttribute('material', 'color: #000; side: back; opacity: 1')
        env.appendChild(sky)
        this.el.appendChild(env)

        // Move the content model under the env container (cloned from template placeholder)
        const modelT = document.getElementById('contentModelT')
        if (modelT) {
          const model = modelT.cloneNode(true)
          model.setAttribute('id', 'contentModel')
          // Place it a bit in front so once inside, it surrounds the user
          model.setAttribute('position', '0 0 -1.5')
          model.setAttribute('visible', 'true')
          env.appendChild(model)
        }
      },
      tick: function () {
        if (!this.camera) return
        // Compute camera position in portal local space
        const camObj = this.camera.object3D
        const portalObj = this.el.object3D
        const camWorld = new THREE.Vector3()
        camObj.getWorldPosition(camWorld)
        const portalWorldInv = new THREE.Matrix4().copy(portalObj.matrixWorld).invert()
        const camLocal = camWorld.clone().applyMatrix4(portalWorldInv)

        const env = this.el.querySelector('#envContainer')
        const frame = this.el.querySelector('#portalFrame')

        // If camera is beyond the portal plane (local z < immersiveDistance) -> inside
        const inside = camLocal.z < this.data.immersiveDistance
        if (inside !== this._inside) {
          this._inside = inside
          if (env && frame) {
            if (inside) {
              env.setAttribute('visible', 'true')
              frame.setAttribute('visible', 'false')
              const hint = document.getElementById('hint')
              if (hint) hint.textContent = 'Inside portal — explore the scene around you'
            } else {
              env.setAttribute('visible', 'false')
              frame.setAttribute('visible', 'true')
              const hint = document.getElementById('hint')
              if (hint) hint.textContent = 'Walk forward to enter the portal'
            }
          }
        }
      }
    })
  </script>
</head>
<body>
  <div id="hint" class="hint">Walk forward to enter the portal<small>Move physically toward the glowing ring</small></div>

  <!-- Pre-AR interactive preview overlay -->
  <div id="overlay">
    <model-viewer id="preview"
      src="${experience.model_url}"
      camera-controls
      auto-rotate
      exposure="1.0"
      shadow-intensity="1"
      style="background: transparent;"
    ></model-viewer>
    <button id="startBtn" type="button">Start AR</button>
    <div id="note">Preview the 3D model, then start AR to see the portal with your camera feed</div>
  </div>

  <a-scene
    renderer="colorManagement: true, physicallyCorrectLights: true, antialias: true, alpha: true"
    xr-mode-ui="enabled: true"
    webxr="requiredFeatures: local-floor; optionalFeatures: hit-test, dom-overlay; overlayElement: #hint"
    vr-mode-ui="enabled: false"
    device-orientation-permission-ui="enabled: false"
    embedded
  >
    <a-entity id="rig">
      <a-entity id="camera" camera look-controls position="0 1.6 0"></a-entity>
    </a-entity>

    <!-- Lights -->
    <a-entity light="type: ambient; intensity: 0.6"></a-entity>
    <a-entity light="type: directional; intensity: 0.8" position="1 2 1"></a-entity>

    <!-- Portal placed ~2 meters ahead -->
    <a-entity id="portal" position="0 0 -2" portal-gate>
      <!-- Content model template (cloned into env on init) -->
      <a-entity id="contentModelT"
        gltf-model="${experience.model_url}"
        scale="${modelScale} ${modelScale} ${modelScale}"
        rotation="0 ${modelRotation} 0"
        visible="false"
        animation-mixer
      ></a-entity>
    </a-entity>

    <!-- Ground reticle is NOT used (no placement) -->
  </a-scene>

  <script>
    // Explicit AR start with fallback
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene')
      const overlay = document.getElementById('overlay')
      const startBtn = document.getElementById('startBtn')
      const hint = document.getElementById('hint')

      const enterAR = async () => {
        try {
          // Preferred path via A-Frame
          if (scene && scene.enterVR) {
            await scene.enterVR()
            if (overlay) overlay.classList.add('hidden')
            return
          }
        } catch (e) {
          // Fall through
        }
        // Manual WebXR session as fallback
        try {
          const xr = navigator.xr
          if (!xr || !xr.requestSession) throw new Error('WebXR not available')
          const session = await xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
          })
          const threeRenderer = scene && scene.renderer
          if (threeRenderer && threeRenderer.xr && threeRenderer.xr.setSession) {
            await threeRenderer.xr.setSession(session)
            if (overlay) overlay.classList.add('hidden')
          }
        } catch (err) {
          // Keep preview; show info
          if (hint) hint.textContent = 'AR not supported on this device/browser'
        }
      }

      if (startBtn) startBtn.addEventListener('click', enterAR)

      // Show overlay preview by default; user taps Start AR
      if (overlay) overlay.classList.remove('hidden')
    })
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
        'Permissions-Policy': 'camera=(self), xr-spatial-tracking=(self)'
      },
    })
  } catch (error) {
    console.error('Error serving AR portal experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
