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
    const usingCustomMind = !!experience.mind_file_url

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

      /* Force smooth transitions on all AR elements */
      a-entity[mindar-image-target] {
        transition: transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      }

      a-plane {
        transition: transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      }

      /* Reduce jitter with CSS stabilization */
      #videoPlane {
        transform-style: preserve-3d !important;
        transition: all 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
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
        right: 16px;
        bottom: 16px;
        z-index: 1004;
        display: none; /* shown dynamically if link exists */
      }
      #externalLinkBtn a {
        text-decoration: none;
        background: #1f2937; /* dark-blue-ish to match site */
        color: #ffffff;
        border: 2px solid #000000;
        border-radius: 9999px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        opacity: 0.9;
        transition: transform .2s ease, opacity .2s ease, box-shadow .2s ease;
      }
      #externalLinkBtn a:hover {
        transform: translateY(-1px);
        opacity: 1;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      }
      @media (max-width: 768px) { 
        #externalLinkBtn a { padding: 9px 12px; font-size: 12px; }
        #externalLinkBtn { right: 12px; bottom: 12px; }
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
      mindar-image="imageTargetSrc: ${mindFileUrl}; filterMinCF: 0.00001; filterBeta: 1000; missTolerance: 15; warmupTolerance: 2;"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights, antialias: true, alpha: true"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
      loading-screen="enabled: false"
      style="opacity:0; transition: opacity .3s ease; transform: translateZ(0); will-change: transform;"
    >
      <a-assets>
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
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity mindar-image-target="targetIndex: 0" id="target">
        <a-plane
          id="backgroundPlane"
          width="1"
          height="1"
          position="0 0 0.005"
          rotation="0 0 ${(experience.video_rotation || 0) * Math.PI / 180}"
          material="color: #000000"
          visible="false"
        ></a-plane>

        <a-plane
          id="videoPlane"
          width="1"
          height="1"
          position="0 0 0.01"
          rotation="0 0 ${(experience.video_rotation || 0) * Math.PI / 180}"
          material="shader: flat; src: #videoTexture; transparent: true; alphaTest: 0.1"
          visible="false"
          geometry="primitive: plane; skipCache: true"
          style="transform: translateZ(0); will-change: transform; backface-visibility: hidden;"
          animation="property: object3D.position; dur: 100; easing: easeOutQuad; loop: false"
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

      document.addEventListener("DOMContentLoaded", async () => {
        console.log('AR Experience DOM loaded');
        nukeLoadingScreens();

        const startBtn = document.getElementById('startBtn');
        const overlay = document.getElementById('overlay');
        const scene = document.getElementById('arScene');
        const video = document.querySelector('#videoTexture');
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
          const attr = 'imageTargetSrc: ' + fallbackMind + ';';
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
            
            // Apply custom stabilization after AR is ready
            setTimeout(() => {
              interceptMatrixUpdates();
              addFrameRateLimiter();
              console.log('Applied custom matrix stabilization and frame rate limiting');
            }, 1000);
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
        
        // Advanced stabilization system
        let lastTransform = null;
        let transformBuffer = [];
        const TRANSFORM_BUFFER_SIZE = 5;
        const SMOOTHING_FACTOR = 0.7;
        
        // Custom matrix smoothing function
        function smoothTransform(newTransform) {
          if (!lastTransform) {
            lastTransform = newTransform;
            return newTransform;
          }
          
          // Simple exponential smoothing
          const smoothed = newTransform.map((row, i) => 
            row.map((val, j) => 
              SMOOTHING_FACTOR * lastTransform[i][j] + (1 - SMOOTHING_FACTOR) * val
            )
          );
          
          lastTransform = smoothed;
          return smoothed;
        }
        
        // Override MindAR's matrix updates for custom stabilization
        function interceptMatrixUpdates() {
          const target = document.querySelector('#target');
          if (target && target.object3D) {
            const originalUpdateMatrix = target.updateWorldMatrix;
            target.updateWorldMatrix = function(worldMatrix) {
              if (worldMatrix && isTargetVisible) {
                // Apply custom smoothing to the world matrix
                const smoothedMatrix = smoothTransform(worldMatrix);
                originalUpdateMatrix.call(this, smoothedMatrix);
              } else {
                originalUpdateMatrix.call(this, worldMatrix);
              }
            };
          }
        }
        
        // Add frame rate limiting to reduce update frequency
        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 1000 / 30; // Limit to 30 FPS for stability
        
        function addFrameRateLimiter() {
          const scene = document.querySelector('a-scene');
          if (scene && scene.systems && scene.systems['mindar-image-system']) {
            const system = scene.systems['mindar-image-system'];
            const originalProcessVideo = system.processingVideo;
            
            system.processVideo = function(input) {
              const now = Date.now();
              if (now - lastUpdateTime >= UPDATE_INTERVAL) {
                lastUpdateTime = now;
                return originalProcessVideo.call(this, input);
              }
            };
          }
        }

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
                if (backgroundPlane) backgroundPlane.setAttribute('visible', 'false');
                if (videoPlane) {
                  // Add smooth animation for disappearance
                  videoPlane.setAttribute('animation', 'property: material.opacity; from: 1; to: 0; dur: 200');
                  setTimeout(() => {
                    videoPlane.setAttribute('visible', 'false');
                  }, 200);
                }
                if (video) video.pause();
                showStatus('Target Lost', 'Point camera at your marker again');
              }
            }, 300); // 300ms debounce for lost (longer to prevent flickering)
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
            
            try {
              if (video) await video.play().catch(() => {});
            } catch {}
            
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
      },
    })
  } catch (error) {
    console.error('Error serving AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
