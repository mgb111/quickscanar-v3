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

    // Debug: Log the experience data
    console.log('AR Experience Data:', {
      id: experience.id,
      title: experience.title,
      marker_image_url: experience.marker_image_url,
      mind_file_url: experience.mind_file_url,
      video_url: experience.video_url
    })

    const mindFileUrl = experience.mind_file_url || 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'

    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#1a1a2e" />
    <meta name="msapplication-navbutton-color" content="#1a1a2e" />
    <meta name="apple-mobile-web-app-title" content="AR Experience" />
    <title>${experience.title} - AR Experience</title>
    <script src="https://aframe.io/releases/1.4.1/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
    <script>
      !function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var i=e();for(var s in i)("object"==typeof exports?exports:t)[s]=i[s]}}("undefined"!=typeof self?self:this,(()=>(()=>{"use strict";var t={d:(e,i)=>{for(var s in i)t.o(i,s)&&!t.o(e,s)&&Object.defineProperty(e,s,{enumerable:!0,get:i[s]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{LowPassFilter:()=>i,OneEuroFilter:()=>s});class i{setAlpha(t){(t<=0||t>1)&&console.log("alpha should be in (0.0., 1.0]"),this.a=t}constructor(t,e=0){this.y=this.s=e,this.setAlpha(t),this.initialized=!1}filter(t){var e;return this.initialized?e=this.a*t+(1-this.a)*this.s:(e=t,this.initialized=!0),this.y=t,this.s=e,e}filterWithAlpha(t,e){return this.setAlpha(e),this.filter(t)}hasLastRawValue(){return this.initialized}lastRawValue(){return this.y}reset(){this.initialized=!1}}class s{alpha(t){var e=1/this.freq;return 1/(1+1/(2*Math.PI*t)/e)}setFrequency(t){t<=0&&console.log("freq should be >0"),this.freq=t}setMinCutoff(t){t<=0&&console.log("mincutoff should be >0"),this.mincutoff=t}setBeta(t){this.beta_=t}setDerivateCutoff(t){t<=0&&console.log("dcutoff should be >0"),this.dcutoff=t}constructor(t,e=1,s=0,h=1){this.setFrequency(t),this.setMinCutoff(e),this.setBeta(s),this.setDerivateCutoff(h),this.x=new i(this.alpha(e)),this.dx=new i(this.alpha(h)),this.lasttime=void 0}reset(){this.x.reset(),this.dx.reset(),this.lasttime=void 0}filter(t,e=undefined){null!=this.lasttime&&null!=e&&(this.freq=1/(e-this.lasttime)),this.lasttime=e;var i=this.x.hasLastRawValue()?(t-this.x.lastRawValue())*this.freq:0,s=this.dx.filterWithAlpha(i,this.alpha(this.dcutoff)),h=this.mincutoff+this.beta_*Math.abs(s);return this.x.filterWithAlpha(t,this.alpha(h))}}return e})()));
    </script>
    <script>
      AFRAME.registerComponent('one-euro-smoother', {
        schema: {
          // Lower value = more smoothing, less responsive
          smoothingFactor: { type: 'number', default: 0.1 },
          // One-Euro filter params for position
          freq: { type: 'number', default: 120 },
          mincutoff: { type: 'number', default: 0.5 }, // Lower value = more smoothing for slow movements
          beta: { type: 'number', default: 1.5 }, // Higher value = more smoothing for fast movements
          dcutoff: { type: 'number', default: 1.0 },
          // Extra stabilizers
          posDeadzone: { type: 'number', default: 0.0015 }, // meters; ignore micro translation noise
          rotDeadzoneDeg: { type: 'number', default: 0.4 }, // degrees; ignore micro rotation noise
          emaFactor: { type: 'number', default: 0.15 }, // 0..1, additional EMA blend after One-Euro
          // Ultra lock controls
          mode: { type: 'string', default: 'normal' }, // 'normal' | 'ultra_lock'
          throttleHz: { type: 'number', default: 60 }, // apply transforms at most this often
          medianWindow: { type: 'number', default: 3 }, // median window size for position
          zeroRoll: { type: 'boolean', default: false }, // lock roll around marker normal
        },

        init: function () {
          const { freq, mincutoff, beta, dcutoff } = this.data;
          
          // One-Euro filter for position to smooth out jitter from camera shake.
          this.positionSmoother = {
            x: new OneEuroFilter(freq, mincutoff, beta, dcutoff),
            y: new OneEuroFilter(freq, mincutoff, beta, dcutoff),
            z: new OneEuroFilter(freq, mincutoff, beta, dcutoff),
          };

          // We will use a separate matrix to hold the raw, unsmoothed transform from MindAR.
          this.rawMatrix = new THREE.Matrix4();
          this.tmpVec = new THREE.Vector3();
          this.tmpQuat = new THREE.Quaternion();

          // Position history for median filtering
          this._posHistory = [];
          this._lastApply = 0;
        },

        tick: function (t, dt) {
          // Only run if the target is visible.
          if (!this.el.object3D.visible) return;

          const { smoothingFactor, posDeadzone, rotDeadzoneDeg, emaFactor, mode, throttleHz, medianWindow, zeroRoll } = this.data;
          const timestamp = t / 1000; // OneEuroFilter requires timestamp in seconds.

          // Throttle updates to reduce visible micro jitter
          const interval = 1000 / Math.max(15, throttleHz || 60);
          if (this._lastApply && (t - this._lastApply) < interval) {
            return;
          }
          this._lastApply = t;

          // 1. Get the raw matrix from the underlying MindAR object.
          // This matrix is updated by MindAR with the raw tracking data.
          this.rawMatrix.copy(this.el.object3D.matrix);

          // 2. Decompose the raw matrix into its position, quaternion, and scale components.
          const rawPosition = new THREE.Vector3();
          const rawQuaternion = new THREE.Quaternion();
          const rawScale = new THREE.Vector3();
          this.rawMatrix.decompose(rawPosition, rawQuaternion, rawScale);

          // 3. Smooth the position using a median filter (optional) then One-Euro filter.
          // This reduces translational jitter (shakiness).
          let usePos = rawPosition;
          if (mode === 'ultra_lock' && medianWindow > 1) {
            // push copy
            this._posHistory.push(rawPosition.clone());
            const maxN = Math.min(7, Math.max(2, Math.floor(medianWindow)));
            while (this._posHistory.length > maxN) this._posHistory.shift();
            // compute median per axis
            const med = (arr)=>{
              const a = arr.slice().sort((a,b)=>a-b);
              const m = Math.floor(a.length/2);
              return a.length % 2 ? a[m] : 0.5*(a[m-1]+a[m]);
            };
            const xs = this._posHistory.map(v=>v.x);
            const ys = this._posHistory.map(v=>v.y);
            const zs = this._posHistory.map(v=>v.z);
            usePos = new THREE.Vector3(med(xs), med(ys), med(zs));
          } else {
            // reset history to avoid lag when switching
            this._posHistory.length = 0;
          }

          const smoothedPosition = {
            x: this.positionSmoother.x.filter(usePos.x, timestamp),
            y: this.positionSmoother.y.filter(usePos.y, timestamp),
            z: this.positionSmoother.z.filter(usePos.z, timestamp),
          };

          // 3b. Apply a deadzone and an extra EMA blend to damp tiny residual motions further.
          const currentPos = this.el.object3D.position;
          // Deadzone: if movement is below threshold, keep current axis value
          const dz = posDeadzone;
          const targetPos = this.tmpVec.set(
            Math.abs(smoothedPosition.x - currentPos.x) < dz ? currentPos.x : smoothedPosition.x,
            Math.abs(smoothedPosition.y - currentPos.y) < dz ? currentPos.y : smoothedPosition.y,
            Math.abs(smoothedPosition.z - currentPos.z) < dz ? currentPos.z : smoothedPosition.z,
          );
          // EMA blend: current := lerp(current, target, emaFactor)
          currentPos.lerp(targetPos, emaFactor);

          // 4. Smooth the rotation using spherical linear interpolation (Slerp).
          // This provides a much more stable and natural rotational smoothing than filtering Euler angles.
          // It smoothly interpolates from the object's current orientation to the new raw orientation.
          const currentQuaternion = this.el.object3D.quaternion;
          // Compute angular difference in degrees
          const dot = THREE.MathUtils.clamp(currentQuaternion.dot(rawQuaternion), -1, 1);
          const angleRad = 2 * Math.acos(Math.abs(dot));
          const angleDeg = THREE.MathUtils.radToDeg(angleRad);
          // Deadzone for rotation: ignore micro rotation
          if (angleDeg > rotDeadzoneDeg) {
            // Adaptive slerp: larger differences get slightly higher interpolation for responsiveness
            const adapt = THREE.MathUtils.clamp(smoothingFactor + (angleDeg / 90) * 0.05, 0.05, 0.35);
            currentQuaternion.slerp(rawQuaternion, adapt);
          }

          // Optional zero-roll correction to keep content visually flat to the marker
          if (mode === 'ultra_lock' && zeroRoll) {
            const e = new THREE.Euler().setFromQuaternion(currentQuaternion, 'YXZ');
            e.z = 0; // remove roll
            currentQuaternion.setFromEuler(e);
          }

          // 5. Position already updated via EMA lerp. Quaternion updated via slerp above.
        }
      });
    </script>
    <script>
      // 10 AR Tracking Modes with different characteristics
      const AR_MODES = {
        1: {
          name: "Raw Tracking",
          description: "No smoothing, maximum responsiveness",
          mindar: { filterMinCF: 0.0001, filterBeta: 1, interpolation: false, smoothing: false },
          smoother: { mode: 'normal', smoothingFactor: 0.9, mincutoff: 5.0, beta: 0.1, posDeadzone: 0.0001, rotDeadzoneDeg: 0.1, emaFactor: 0.05 }
        },
        2: {
          name: "Light Smoothing",
          description: "Minimal filtering, very responsive",
          mindar: { filterMinCF: 0.001, filterBeta: 3, interpolation: true, smoothing: false },
          smoother: { mode: 'normal', smoothingFactor: 0.3, mincutoff: 2.0, beta: 0.5, posDeadzone: 0.001, rotDeadzoneDeg: 0.3, emaFactor: 0.1 }
        },
        3: {
          name: "Balanced Fast",
          description: "Good responsiveness with light jitter reduction",
          mindar: { filterMinCF: 0.005, filterBeta: 5, interpolation: true, smoothing: true },
          smoother: { mode: 'normal', smoothingFactor: 0.2, mincutoff: 1.5, beta: 1.0, posDeadzone: 0.002, rotDeadzoneDeg: 0.5, emaFactor: 0.15 }
        },
        4: {
          name: "Medium Smooth",
          description: "Balanced smoothness and responsiveness",
          mindar: { filterMinCF: 0.01, filterBeta: 8, interpolation: true, smoothing: true },
          smoother: { mode: 'normal', smoothingFactor: 0.15, mincutoff: 1.0, beta: 1.5, posDeadzone: 0.003, rotDeadzoneDeg: 0.8, emaFactor: 0.2 }
        },
        5: {
          name: "Heavy Filtering",
          description: "Strong smoothing, slight lag",
          mindar: { filterMinCF: 0.02, filterBeta: 12, interpolation: true, smoothing: true },
          smoother: { mode: 'normal', smoothingFactor: 0.1, mincutoff: 0.8, beta: 2.0, posDeadzone: 0.004, rotDeadzoneDeg: 1.0, emaFactor: 0.25 }
        },
        6: {
          name: "Ultra Stable",
          description: "Maximum stability, more lag",
          mindar: { filterMinCF: 0.05, filterBeta: 15, interpolation: true, smoothing: true },
          smoother: { mode: 'ultra_lock', smoothingFactor: 0.08, mincutoff: 0.5, beta: 2.5, posDeadzone: 0.006, rotDeadzoneDeg: 1.5, emaFactor: 0.3, throttleHz: 45, medianWindow: 3, zeroRoll: false }
        },
        7: {
          name: "Predictive Smooth",
          description: "Predictive filtering with interpolation",
          mindar: { filterMinCF: 0.008, filterBeta: 10, interpolation: true, smoothing: true },
          smoother: { mode: 'ultra_lock', smoothingFactor: 0.12, mincutoff: 0.7, beta: 2.2, posDeadzone: 0.0035, rotDeadzoneDeg: 0.9, emaFactor: 0.22, throttleHz: 50, medianWindow: 4, zeroRoll: true }
        },
        8: {
          name: "Cinema Mode",
          description: "Ultra-smooth for video content, slow response",
          mindar: { filterMinCF: 0.1, filterBeta: 20, interpolation: true, smoothing: true },
          smoother: { mode: 'ultra_lock', smoothingFactor: 0.05, mincutoff: 0.3, beta: 3.0, posDeadzone: 0.008, rotDeadzoneDeg: 2.0, emaFactor: 0.4, throttleHz: 30, medianWindow: 5, zeroRoll: true }
        },
        9: {
          name: "Locked Position",
          description: "Maximum lock, minimal movement",
          mindar: { filterMinCF: 0.15, filterBeta: 25, interpolation: true, smoothing: true },
          smoother: { mode: 'ultra_lock', smoothingFactor: 0.03, mincutoff: 0.2, beta: 3.5, posDeadzone: 0.01, rotDeadzoneDeg: 2.5, emaFactor: 0.45, throttleHz: 25, medianWindow: 6, zeroRoll: true }
        },
        10: {
          name: "Adaptive Hybrid",
          description: "Smart balance between all characteristics",
          mindar: { filterMinCF: 0.003, filterBeta: 7, interpolation: true, smoothing: true },
          smoother: { mode: 'ultra_lock', smoothingFactor: 0.1, mincutoff: 1.2, beta: 1.8, posDeadzone: 0.0025, rotDeadzoneDeg: 0.7, emaFactor: 0.18, throttleHz: 55, medianWindow: 3, zeroRoll: false }
        }
      };
      
      let currentMode = 6; // Default to Ultra Stable
    </script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #f5f5dc; /* Cream background to match your site */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        user-select: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        margin: 0;
        padding: 0;
      }

      /* Mobile-first responsive design */
      @media (max-width: 768px) {
        body {
          background: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%);
        }
      }

      a-scene {
        width: 100vw;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        -webkit-transform: translateZ(0);
        -webkit-perspective: 1000;
        perspective: 1000;
      }

      a-scene canvas {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      /* Mobile AR scene optimization */
      @media (max-width: 768px) {
        a-scene {
          touch-action: manipulation;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      }

      /* Mobile overlay improvements */
      @media (max-width: 768px) {
        #overlay > div {
          max-width: 85vw !important;
          padding: 20px !important;
          border-radius: 20px !important;
        }
        
        #overlay h2 {
          font-size: 20px !important;
        }
        
        #overlay p {
          font-size: 14px !important;
        }
        
        #startBtn {
          padding: 14px 28px !important;
          font-size: 15px !important;
          border-radius: 14px !important;
        }
      }

      /* Small mobile devices */
      @media (max-width: 480px) {
        #overlay > div {
          max-width: 90vw !important;
          padding: 18px !important;
        }
        
        #overlay h2 {
          font-size: 18px !important;
        }
        
        #overlay p {
          font-size: 13px !important;
        }
        
        #startBtn {
          padding: 12px 24px !important;
          font-size: 14px !important;
        }
      }

      /* Landscape mobile optimization */
      @media (max-width: 768px) and (orientation: landscape) {
        #overlay > div {
          max-width: 70vw !important;
          padding: 20px !important;
        }
        
        .status-indicator {
          max-width: 70vw !important;
        }
      }

      /* Interactive button effects */
      #startBtn:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 12px 35px rgba(220,38,38,0.6) !important;
        background: #b91c1c !important;
      }

      #startBtn:active {
        transform: scale(0.98) !important;
        transition: transform 0.1s ease !important;
      }

      /* Mobile touch improvements */
      @media (max-width: 768px) {
        #startBtn {
          -webkit-tap-highlight-color: transparent !important;
          touch-action: manipulation !important;
        }
        
        #startBtn:active {
          transform: scale(0.95) !important;
        }
      }

      /* Loading animation for button */
      #startBtn.loading {
        background: #dc2626 !important;
        animation: pulse 2s infinite !important;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }

      
      .status-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: black;
        text-align: center;
        z-index: 1002;
        background: white;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        padding: 24px;
        border-radius: 20px;
        border: 2px solid black;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        display: none;
        max-width: 90vw;
        min-width: 280px;
        animation: fadeInUp 0.3s ease-out;
      }

      .status-indicator h3 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #dc2626;
        margin: 0 0 8px 0;
      }

      .status-indicator p {
        font-size: 14px;
        color: black;
        line-height: 1.4;
        margin: 0;
      }

      /* Mobile status indicator */
      @media (max-width: 768px) {
        .status-indicator {
          padding: 20px;
          border-radius: 16px;
          max-width: 85vw;
          min-width: 260px;
        }
        
        .status-indicator h3 {
          font-size: 16px;
          margin-bottom: 6px;
        }
        
        .status-indicator p {
          font-size: 13px;
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate(-50%, -40%);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%);
        }
      }

      .a-loader,
      .a-loader-title,
      .a-loader-spinner,
      .a-loader-logo,
      .a-loader-progress,
      .a-loader-progress-bar,
      .a-loader-progress-text,
      .a-loader-progress-container,
      .a-enter-vr,
      .a-orientation-modal,
      .a-fullscreen,
      .a-enter-ar,
      .a-enter-vr-button,
      [class*="a-loader"],
      [class*="a-enter"],
      [class*="a-orientation"],
      [class*="a-fullscreen"],
      [class*="loading"],
      [class*="spinner"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }

      /* Optional external link button */
      #externalLinkBtn {
        position: fixed;
        bottom: 24px; /* Move up from the bottom */
        left: 50%; /* Center horizontally */
        transform: translateX(-50%); /* Correct for centering */
        z-index: 1004;
        display: none; /* shown dynamically if link exists */
      }
      #externalLinkBtn a {
        text-decoration: none;
        background: #1f2937; /* dark-blue-ish to match site */
        color: #ffffff;
        border: 2px solid #000000;
        border-radius: 9999px;
        padding: 14px 22px; /* Increased padding for a bigger button */
        font-size: 16px; /* Larger font size */
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        opacity: 0.95;
        transition: transform .2s ease, opacity .2s ease, box-shadow .2s ease;
      }
      /* Hover moves up slightly without shifting horizontally */
      #externalLinkBtn a:hover {
        transform: translateY(-2px);
        opacity: 1;
        box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      }
      
      /* AR Mode Selector */
      #arModeSelector {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        padding: 15px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 280px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      #arModeSelector h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
      }
      
      #modeSelect {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 13px;
        margin-bottom: 8px;
      }
      
      #modeSelect option {
        background: #333;
        color: white;
      }
      
      #modeDescription {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.3;
        margin-top: 5px;
      }
      
      #modeToggle {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        background: rgba(0, 0, 0, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        padding: 8px 12px;
        font-size: 12px;
        cursor: pointer;
        backdrop-filter: blur(10px);
      }
      
      #modeToggle:hover {
        background: rgba(0, 0, 0, 0.9);
      }
      @media (max-width: 768px) { 
        #externalLinkBtn { bottom: 20px; }
        #externalLinkBtn a { padding: 12px 20px; font-size: 14px; }
      }
    </style>
  </head>
  <body>
    <div class="status-indicator" id="status-indicator">
      <h3 id="status-title">Point camera at your marker</h3>
      <p id="status-message">Look for your uploaded image</p>
    </div>

    <div id="overlay" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);z-index:1003;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);">
      <div style="text-align:center;color:black;max-width:90vw;padding:24px;background:white;border-radius:24px;border:2px solid black;box-shadow:0 25px 50px rgba(0,0,0,0.3);">
        <div style="margin-bottom:20px;">
          <div style="width:60px;height:60px;background:#dc2626;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:white;">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <h2 style="font-size:24px;font-weight:700;margin:0 0 12px 0;color:#dc2626;">Ready to start AR</h2>
          <p style="font-size:16px;margin:0;line-height:1.5;color:black;">Tap the button below, then allow camera access. Point your camera at the image you used to generate the .mind file.</p>
        </div>
        <button id="startBtn" style="background:#dc2626;color:white;border:2px solid black;border-radius:16px;padding:16px 32px;font-weight:600;cursor:pointer;font-size:16px;transition:all 0.3s ease;box-shadow:0 8px 25px rgba(220,38,38,0.4);transform:scale(1);">Start AR Experience</button>
      </div>
    </div>



    <a-scene
      id="arScene"
      mindar-image="imageTargetSrc: ${mindFileUrl}; interpolation: true; smoothing: true; filterMinCF: 0.001; filterBeta: 10; missTolerance: 5; warmupTolerance: 5;"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights: true, antialias: true, alpha: true"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
      loading-screen="enabled: false"
      style="opacity:0; transition: opacity .3s ease; transform: translateZ(0); will-change: transform;"
    >
      <a-assets>
        ${experience.model_url ? `
        <a-asset-item id="modelAsset" src="${experience.model_url}"></a-asset-item>
        ` : `
        <video
          id="videoTexture"
          src="${experience.video_url}"
          loop
          muted
          playsinline
          crossorigin="anonymous"
          preload="auto"
          style="transform: translateZ(0); will-change: transform; backface-visibility: hidden;"
        ></video>
        `}
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0" id="target" one-euro-smoother="smoothingFactor: 0.06; freq: 120; mincutoff: 0.3; beta: 2.2; dcutoff: 1.0; posDeadzone: 0.0045; rotDeadzoneDeg: 1.2; emaFactor: 0.26">
        ${experience.model_url ? `
        <a-entity id="modelEntity" gltf-model="#modelAsset" visible="false" position="0 0 0.01"></a-entity>
        ` : `
        <a-plane
          id="backgroundPlane"
          width="1"
          height="1"
          position="0 0 0.005"
          rotation="0 0 ${experience.video_rotation || 0}"
          material="color: #000000"
          visible="false"
        ></a-plane>

        <a-plane
          id="videoPlane"
          width="1"
          height="1"
          position="0 0 0.01"
          rotation="0 0 ${experience.video_rotation || 0}"
          material="shader: flat; src: #videoTexture; transparent: true; alphaTest: 0.1"
          visible="false"
          geometry="primitive: plane; skipCache: true"
          style="transform: translateZ(0); will-change: transform; backface-visibility: hidden;"
          animation="property: object3D.position; dur: 100; easing: easeOutQuad; loop: false"
        ></a-plane>
        `}
      </a-entity>
    </a-scene>

    ${experience.link_url ? `
    <div id="externalLinkBtn">
      <a href="${experience.link_url}" target="_blank" rel="noopener noreferrer" aria-label="Open link">
        Open Link
      </a>
    </div>
    ` : ''}
    
    <!-- AR Mode Selector -->
    <div id="arModeSelector">
      <h3>AR Tracking Mode</h3>
      <select id="modeSelect">
        <option value="1">Mode 1: Raw Tracking</option>
        <option value="2">Mode 2: Light Smoothing</option>
        <option value="3">Mode 3: Balanced Fast</option>
        <option value="4">Mode 4: Medium Smooth</option>
        <option value="5">Mode 5: Heavy Filtering</option>
        <option value="6" selected>Mode 6: Ultra Stable</option>
        <option value="7">Mode 7: Predictive Smooth</option>
        <option value="8">Mode 8: Cinema Mode</option>
        <option value="9">Mode 9: Locked Position</option>
        <option value="10">Mode 10: Adaptive Hybrid</option>
      </select>
      <div id="modeDescription">Maximum stability, more lag</div>
    </div>
    
    <button id="modeToggle">Hide Controls</button>

    <script>
      async function preflightMind(url) {
        try {
          // Try with CORS mode first
          const res = await fetch(url, { method: 'GET', mode: 'cors' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return true;
        } catch (e) {
          console.error('Mind file preflight failed:', e);
          
          // Try without CORS as fallback
          try {
            const res2 = await fetch(url, { method: 'GET', mode: 'no-cors' });
            return true;
          } catch (e2) {
            console.error('Fallback fetch also failed:', e2);
            return false;
          }
        }
      }

      function showStatus(title, message) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusTitle = document.getElementById('status-title');
        const statusMessage = document.getElementById('status-message');

        if (statusIndicator && statusTitle && statusMessage) {
          statusTitle.textContent = title;
          statusMessage.textContent = message;
          statusIndicator.style.display = 'block';
        }
      }

      function hideStatus() {
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
          statusIndicator.style.display = 'none';
        }
      }

      function nukeLoadingScreens() {
        const selectors = [
          '.a-loader', '.a-loader-title', '.a-loader-spinner', '.a-loader-logo',
          '.a-loader-progress', '.a-loader-progress-bar', '.a-loader-progress-text',
          '.a-loader-progress-container', '.a-enter-vr', '.a-orientation-modal',
          '.a-fullscreen', '.a-enter-ar', '.a-enter-vr-button',
          '[class*="a-loader"]', '[class*="a-enter"]', '[class*="a-orientation"]',
          '[class*="a-fullscreen"]', '[class*="loading"]', '[class*="spinner"]'
        ];

        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            el.style.top = '-9999px';
          });
        });
      }



      nukeLoadingScreens();

      const initARPage = async () => {
        console.log('AR Experience DOM loaded');
        nukeLoadingScreens();

        const startBtn = document.getElementById('startBtn');
        const overlay = document.getElementById('overlay');
        const scene = document.getElementById('arScene');
        const video = document.querySelector('#videoTexture');
        const modelEntity = document.querySelector('#modelEntity');
        const target = document.querySelector('#target');
        const videoPlane = document.querySelector('#videoPlane');
        const backgroundPlane = document.querySelector('#backgroundPlane');
        const externalLinkBtn = document.getElementById('externalLinkBtn');
        const modeSelector = document.getElementById('arModeSelector');
        const modeSelect = document.getElementById('modeSelect');
        const modeDescription = document.getElementById('modeDescription');
        const modeToggle = document.getElementById('modeToggle');

        console.log('AR Elements found:', {
          scene: !!scene,
          video: !!video,
          target: !!target,
          videoPlane: !!videoPlane,
          backgroundPlane: !!backgroundPlane
        });

        // Preflight check for .mind URL
        const ok = await preflightMind('${mindFileUrl}');
        if (!ok && scene) {
          const fallbackMind = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';
          const mode = AR_MODES[currentMode];
          const attr = 'imageTargetSrc: ' + fallbackMind + '; ' +
            'interpolation: ' + mode.mindar.interpolation + '; ' +
            'smoothing: ' + mode.mindar.smoothing + '; ' +
            'filterMinCF: ' + mode.mindar.filterMinCF + '; ' +
            'filterBeta: ' + mode.mindar.filterBeta + '; ' +
            'missTolerance: 5; warmupTolerance: 5;';
          scene.setAttribute('mindar-image', attr);
          showStatus('Using fallback target', 'Your .mind file could not be loaded. Using a sample target to verify camera and tracking.');
        }

        if (video && videoPlane && backgroundPlane) {
          // Optimize video for performance
          video.playsInline = true;
          video.autoplay = false;
          video.controls = false;
          video.setAttribute('webkit-playsinline', 'true');
          video.setAttribute('x5-playsinline', 'true');

          if (video) video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            const ratio = video.videoWidth / video.videoHeight || (16/9);
            const planeHeight = 1 / ratio;
            videoPlane.setAttribute('width', 1);
            videoPlane.setAttribute('height', planeHeight);
            backgroundPlane.setAttribute('width', 1);
            backgroundPlane.setAttribute('height', planeHeight);
            
            // Enable hardware acceleration for video
            video.style.transform = 'translateZ(0)';
            video.style.willChange = 'transform';
            video.style.backfaceVisibility = 'hidden';
          });

          // Reduce video updates for smoother playback
          if (video) {
            video.addEventListener('timeupdate', () => {
              if (video.readyState >= 3) { // HAVE_FUTURE_DATA
                // Force repaint for smooth updates
                videoPlane.setAttribute('material', 'shader: flat; src: #videoTexture; transparent: true; alphaTest: 0.1');
              }
            });
          }
        }

        // A-Frame/MindAR lifecycle
        if (scene) {
          scene.addEventListener('arReady', () => {
            console.log('MindAR arReady');
            scene.style.opacity = '1';
            
            // Custom stabilization logic removed.
          });
          scene.addEventListener('arError', (e) => {
            console.error('MindAR arError', e);
            showStatus('AR Initialization Error', 'Please allow camera access and try again.');
          });
        }

        // Add tracking stabilization
        let targetFoundTimeout = null;
        let targetLostTimeout = null;
        let isTargetVisible = false;
        
        // Custom stabilization logic removed to rely on MindAR's built-in filtering.

        if (target) {
          console.log('Target element found, adding event listeners');
          
          target.addEventListener('targetFound', () => {
            console.log('Target found!');
            
            // Clear any pending lost timeout
            if (targetLostTimeout) {
              clearTimeout(targetLostTimeout);
              targetLostTimeout = null;
            }
            
            // Debounce target found to reduce flickering
            if (targetFoundTimeout) clearTimeout(targetFoundTimeout);
            targetFoundTimeout = setTimeout(() => {
              if (!isTargetVisible) {
                isTargetVisible = true;
                if (modelEntity) {
                  modelEntity.setAttribute('visible', 'true');
                } else {
                  if (backgroundPlane) backgroundPlane.setAttribute('visible', 'true');
                  if (videoPlane) {
                    videoPlane.setAttribute('visible', 'true');
                    // Add smooth animation for appearance
                    videoPlane.setAttribute('animation', 'property: material.opacity; from: 0; to: 1; dur: 300');
                  }
                  if (video) {
                    video.currentTime = 0; // Restart video
                    video.play().catch(() => {});
                  }
                }
                showStatus('Target Found!', 'AR content should be visible');
                setTimeout(hideStatus, 1500);
              }
            }, 100); // 100ms debounce
          });

          target.addEventListener('targetLost', () => {
            console.log('Target lost!');
            
            // Clear any pending found timeout
            if (targetFoundTimeout) {
              clearTimeout(targetFoundTimeout);
              targetFoundTimeout = null;
            }
            
            // Debounce target lost to reduce flickering
            if (targetLostTimeout) clearTimeout(targetLostTimeout);
            targetLostTimeout = setTimeout(() => {
              if (isTargetVisible) {
                isTargetVisible = false;
                if (modelEntity) {
                  modelEntity.setAttribute('visible', 'false');
                } else {
                  if (backgroundPlane) backgroundPlane.setAttribute('visible', 'false');
                  if (videoPlane) {
                    // Add smooth animation for disappearance
                    videoPlane.setAttribute('animation', 'property: material.opacity; from: 1; to: 0; dur: 200');
                    setTimeout(() => {
                      videoPlane.setAttribute('visible', 'false');
                    }, 200);
                  }
                  if (video) video.pause();
                }
                showStatus('Target Lost', 'Point camera at your marker again');
              }
            }, 300); // 300ms debounce for lost (longer to prevent flickering)
          });
        } else {
          console.error('Target element not found!');
        }

        // Start AR handlers (fix overlay stuck)
        if (scene) {
          let started = false;
          const startAR = async () => {
            if (started) return;
            started = true;
            console.log('[AR] startAR invoked');
            try {
              const sys = scene && scene.systems && scene.systems['mindar-image-system'];
              if (sys && sys.start) {
                console.log('[AR] Starting mindar-image-system');
                await sys.start();
              } else {
                console.warn('[AR] mindar-image-system.start not found');
              }
            } catch (e) {
              console.warn('Failed to start MindAR system:', e);
            }
            try {
              const v = video;
              if (v && v.play) await v.play().catch(()=>{});
            } catch {}
            const overlayEl = document.getElementById('overlay');
            if (overlayEl) overlayEl.style.display = 'none';
            showStatus('Initializing...', 'Starting camera and tracker');
            setTimeout(hideStatus, 1000);
            if (externalLinkBtn) externalLinkBtn.style.display = 'block';
            if (modeSelector) modeSelector.style.display = 'block';
          };

          // Attach to start button if present
          if (startBtn) {
            console.log('[AR] Binding start button handlers');
            startBtn.addEventListener('click', startAR, { once: true });
            startBtn.addEventListener('touchend', (e) => { e.preventDefault(); startAR(); }, { once: true });
            startBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter') startAR(); }, { once: true });
          } else {
            console.warn('[AR] startBtn not found');
          }

          // Fallbacks: any interaction starts AR
          const overlayEl = document.getElementById('overlay');
          if (overlayEl) {
            overlayEl.addEventListener('click', startAR, { once: true });
            overlayEl.addEventListener('touchend', (e) => { e.preventDefault(); startAR(); }, { once: true });
          }
          document.addEventListener('click', startAR, { once: true });
          document.addEventListener('keydown', (e) => { if (e.key === 'Enter') startAR(); }, { once: true });
        }

        // AR Mode switching functionality
        function applyARMode(modeId) {
          const mode = AR_MODES[modeId];
          if (!mode) return;
          
          currentMode = modeId;
          
          // Update MindAR scene attributes
          if (scene) {
            const mindAttr = 'imageTargetSrc: ' + mindFileUrl + '; ' +
              'filterMinCF: ' + mode.mindar.filterMinCF + '; ' +
              'filterBeta: ' + mode.mindar.filterBeta + '; ' +
              'missTolerance: 5; warmupTolerance: 5;';
            scene.setAttribute('mindar-image', mindAttr);
          }
          
          // Update smoother component attributes
          if (target) {
            const smootherAttr = Object.entries(mode.smoother)
              .map(([key, value]) => key + ': ' + value)
              .join('; ');
            target.setAttribute('one-euro-smoother', smootherAttr);
          }
          
          // Update UI
          modeDescription.textContent = mode.description;
          console.log('Applied AR Mode ' + modeId + ': ' + mode.name);
        }
        
        // Mode selector event listener
        if (modeSelect) {
          modeSelect.addEventListener('change', (e) => {
            applyARMode(parseInt(e.target.value));
          });
        }
        
        // Mode toggle visibility
        if (modeToggle && modeSelector) {
          let controlsVisible = true;
          modeToggle.addEventListener('click', () => {
            controlsVisible = !controlsVisible;
            modeSelector.style.display = controlsVisible ? 'block' : 'none';
            modeToggle.textContent = controlsVisible ? 'Hide Controls' : 'Show Controls';
          });
        }
        
        // Apply default mode
        applyARMode(currentMode);
        
        // Tap to start to satisfy autoplay/camera permissions
              overlay.style.display = 'none';
              showStatus('Initializing...', 'Starting camera and tracker');
              setTimeout(hideStatus, 1000);
              // Show external link button if exists
              if (externalLinkBtn) {
                externalLinkBtn.style.display = 'block';
              }
              
              // Show mode selector after AR starts
              if (modeSelector) {
                modeSelector.style.display = 'block';
              }
            }, 500);
            
          }, { once: true });

          // Mobile touch improvements
          if ('ontouchstart' in window) {
            startBtn.addEventListener('touchstart', () => {
              startBtn.style.transform = 'scale(0.95)';
            });
            
            startBtn.addEventListener('touchend', () => {
              startBtn.style.transform = 'scale(1)';
            });
          }
        }

        setInterval(nukeLoadingScreens, 1000);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initARPage, { once: true });
      } else {
        // DOM already ready, run immediately
        initARPage();
      }

      window.addEventListener('error', (event) => {
        console.error('AR Error:', event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('AR Promise Rejection:', event.reason);
      });
    </script>
  </body>
</html>`

    return new NextResponse(arHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error serving AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
