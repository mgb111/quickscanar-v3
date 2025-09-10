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
    
    <!-- Analytics Tracking Script -->
    <script>
      // Analytics tracking for AR experience
      const experienceId = '${experience.id}';
      const sessionId = 'ar_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      let sessionStartTime = Date.now();
      let hasTrackedStart = false;
      let hasTrackedEnd = false;
      
      // Track analytics event
      async function trackAnalyticsEvent(eventType, metadata = {}) {
        try {
          const response = await fetch('/api/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              experienceId: experienceId,
              event: eventType,
              userId: null, // Anonymous user
              sessionId: sessionId,
              deviceInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                isTablet: /iPad|Android(?=.*\\bMobile\\b)(?=.*\\bSafari\\b)/i.test(navigator.userAgent),
                isDesktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) && !(/iPad|Android(?=.*\\bMobile\\b)(?=.*\\bSafari\\b)/i.test(navigator.userAgent))
              },
              location: await getLocationInfo(),
              duration: eventType === 'session_end' ? Math.round((Date.now() - sessionStartTime) / 1000) : undefined,
              metadata: metadata,
              timestamp: new Date().toISOString()
            })
          });
          
          if (response.ok) {
            console.log('Analytics event tracked:', eventType);
          }
        } catch (error) {
          console.error('Failed to track analytics event:', error);
        }
      }
      
      // Get location info
      async function getLocationInfo() {
        try {
          const response = await fetch('https://ipapi.co/json/');
          const data = await response.json();
          return {
            country: data.country_name,
            countryCode: data.country_code,
            city: data.city,
            region: data.region,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone
          };
        } catch (error) {
          return {};
        }
      }
      
      // Track session start
      if (!hasTrackedStart) {
        trackAnalyticsEvent('session_start');
        hasTrackedStart = true;
      }
      
      // Track page view
      trackAnalyticsEvent('view');
      
      // Track session end on page unload
      window.addEventListener('beforeunload', () => {
        if (!hasTrackedEnd) {
          trackAnalyticsEvent('session_end');
          hasTrackedEnd = true;
        }
      });
      
      // Track AR-specific events
      window.trackAREvent = function(eventType, metadata) {
        trackAnalyticsEvent(eventType, metadata);
      };
    </script>
    <script>
      !function(t,e){if("object"==typeof exports&&"object"==typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var i=e();for(var s in i)("object"==typeof exports?exports:t)[s]=i[s]}}("undefined"!=typeof self?self:this,(()=>(()=>{"use strict";var t={d:(e,i)=>{for(var s in i)t.o(i,s)&&!t.o(e,s)&&Object.defineProperty(e,s,{enumerable:!0,get:i[s]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{LowPassFilter:()=>i,OneEuroFilter:()=>s});class i{setAlpha(t){(t<=0||t>1)&&console.log("alpha should be in (0.0., 1.0]"),this.a=t}constructor(t,e=0){this.y=this.s=e,this.setAlpha(t),this.initialized=!1}filter(t){var e;return this.initialized?e=this.a*t+(1-this.a)*this.s:(e=t,this.initialized=!0),this.y=t,this.s=e,e}filterWithAlpha(t,e){return this.setAlpha(e),this.filter(t)}hasLastRawValue(){return this.initialized}lastRawValue(){return this.y}reset(){this.initialized=!1}}class s{alpha(t){var e=1/this.freq;return 1/(1+1/(2*Math.PI*t)/e)}setFrequency(t){t<=0&&console.log("freq should be >0"),this.freq=t}setMinCutoff(t){t<=0&&console.log("mincutoff should be >0"),this.mincutoff=t}setBeta(t){this.beta_=t}setDerivateCutoff(t){t<=0&&console.log("dcutoff should be >0"),this.dcutoff=t}constructor(t,e=1,s=0,h=1){this.setFrequency(t),this.setMinCutoff(e),this.setBeta(s),this.setDerivateCutoff(h),this.x=new i(this.alpha(e)),this.dx=new i(this.alpha(h)),this.lasttime=void 0}reset(){this.x.reset(),this.dx.reset(),this.lasttime=void 0}filter(t,e=undefined){null!=this.lasttime&&null!=e&&(this.freq=1/(e-this.lasttime)),this.lasttime=e;var i=this.x.hasLastRawValue()?(t-this.x.lastRawValue())*this.freq:0,s=this.dx.filterWithAlpha(i,this.alpha(this.dcutoff)),h=this.mincutoff+this.beta_*Math.abs(s);return this.x.filterWithAlpha(t,this.alpha(h))}}return e})()));
    </script>
    <script>
      AFRAME.registerComponent('one-euro-smoother', {
        schema: {
          // Lower value = more smoothing, less responsive
          smoothingFactor: { type: 'number', default: 0.08 },
          // One-Euro filter params for position
          freq: { type: 'number', default: 60 },
          mincutoff: { type: 'number', default: 0.8 }, // Lower value = more smoothing for slow movements
          beta: { type: 'number', default: 0.7 }, // Higher value = more smoothing for fast movements
          dcutoff: { type: 'number', default: 1.0 },
          // Extra stabilizers
          posDeadzone: { type: 'number', default: 0.002 }, // meters; ignore micro translation noise
          rotDeadzoneDeg: { type: 'number', default: 0.8 }, // degrees; ignore micro rotation noise
          emaFactor: { type: 'number', default: 0.12 }, // 0..1, additional EMA blend after One-Euro
          // Ultra lock controls
          mode: { type: 'string', default: 'ultra_lock' }, // 'normal' | 'ultra_lock'
          throttleHz: { type: 'number', default: 30 }, // apply transforms at most this often
          medianWindow: { type: 'number', default: 5 }, // median window size for position
          zeroRoll: { type: 'boolean', default: true }, // lock roll around marker normal
          // Homography stabilization
          homographySmoothing: { type: 'number', default: 0.15 }, // smooth marker corner detection
          minMovementThreshold: { type: 'number', default: 0.001 }, // minimum movement to trigger update
        },

        init: function () {
          const { freq, mincutoff, beta, dcutoff } = this.data;
          
          // One-Euro filter for position to smooth out jitter from camera shake.
          this.positionSmoother = {
            x: new OneEuroFilter(freq, mincutoff, beta, dcutoff),
            y: new OneEuroFilter(freq, mincutoff, beta, dcutoff),
            z: new OneEuroFilter(freq, mincutoff, beta, dcutoff),
          };

          // Rotation smoothers for each axis
          this.rotationSmoother = {
            x: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff),
            y: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff),
            z: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff),
            w: new OneEuroFilter(freq, mincutoff * 0.5, beta * 0.8, dcutoff),
          };

          // We will use a separate matrix to hold the raw, unsmoothed transform from MindAR.
          this.rawMatrix = new THREE.Matrix4();
          this.tmpVec = new THREE.Vector3();
          this.tmpQuat = new THREE.Quaternion();
          this.tmpEuler = new THREE.Euler();

          // Position history for median filtering
          this._posHistory = [];
          this._lastApply = 0;
          this._lastRawPosition = new THREE.Vector3();
          this._lastRawQuaternion = new THREE.Quaternion();
          this._isFirstFrame = true;
          
          // Sticky anchoring - lock position when movement is minimal
          this._stickyLocked = false;
          this._stickyCounter = 0;
          this._stickyThreshold = 2; // frames of minimal movement to trigger lock (reduced for faster locking)
          
          // Ultra stabilization variables
          this._lockedPosition = new THREE.Vector3();
          this._lockedQuaternion = new THREE.Quaternion();
          this._lockStrength = 0.999; // How strongly to lock to position (99.9% locked)
        },

        tick: function (t, dt) {
          // Only run if the target is visible.
          if (!this.el.object3D.visible) return;

          const { smoothingFactor, posDeadzone, rotDeadzoneDeg, emaFactor, mode, throttleHz, medianWindow, zeroRoll, minMovementThreshold } = this.data;
          const timestamp = t / 1000; // OneEuroFilter requires timestamp in seconds.

          // Throttle updates to reduce visible micro jitter - ultra slow for max stability
          const interval = 1000 / Math.max(1, throttleHz || 3);
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

          // 2a. Sticky anchoring - detect minimal movement and lock position
          if (!this._isFirstFrame) {
            const positionDelta = rawPosition.distanceTo(this._lastRawPosition);
            const quaternionDelta = 1 - Math.abs(rawQuaternion.dot(this._lastRawQuaternion));
            
            if (positionDelta < minMovementThreshold && quaternionDelta < minMovementThreshold * 10) {
              this._stickyCounter++;
              if (this._stickyCounter >= this._stickyThreshold) {
                this._stickyLocked = true;
              }
            } else {
              this._stickyCounter = 0;
              this._stickyLocked = false;
            }
          }
          
          // If sticky locked, use ultra-minimal movement with locked reference
          if (this._stickyLocked) {
            rawPosition.lerp(this._lockedPosition, this._lockStrength);
            rawQuaternion.slerp(this._lockedQuaternion, this._lockStrength);
          } else {
            // Update locked reference position when not locked
            this._lockedPosition.copy(rawPosition);
            this._lockedQuaternion.copy(rawQuaternion);
          }
          
          this._lastRawPosition.copy(rawPosition);
          this._lastRawQuaternion.copy(rawQuaternion);
          this._isFirstFrame = false;

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
              const s = [...arr].sort((a,b)=>a-b);
              const mid = Math.floor(s.length / 2);
              return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
            };
            if (this._posHistory.length >= 2) {
              usePos = new THREE.Vector3(
                med(this._posHistory.map(p=>p.x)),
                med(this._posHistory.map(p=>p.y)),
                med(this._posHistory.map(p=>p.z))
              );
            }
          } else {
            // reset history to avoid lag when switching
            this._posHistory.length = 0;
          }

          const smoothedPosition = new THREE.Vector3(
            this.positionSmoother.x.filter(usePos.x, timestamp),
            this.positionSmoother.y.filter(usePos.y, timestamp),
            this.positionSmoother.z.filter(usePos.z, timestamp)
          );

          // 4. Apply position deadzone to ignore micro-movements.
          const currentPos = this.el.object3D.position;
          const positionDelta = smoothedPosition.distanceTo(currentPos);
          if (positionDelta < posDeadzone) {
            smoothedPosition.copy(currentPos); // Keep current position if change is too small.
          }

          // 5. Smooth the rotation using One-Euro filters for each quaternion component
          // This reduces rotational jitter more effectively than simple slerp.
          let smoothedQuaternion;

          if (mode === 'ultra_lock') {
            // Use One-Euro filter for rotation components with enhanced stability
            smoothedQuaternion = new THREE.Quaternion(
              this.rotationSmoother.x.filter(rawQuaternion.x, timestamp),
              this.rotationSmoother.y.filter(rawQuaternion.y, timestamp),
              this.rotationSmoother.z.filter(rawQuaternion.z, timestamp),
              this.rotationSmoother.w.filter(rawQuaternion.w, timestamp)
            ).normalize();
            
            // Additional stability: blend with current rotation for micro-movements
            const currentQuat = this.el.object3D.quaternion;
            const rotationDelta = Math.acos(Math.abs(smoothedQuaternion.dot(currentQuat))) * (180 / Math.PI);
            if (rotationDelta < rotDeadzoneDeg * 2) {
              smoothedQuaternion.slerp(currentQuat, 0.7); // Heavy bias toward current rotation
            }
          } else {
            // Use slerp for normal mode
            const currentQuat = this.el.object3D.quaternion;
            smoothedQuaternion = currentQuat.clone().slerp(rawQuaternion, smoothingFactor);
          }

          // 6. Apply rotation deadzone to ignore micro-rotations.
          const currentQuat = this.el.object3D.quaternion;
          const rotationDelta = Math.acos(Math.abs(smoothedQuaternion.dot(currentQuat))) * (180 / Math.PI);
          if (rotationDelta < rotDeadzoneDeg) {
            smoothedQuaternion.copy(currentQuat); // Keep current rotation if change is too small.
          }

          // 7. Zero roll if enabled (lock roll around marker normal).
          if (zeroRoll) {
            this.tmpEuler.setFromQuaternion(smoothedQuaternion, 'XYZ');
            this.tmpEuler.z = 0; // Zero the roll component.
            smoothedQuaternion.setFromEuler(this.tmpEuler);
          }

          // 8. Apply additional EMA blending for extra smoothness with enhanced stability.
          if (emaFactor > 0 && emaFactor < 1) {
            // Ultra-aggressive EMA for maximum stability - almost no movement allowed
            const ultraStableEma = emaFactor * 0.01; // Make EMA 100x more aggressive
            
            smoothedPosition.lerp(currentPos, 1 - ultraStableEma);
            smoothedQuaternion.slerp(currentQuat, 1 - ultraStableEma);
          }

          // 9. Apply the smoothed transform to the object.
          this.el.object3D.position.copy(smoothedPosition);
          this.el.object3D.quaternion.copy(smoothedQuaternion);
          this.el.object3D.scale.copy(rawScale); // Scale is usually not smoothed.
        }
      });
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
        bottom: 160px; /* move way up on desktop */
        left: 50%; /* Center horizontally */
        transform: translateX(-50%); /* Correct for centering */
        z-index: 1004;
        display: none; /* shown dynamically if link exists */
      }
      #externalLinkBtn a {
        text-decoration: none;
        background: #dc2626; /* red-600 */
        color: #ffffff;
        border: 2px solid #000000;
        border-radius: 9999px;
        padding: 18px 26px; /* bigger button */
        font-size: 18px; /* larger font */
        font-weight: 700;
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        opacity: 0.98;
        transition: transform .2s ease, opacity .2s ease, box-shadow .2s ease, background-color .2s ease;
      }
      /* Hover moves up slightly without shifting horizontally */
      #externalLinkBtn a:hover {
        transform: translateY(-2px);
        opacity: 1;
        box-shadow: 0 12px 30px rgba(0,0,0,0.35);
        background: #b91c1c; /* red-700 */
      }
      @media (max-width: 768px) { 
        #externalLinkBtn { bottom: 120px; }
        #externalLinkBtn a { padding: 16px 22px; font-size: 16px; }
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
          <p style="font-size:16px;margin:0;line-height:1.5;color:black;">Tap the button below, then allow camera access. Point your camera at the image you used to generate the .mind file. <strong>Audio will play when the marker is tracked.</strong></p>
        </div>
        <button id="startBtn" style="background:#dc2626;color:white;border:2px solid black;border-radius:16px;padding:16px 32px;font-weight:600;cursor:pointer;font-size:16px;transition:all 0.3s ease;box-shadow:0 8px 25px rgba(220,38,38,0.4);transform:scale(1);">Start AR Experience</button>
      </div>
    </div>



    <a-scene
      id="arScene"
      mindar-image="imageTargetSrc: ${mindFileUrl}; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 50; missTolerance: 10; showStats: false; maxTrack: 1;"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights: true, antialias: true, alpha: true"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
      loading-screen="enabled: false"
      style="opacity:0; transition: opacity .3s ease; transform: translateZ(0); will-change: transform;"
    >
      <a-assets>
        <video
          id="arVideo"
          src="${experience.video_url}"
          loop
          muted
          playsinline
          crossorigin="anonymous"
          preload="auto"
          style="transform: translateZ(0); will-change: transform; backface-visibility: hidden;"
        ></video>
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0" id="target" one-euro-smoother="mode: ultra_lock; smoothingFactor: 0.001; freq: 5; mincutoff: 0.001; beta: 0.001; dcutoff: 1.0; posDeadzone: 0.000001; rotDeadzoneDeg: 0.001; emaFactor: 0.001; throttleHz: 3; medianWindow: 15; zeroRoll: true; minMovementThreshold: 0.0000001"
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
          material="src: #arVideo; transparent: true; alphaTest: 0.1; shader: flat"
          visible="false"
        ></a-plane>
      </a-entity>
    </a-scene>

    ${experience.link_url ? `
    <div id="externalLinkBtn">
      <a href="${experience.link_url}" target="_blank" rel="noopener noreferrer" aria-label="Open link">
        Open Link
      </a>
    </div>
    ` : ''}

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

      // Function to update video plane to match marker dimensions
      function updateVideoAspectRatio(videoElement, videoPlane) {
        if (!videoElement || !videoPlane) return;
        
        const updateDimensions = () => {
          if (videoElement.videoWidth && videoElement.videoHeight) {
            const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
            // Marker dimensions (1.0 x 1.0 by default in MindAR)
            const markerWidth = 1.0;
            const markerHeight = 1.0;
            
            // Calculate scale to make video slightly larger than marker (5% larger)
            const scale = 1.05; // 5% larger than marker
            let width, height;
            
            if (videoAspect > 1) {
              // Landscape video - scale to width
              width = markerWidth * scale;
              height = (markerWidth / videoAspect) * scale;
            } else {
              // Portrait or square video - scale to height
              height = markerHeight * scale;
              width = (markerHeight * videoAspect) * scale;
            }
            
            // Update video plane
            videoPlane.setAttribute('width', width);
            videoPlane.setAttribute('height', height);
            
            // Update background plane to be slightly larger than video (10% larger than marker)
            const backgroundPlane = document.querySelector('#backgroundPlane');
            if (backgroundPlane) {
              backgroundPlane.setAttribute('width', markerWidth * 1.1);
              backgroundPlane.setAttribute('height', markerHeight * 1.1);
            }
            
            console.log('Video dimensions set to:', width.toFixed(2), 'x', height.toFixed(2));
            console.log('Original video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
          }
        };
        
        // Try to update dimensions immediately if video is already loaded
        if (videoElement.readyState >= 1) { // HAVE_ENOUGH_DATA
          updateDimensions();
        } else {
          // Or wait for metadata to be loaded
          videoElement.addEventListener('loadedmetadata', updateDimensions);
        }
        
        // Also update on resize events if needed
        videoElement.addEventListener('resize', updateDimensions);
      }

      document.addEventListener("DOMContentLoaded", async () => {
        console.log('AR Experience DOM loaded');
        nukeLoadingScreens();

        const startBtn = document.getElementById('startBtn');
        const overlay = document.getElementById('overlay');
        const scene = document.getElementById('arScene');
        const video = document.querySelector('#arVideo');
        const target = document.querySelector('#target');
        const videoPlane = document.querySelector('#videoPlane');
        const backgroundPlane = document.querySelector('#backgroundPlane');
        const externalLinkBtn = document.getElementById('externalLinkBtn');

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
          const attr = 'imageTargetSrc: ' + fallbackMind + '; interpolation: true; smoothing: true;';
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

          video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            const ratio = video.videoWidth / video.videoHeight || (16/9);
            const baseWidth = 2.0; // 200% of marker width
            const planeHeight = baseWidth / ratio;
            
            // Set video plane dimensions to match video aspect ratio
            videoPlane.setAttribute('width', baseWidth);
            videoPlane.setAttribute('height', planeHeight);
            backgroundPlane.setAttribute('width', baseWidth);
            backgroundPlane.setAttribute('height', planeHeight);
            
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight, 'ratio:', ratio, 'plane height:', planeHeight);
            
            // Enable hardware acceleration for video
            video.style.transform = 'translateZ(0)';
            video.style.willChange = 'transform';
            video.style.backfaceVisibility = 'hidden';
          });

          // Reduce video updates for smoother playback
          video.addEventListener('timeupdate', () => {
            if (video.readyState >= 3) { // HAVE_FUTURE_DATA
              // Force repaint for smooth updates
              videoPlane.setAttribute('material', 'shader: flat; src: #videoTexture; transparent: true; alphaTest: 0.1');
            }
          });
        }

        // A-Frame/MindAR lifecycle
        if (scene) {
          scene.addEventListener('arReady', () => {
            console.log('MindAR arReady');
            scene.style.opacity = '1';
            
            if (video) {
              video.play().then(() => {
                // After video starts playing, update the aspect ratio
                updateVideoAspectRatio(video, videoPlane);
              }).catch(e => console.error('Video play error:', e));
            }
            
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
            
            // Track target recognition analytics
            if (window.trackAREvent) {
              window.trackAREvent('target_recognition', {
                recognitionTime: Date.now() - sessionStartTime,
                targetIndex: 0
              });
            }
            
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
                if (backgroundPlane) backgroundPlane.setAttribute('visible', 'true');
                if (videoPlane) {
                  videoPlane.setAttribute('visible', 'true');
                  // Add smooth animation for appearance
                  videoPlane.setAttribute('animation', 'property: material.opacity; from: 0; to: 1; dur: 300');
                }
                if (video) {
                  video.currentTime = 0; // Restart video
                  video.muted = false; // Enable audio when target is found
                  video.play().catch(() => {});
                }
                showStatus('Target Found!', 'AR content should be visible');
                setTimeout(hideStatus, 1500);
              }
            }, 100); // 100ms debounce
          });

          target.addEventListener('targetLost', () => {
            console.log('Target lost!');
            
            // Track target lost analytics
            if (window.trackAREvent) {
              window.trackAREvent('target_lost', {
                targetIndex: 0,
                sessionDuration: Date.now() - sessionStartTime
              });
            }
            
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
                if (backgroundPlane) backgroundPlane.setAttribute('visible', 'false');
                if (videoPlane) {
                  // Add smooth animation for disappearance
                  videoPlane.setAttribute('animation', 'property: material.opacity; from: 1; to: 0; dur: 200');
                  setTimeout(() => {
                    videoPlane.setAttribute('visible', 'false');
                  }, 200);
                }
                if (video) {
                  video.pause();
                  video.muted = true; // Mute audio when target is lost
                }
                showStatus('Target Lost', 'Point camera at your marker again');
              }
            }, 50); // 300ms debounce for lost (longer to prevent flickering)
          });
        } else {
          console.error('Target element not found!');
        }

        // Tap to start to satisfy autoplay/camera permissions
        if (startBtn && overlay) {
          // Add loading state to button
          startBtn.addEventListener('click', async () => {
            startBtn.classList.add('loading');
            startBtn.textContent = 'Starting...';
            
            // Don't start video here - wait for target to be found
            // if (video) await video.play().catch(() => {});

            // Smooth fade out for overlay
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
              overlay.style.display = 'none';
              showStatus('Initializing...', 'Starting camera and tracker');
              setTimeout(hideStatus, 1000);
              // Show external link button if exists
              if (externalLinkBtn) {
                externalLinkBtn.style.display = 'block';
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

        // Setup profile selector event listener
        // Removed profile selector logic

        setInterval(nukeLoadingScreens, 1000);
      });

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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
        'ETag': `"${Date.now()}"`,
      },
    })
  } catch (error) {
    console.error('Error serving AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
