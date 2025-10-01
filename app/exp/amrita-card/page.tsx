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
            <script>
              !function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var i=e();for(var s in i)("object"==typeof exports?exports:t)[s]=i[s]}}("undefined"!=typeof self?self:this,(()=>(()=>{"use strict";var t={d:(e,i)=>{for(var s in i)t.o(i,s)&&!t.o(e,s)&&Object.defineProperty(e,s,{enumerable:!0,get:i[s]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{LowPassFilter:()=>i,OneEuroFilter:()=>s});class i{setAlpha(t){(t<=0||t>1)&&console.log("alpha should be in (0.0., 1.0]"),this.a=t}constructor(t,e=0){this.y=this.s=e,this.setAlpha(t),this.initialized=!1}filter(t){var e;return this.initialized?e=this.a*t+(1-this.a)*this.s:(e=t,this.initialized=!0),this.y=t,this.s=e,e}filterWithAlpha(t,e){return this.setAlpha(e),this.filter(t)}hasLastRawValue(){return this.initialized}lastRawValue(){return this.y}reset(){this.initialized=!1}}class s{alpha(t){var e=1/this.freq;return 1/(1+1/(2*Math.PI*t)/e)}setFrequency(t){t<=0&&console.log("freq should be >0"),this.freq=t}setMinCutoff(t){t<=0&&console.log("mincutoff should be >0"),this.mincutoff=t}setBeta(t){this.beta_=t}setDerivateCutoff(t){t<=0&&console.log("dcutoff should be >0"),this.dcutoff=t}constructor(t,e=1,s=0,h=1){this.setFrequency(t),this.setMinCutoff(e),this.setBeta(s),this.setDerivateCutoff(h),this.x=new i(this.alpha(e)),this.dx=new i(this.alpha(h)),this.lasttime=void 0}reset(){this.x.reset(),this.dx.reset(),this.lasttime=void 0}filter(t,e=undefined){null!=this.lasttime&&null!=e&&(this.freq=1/(e-this.lasttime)),this.lasttime=e;var i=this.x.hasLastRawValue()?(t-this.x.lastRawValue())*this.freq:0,s=this.dx.filterWithAlpha(i,this.alpha(this.dcutoff)),h=this.mincutoff+this.beta_*Math.abs(s);return this.x.filterWithAlpha(t,this.alpha(h))}}return e})()));
            </script>
            <script>
              AFRAME.registerComponent('one-euro-smoother', {
                schema: { smoothingFactor: { type: 'number', default: 0.08 }, freq: { type: 'number', default: 60 }, mincutoff: { type: 'number', default: 0.8 }, beta: { type: 'number', default: 0.7 }, dcutoff: { type: 'number', default: 1.0 }, posDeadzone: { type: 'number', default: 0.002 }, rotDeadzoneDeg: { type: 'number', default: 0.8 }, emaFactor: { type: 'number', default: 0.12 }, mode: { type: 'string', default: 'ultra_lock' }, throttleHz: { type: 'number', default: 30 }, medianWindow: { type: 'number', default: 5 }, zeroRoll: { type: 'boolean', default: true }, homographySmoothing: { type: 'number', default: 0.15 }, minMovementThreshold: { type: 'number', default: 0.001 } },
                init: function () { const { freq, mincutoff, beta, dcutoff } = this.data; this.positionSmoother = { x: new OneEuroFilter(freq, mincutoff, beta, dcutoff), y: new OneEuroFilter(freq, mincutoff, beta, dcutoff), z: new OneEuroFilter(freq, mincutoff, beta, dcutoff) }; this.rotationSmoother = { x: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff), y: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff), z: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff), w: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff) }; this.rawMatrix = new THREE.Matrix4(); this.tmpVec = new THREE.Vector3(); this.tmpQuat = new THREE.Quaternion(); this.tmpEuler = new THREE.Euler(); this._posHistory = []; this._lastApply = 0; this._lastRawPosition = new THREE.Vector3(); this._lastRawQuaternion = new THREE.Quaternion(); this._isFirstFrame = true; this._stickyLocked = false; this._stickyCounter = 0; this._stickyThreshold = 2; this._lockedPosition = new THREE.Vector3(); this._lockedQuaternion = new THREE.Quaternion(); this._lockStrength = 0.999; },
                tick: function (t, dt) { if (!this.el.object3D.visible) return; const { smoothingFactor, posDeadzone, rotDeadzoneDeg, emaFactor, mode, throttleHz, medianWindow, zeroRoll, minMovementThreshold } = this.data; const timestamp = t / 1000; const interval = 1000 / Math.max(1, throttleHz || 3); if (this._lastApply && (t - this._lastApply) < interval) { return; } this._lastApply = t; this.rawMatrix.copy(this.el.object3D.matrix); const rawPosition = new THREE.Vector3(); const rawQuaternion = new THREE.Quaternion(); const rawScale = new THREE.Vector3(); this.rawMatrix.decompose(rawPosition, rawQuaternion, rawScale); if (!this._isFirstFrame) { const positionDelta = rawPosition.distanceTo(this._lastRawPosition); const quaternionDelta = 1 - Math.abs(rawQuaternion.dot(this._lastRawQuaternion)); if (positionDelta < minMovementThreshold && quaternionDelta < minMovementThreshold * 10) { this._stickyCounter++; if (this._stickyCounter >= this._stickyThreshold) { this._stickyLocked = true; } } else { this._stickyCounter = 0; this._stickyLocked = false; } } if (this._stickyLocked) { rawPosition.lerp(this._lockedPosition, this._lockStrength); rawQuaternion.slerp(this._lockedQuaternion, this._lockStrength); } else { this._lockedPosition.copy(rawPosition); this._lockedQuaternion.copy(rawQuaternion); } this._lastRawPosition.copy(rawPosition); this._lastRawQuaternion.copy(rawQuaternion); this._isFirstFrame = false; let usePos = rawPosition; if (mode === 'ultra_lock' && medianWindow > 1) { this._posHistory.push(rawPosition.clone()); const maxN = Math.min(7, Math.max(2, Math.floor(medianWindow))); while (this._posHistory.length > maxN) this._posHistory.shift(); const med = (arr)=>{ const s = [...arr].sort((a,b)=>a-b); const mid = Math.floor(s.length / 2); return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]; }; if (this._posHistory.length >= 2) { usePos = new THREE.Vector3( med(this._posHistory.map(p=>p.x)), med(this._posHistory.map(p=>p.y)), med(this._posHistory.map(p=>p.z)) ); } } else { this._posHistory.length = 0; } const smoothedPosition = new THREE.Vector3( this.positionSmoother.x.filter(usePos.x, timestamp), this.positionSmoother.y.filter(usePos.y, timestamp), this.positionSmoother.z.filter(usePos.z, timestamp) ); const currentPos = this.el.object3D.position; const positionDelta = smoothedPosition.distanceTo(currentPos); if (positionDelta < posDeadzone) { smoothedPosition.copy(currentPos); } let smoothedQuaternion; if (mode === 'ultra_lock') { smoothedQuaternion = new THREE.Quaternion( this.rotationSmoother.x.filter(rawQuaternion.x, timestamp), this.rotationSmoother.y.filter(rawQuaternion.y, timestamp), this.rotationSmoother.z.filter(rawQuaternion.z, timestamp), this.rotationSmoother.w.filter(rawQuaternion.w, timestamp) ).normalize(); const currentQuat = this.el.object3D.quaternion; const rotationDelta = Math.acos(Math.abs(smoothedQuaternion.dot(currentQuat))) * (180 / Math.PI); if (rotationDelta < rotDeadzoneDeg * 2) { smoothedQuaternion.slerp(currentQuat, 0.7); } } else { const currentQuat = this.el.object3D.quaternion; smoothedQuaternion = currentQuat.clone().slerp(rawQuaternion, smoothingFactor); } const currentQuat = this.el.object3D.quaternion; const rotationDelta = Math.acos(Math.abs(smoothedQuaternion.dot(currentQuat))) * (180 / Math.PI); if (rotationDelta < rotDeadzoneDeg) { smoothedQuaternion.copy(currentQuat); } if (zeroRoll) { this.tmpEuler.setFromQuaternion(smoothedQuaternion, 'XYZ'); this.tmpEuler.z = 0; smoothedQuaternion.setFromEuler(this.tmpEuler); } if (emaFactor > 0 && emaFactor < 1) { const ultraStableEma = emaFactor * 0.01; smoothedPosition.lerp(currentPos, 1 - ultraStableEma); smoothedQuaternion.slerp(currentQuat, 1 - ultraStableEma); } this.el.object3D.position.copy(smoothedPosition); this.el.object3D.quaternion.copy(smoothedQuaternion); this.el.object3D.scale.copy(rawScale); }
              });
            </script>
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
              <a-entity id="target" mindar-image-target="targetIndex: 0" one-euro-smoother="mode: ultra_lock; smoothingFactor: 0.001; freq: 5; mincutoff: 0.001; beta: 0.001; dcutoff: 1.0; posDeadzone: 0.000001; rotDeadzoneDeg: 0.001; emaFactor: 0.001; throttleHz: 3; medianWindow: 15; zeroRoll: true; minMovementThreshold: 0.0000001">
                <a-plane id="backgroundPlane" width="1" height="1" position="0 0 0.005" rotation="0 0 0" material="color: #000000" visible="false"></a-plane>
                <a-plane id="videoPlane" width="1" height="1" position="0 0 0.01" rotation="0 0 0" material="src: #arVideo; transparent: true; alphaTest: 0.1; shader: flat" visible="false"></a-plane>
              </a-entity>
            </a-scene>
            <script>
              (function(){
                const video = document.getElementById('arVideo');
                const videoPlane = document.getElementById('videoPlane');
                const bgPlane = document.getElementById('backgroundPlane');
                function updateVideoAspectRatio() {
                  if (!video || !video.videoWidth || !video.videoHeight) return;
                  const aspect = video.videoWidth / video.videoHeight;
                  const markerW = 1.0; const scale = 1.2;
                  let w, h; if (aspect > 1) { w = markerW * scale; h = w / aspect; } else { h = markerW * scale; w = h * aspect; }
                  if (videoPlane) { videoPlane.setAttribute('width', String(w)); videoPlane.setAttribute('height', String(h)); }
                  if (bgPlane) { bgPlane.setAttribute('width', String(w)); bgPlane.setAttribute('height', String(h)); }
                }
                video.addEventListener('loadedmetadata', updateVideoAspectRatio);
                document.addEventListener('targetFound', () => {
                  try { video.play(); } catch(e){}
                  if (videoPlane) videoPlane.setAttribute('visible', 'true');
                  if (bgPlane) bgPlane.setAttribute('visible', 'true');
                });
                document.addEventListener('targetLost', () => {
                  try { video.pause(); } catch(e){}
                });
              })();
            </script>
          ` }} />
        )}
      </div>
    </main>
  )
}
