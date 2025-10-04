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
      video_url: experience.video_url,
      model_url: experience.model_url,
      content_type: experience.content_type
    })

    const mindFileUrl = experience.mind_file_url || 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const contentType = experience.content_type || 'video'
    const isVideo = contentType === 'video' || contentType === 'both'
    const is3D = contentType === '3d' || contentType === 'both'

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
    <script src="https://cdn.jsdelivr.net/npm/aframe-extras@6.1.1/dist/aframe-extras.loaders.min.js"></script>
    
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
      
      /* Video resize controls (video-only mode) */
      #resizeControls {
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1005;
        display: none; /* only shown for video-only */
        background: rgba(255,255,255,0.95);
        border: 2px solid #000;
        border-radius: 14px;
        padding: 10px 12px;
        box-shadow: 0 10px 24px rgba(0,0,0,0.25);
        align-items: center;
        gap: 8px;
      }
      #resizeControls button {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 2px solid #000;
        background: #eee;
        font-weight: 800;
      }
      #resizeControls input[type="range"] {
        width: 220px;
      }
      @media (max-width: 768px) {
        #resizeControls { bottom: 80px; padding: 8px 10px; }
        #resizeControls input[type="range"] { width: 180px; }
      }
    </style>
  </head>
  <body>
    <div class="status-indicator" id="status-indicator">
      <h3 id="status-title">Point camera at your marker</h3>
      <p id="status-message">Look for your uploaded image</p>
    </div>



    <a-scene
      id="arScene"
      mindar-image="imageTargetSrc: ${mindFileUrl}; filterMinCF: 0.0001; filterBeta: 0.001; warmupTolerance: 50; missTolerance: 3600; showStats: false; maxTrack: 1;"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights: true, antialias: true, alpha: true"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
      loading-screen="enabled: false"
      style="opacity:0; transition: opacity .3s ease; transform: translateZ(0); will-change: transform;"
    >
      <a-assets>
        ${isVideo ? `
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
        ` : ''}
        ${is3D && experience.model_url ? `
        <a-asset-item id="arModel" src="${experience.model_url}"></a-asset-item>
        ` : ''}
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0" id="target">
        ${isVideo ? `
        <a-plane
          id="videoPlane"
          width="1"
          height="1"
          position="0 0 0.01"
          rotation="0 0 ${experience.video_rotation || 0}"
          material="src: #arVideo; transparent: true; alphaTest: 0.1; shader: flat; side: double"
          visible="false"
          geometry="primitive: plane"
        ></a-plane>
        ` : ''}
        ${is3D ? `
        <a-entity
          id="model3D"
          gltf-model="#arModel"
          position="${experience.model_position_x || 0} ${experience.model_position_y || (contentType === 'both' ? 0.3 : 0)} ${experience.model_position_z || (contentType === 'both' ? 0.15 : 0)}"
          rotation="0 ${experience.model_rotation || 0} 0"
          scale="${experience.model_scale || 1} ${experience.model_scale || 1} ${experience.model_scale || 1}"
          visible="false"
          animation-mixer="clip: *; loop: repeat; clampWhenFinished: false"
        ></a-entity>
        ` : ''}
      </a-entity>
    </a-scene>

    ${experience.link_url ? `
    <div id="externalLinkBtn">
      <a href="${experience.link_url}" target="_blank" rel="noopener noreferrer" aria-label="Open link">
        Open Link
      </a>
    </div>
    ` : ''}

    ${contentType === 'video' ? `
    <div id="resizeControls" aria-label="Resize video">
      <button id="scaleDown" aria-label="Scale down">−</button>
      <input id="videoScale" type="range" min="0.5" max="2" step="0.01" value="1" />
      <button id="scaleUp" aria-label="Scale up">+</button>
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

      // Function to update video plane to match marker dimensions; stores base size for scaling
      function updateVideoAspectRatio(videoElement, videoPlane) {
        if (!videoElement || !videoPlane) return;
        
        const updateDimensions = () => {
          if (videoElement.videoWidth && videoElement.videoHeight) {
            const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
            // Marker dimensions (1.0 x 1.0 by default in MindAR)
            const markerWidth = 1.0;
            const markerHeight = 1.0;
            
            // Calculate video dimensions to be 20% larger than marker
            const videoScale = 1.2; // 20% larger than marker
            let videoWidth, videoHeight;
            
            // For both portrait and landscape, we'll scale based on the video's natural orientation
            if (videoAspect > 1) {
              // Landscape video - scale to width
              videoWidth = markerWidth * videoScale;
              videoHeight = videoWidth / videoAspect;
            } else {
              // Portrait or square video - use larger scale for better visibility
              const portraitScale = videoScale * 1.5; // 50% larger scale for portrait
              videoHeight = markerHeight * portraitScale;
              videoWidth = videoHeight * videoAspect;
            }
            
            // Ensure minimum dimensions
            videoWidth = Math.max(0.5, videoWidth); // Increased minimum size
            videoHeight = Math.max(0.5, videoHeight); // Increased minimum size
            
            // Get the target element that contains the video plane
            const target = document.querySelector('#target');
            
            // Store base dims and apply current scale factor (if any)
            videoPlane.dataset.baseWidth = String(videoWidth);
            videoPlane.dataset.baseHeight = String(videoHeight);

            const slider = document.getElementById('videoScale');
            const scale = slider ? Number(slider.value) || 1 : 1;
            applyVideoScale(scale, videoPlane);
            
            console.log('Video dimensions set to:', videoWidth.toFixed(2), 'x', videoHeight.toFixed(2));
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
        const scene = document.getElementById('arScene');
        const video = document.querySelector('#arVideo');
        const model3D = document.querySelector('#model3D');
        const target = document.querySelector('#target');
        const videoPlane = document.querySelector('#videoPlane');
        const externalLinkBtn = document.getElementById('externalLinkBtn');
        const contentType = '${contentType}';
        const isVideo = contentType === 'video' || contentType === 'both';
        const is3D = contentType === '3d' || contentType === 'both';
        const resizeControls = document.getElementById('resizeControls');
        const scaleSlider = document.getElementById('videoScale');
        const scaleDown = document.getElementById('scaleDown');
        const scaleUp = document.getElementById('scaleUp');

        // Show external link only after content actually starts
        if (externalLinkBtn) {
          if (isVideo && video) {
            const revealLink = () => {
              externalLinkBtn.style.display = 'block';
            };
            // Reveal when playback begins (handles autoplay or user-initiated play)
            video.addEventListener('playing', revealLink, { once: true });
            video.addEventListener('play', revealLink, { once: true });
          } else if (is3D && !isVideo) {
            // 3D-only fallback: reveal when target is first found
            if (target) {
              const revealOnTarget = () => {
                externalLinkBtn.style.display = 'block';
              };
              target.addEventListener('targetFound', revealOnTarget, { once: true });
            }
          }
        }

        // Show resize controls only for video-only experiences
        if (resizeControls && isVideo && !is3D) {
          resizeControls.style.display = 'flex';
        }

        // Wire resize controls
        if (scaleSlider && videoPlane) {
          scaleSlider.addEventListener('input', () => {
            const val = Number(scaleSlider.value) || 1;
            applyVideoScale(val, videoPlane);
          });
        }
        if (scaleDown && scaleSlider && videoPlane) {
          scaleDown.addEventListener('click', () => {
            const next = Math.max(0.5, (Number(scaleSlider.value) || 1) - 0.05);
            scaleSlider.value = String(next);
            applyVideoScale(next, videoPlane);
          });
        }
        if (scaleUp && scaleSlider && videoPlane) {
          scaleUp.addEventListener('click', () => {
            const next = Math.min(2, (Number(scaleSlider.value) || 1) + 0.05);
            scaleSlider.value = String(next);
            applyVideoScale(next, videoPlane);
          });
        }

        // Brief initializing message (no user interaction needed)
        showStatus('Initializing...', 'Starting camera and tracker');
        setTimeout(hideStatus, 1000);

        console.log('AR Elements found:', {
          scene: !!scene,
          video: !!video,
          model3D: !!model3D,
          target: !!target,
          videoPlane: !!videoPlane,
          contentType: contentType,
          isVideo: isVideo,
          is3D: is3D,
          videoUrl: '${experience.video_url ? "present" : "missing"}',
          modelUrl: '${experience.model_url ? "present" : "missing"}'
        });

        // Preflight check for .mind URL
        const ok = await preflightMind('${mindFileUrl}');
        if (!ok && scene) {
          const fallbackMind = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';
          const attr = 'imageTargetSrc: ' + fallbackMind + '; interpolation: true; smoothing: true;';
          scene.setAttribute('mindar-image', attr);
          showStatus('Using fallback target', 'Your .mind file could not be loaded. Using a sample target to verify camera and tracking.');
        }

        if (video && videoPlane) {
          // Optimize video for performance
          video.playsInline = true;
          video.autoplay = false;
          video.controls = false;
          video.setAttribute('webkit-playsinline', 'true');
          video.setAttribute('x5-playsinline', 'true');

          // We'll handle the dimensions in updateVideoAspectRatio
          video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            // Trigger the aspect ratio update
            updateVideoAspectRatio(video, videoPlane);
            
            // Log video dimensions for debugging
            console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
            
            // Enable hardware acceleration for video
            video.style.transform = 'translateZ(0)';
            video.style.willChange = 'transform';
            video.style.backfaceVisibility = 'hidden';
          });

          // Video is now stable - no need for constant updates
        }

        // Setup 3D model animation
        if (is3D && model3D) {
          console.log('✅ Setting up 3D model listeners');
          console.log('Model element:', model3D);
          console.log('Model src:', model3D.getAttribute('gltf-model'));
          
          model3D.addEventListener('model-loaded', () => {
            console.log('✅ 3D model loaded successfully');
            
            // Get the animation mixer component
            const mixer = model3D.components['animation-mixer'];
            if (mixer) {
              console.log('Animation mixer found');
              console.log('Available animations:', mixer.mixer ? mixer.mixer._actions : 'none');
            }
          });
          
          model3D.addEventListener('model-error', (e) => {
            console.error('❌ 3D model failed to load:', e);
          });
        } else {
          if (is3D && !model3D) {
            console.error('❌ is3D is true but model3D element not found!');
          }
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
            
            // For 3D models, ensure animations are ready
            if (is3D && model3D) {
              console.log('3D AR mode - animations will auto-play when target is found');
            }
            
            // Log combined mode
            if (contentType === 'both') {
              console.log('🎬 Combined AR mode - Both video and 3D model will appear together');
              console.log('Video plane at z: 0.01, 3D model at y: 0.3, z: 0.15');
            }
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
                
                // Handle video AR
                if (isVideo) {
                  if (videoPlane) {
                    videoPlane.setAttribute('visible', 'true');
                    // Add smooth animation for appearance
                    videoPlane.setAttribute('animation', 'property: material.opacity; from: 0; to: 1; dur: 300');
                  }
                  if (video) {
                    // Don't restart; just ensure it's playing
                    video.muted = false;
                    if (video.paused) video.play().catch(() => {});
                  }
                }
                
                // Handle 3D model AR
                if (is3D && model3D) {
                  console.log('🎯 Showing 3D model');
                  console.log('Model position:', model3D.getAttribute('position'));
                  console.log('Model scale:', model3D.getAttribute('scale'));
                  
                  model3D.setAttribute('visible', 'true');
                  // Add smooth animation for appearance
                  model3D.setAttribute('animation', 'property: scale; from: 0 0 0; to: ${experience.model_scale || 1} ${experience.model_scale || 1} ${experience.model_scale || 1}; dur: 300; easing: easeOutElastic');
                  
                  // Explicitly play the model animations
                  const mixer = model3D.components['animation-mixer'];
                  if (mixer && mixer.mixer) {
                    console.log('Playing model animations');
                    mixer.mixer.clipAction(mixer.mixer._actions[0]?._clip).play();
                  }
                } else {
                  if (is3D && !model3D) {
                    console.error('❌ Should show 3D but model3D not found!');
                  }
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
            
            // Debounce target lost to reduce flickering - we persist content, so no visibility change
            if (targetLostTimeout) clearTimeout(targetLostTimeout);
            targetLostTimeout = setTimeout(() => {
              if (isTargetVisible) {
                isTargetVisible = false;
                // Keep content playing and visible; rely on missTolerance and last pose.
                // Optional: show a brief status without hiding content.
                showStatus('Target Lost', 'Content will re-align when marker is visible');
              }
            }, 1000);
          });
        } else {
          console.error('Target element not found!');
        }

        // Overlay and start button removed; initialization proceeds automatically.

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
