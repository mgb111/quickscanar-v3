'use client'

import { useEffect, useRef, useState } from 'react'

// Static assets provided by user
const MIND_FILE = 'https://pub-cf0963a3225741748e1469cc318f690d.r2.dev/targets72.mind'
const VIDEO_URL = 'https://pub-cf0963a3225741748e1469cc318f690d.r2.dev/amrita-intro.mp4'
const MARKER_IMAGE = 'https://pub-cf0963a3225741748e1469cc318f690d.r2.dev/Amritafront.png'

export const metadata = {
  title: 'Amrita Card – AR Experience',
  description: 'Point your camera at the Amrita marker to play the AR video.'
}

export default function Page() {
  const [started, setStarted] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const sceneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Inject A-Frame and MindAR scripts on demand
    const addScript = (src: string) => new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load ' + src))
      document.head.appendChild(s)
    })

    let cancelled = false
    const load = async () => {
      try {
        await addScript('https://aframe.io/releases/1.4.1/aframe.min.js')
        await addScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js')
        if (!cancelled) setSceneReady(true)
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="min-h-screen bg-cream">
      {/* Start overlay */}
      {!started && (
        <div className="fixed inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.9)' }}>
          <div className="text-center text-black bg-white border-2 border-black rounded-2xl p-6 max-w-md w-[90vw] shadow-2xl">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#dc2626' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <h1 className="text-xl font-extrabold mb-2">Amrita – AR Experience</h1>
            <p className="opacity-80 mb-4">Tap Start, allow camera access, and point at the marker below.</p>
            <div className="bg-cream border border-black/20 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium mb-2">Marker image</p>
              <img src={MARKER_IMAGE} alt="AR Marker" className="w-full rounded-md border border-black/10" />
            </div>
            <button
              onClick={() => setStarted(true)}
              className="bg-red-600 text-white border-2 border-black rounded-xl px-5 py-3 font-semibold shadow-lg hover:bg-red-700"
              disabled={!sceneReady}
            >
              {sceneReady ? 'Start AR Experience' : 'Loading...' }
            </button>
          </div>
        </div>
      )}

      {/* AR Scene container */}
      <div ref={sceneRef} className="w-screen h-screen relative">
        {sceneReady && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <div dangerouslySetInnerHTML={{ __html: `
            <a-scene
              mindar-image="imageTargetSrc: ${MIND_FILE}; filterMinCF: 0.0001; filterBeta: 0.001; maxTrack: 1;"
              color-space="sRGB"
              renderer="colorManagement: true, physicallyCorrectLights: true, antialias: true, alpha: true"
              vr-mode-ui="enabled: false"
              device-orientation-permission-ui="enabled: false"
              embedded
              loading-screen="enabled: false"
              style="opacity:${started ? 1 : 0}; transition: opacity .3s ease;"
            >
              <a-assets>
                <video id="arVideo" src="${VIDEO_URL}" loop muted playsinline crossorigin="anonymous" preload="auto"></video>
              </a-assets>
              <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
              <a-entity mindar-image-target="targetIndex: 0">
                <a-plane id="videoPlane" width="1" height="1" position="0 0 0.01" material="src: #arVideo; shader: flat"></a-plane>
              </a-entity>
            </a-scene>
            <script>
              (function(){
                const video = document.getElementById('arVideo');
                document.addEventListener('targetFound', () => { try { video.play(); } catch(e){} });
                document.addEventListener('targetLost', () => { try { video.pause(); } catch(e){} });
              })();
            </script>
          ` }} />
        )}
      </div>
    </main>
  )
}
