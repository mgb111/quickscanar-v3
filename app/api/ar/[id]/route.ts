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
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
        background: #000;
        font-family: Arial, sans-serif;
        user-select: none;
      }

      a-scene {
        width: 100vw;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
      }

      .status-indicator {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        text-align: center;
        z-index: 1002;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 10px;
        display: none;
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
    </style>
  </head>
  <body>
    <div class="status-indicator" id="status-indicator">
      <h3 id="status-title">Point camera at your marker</h3>
      <p id="status-message">Look for your uploaded image</p>
    </div>

    <div id="overlay" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);z-index:1003;">
      <div style="text-align:center;color:white;max-width:320px;padding:20px;">
        <h2 style="font-size:20px;font-weight:bold;margin-bottom:10px;">Ready to start AR</h2>
        <p style="font-size:14px;opacity:0.9;margin-bottom:16px;">Tap the button below, then allow camera access. Point your camera at the image you used to generate the .mind file.</p>
        <button id="startBtn" style="background:#cc3300;color:white;border:none;border-radius:8px;padding:12px 18px;font-weight:600;cursor:pointer;">Start AR</button>
      </div>
    </div>

    <div id="debug-toggle" style="position:fixed;top:10px;right:10px;z-index:1100;">
      <button id="toggleDebugBtn" style="background:#111;color:#fff;border:1px solid #444;border-radius:6px;padding:8px 10px;font-size:12px;cursor:pointer;opacity:0.85;">Debug</button>
    </div>
    <div id="debug-panel" style="display:none;position:fixed;top:50px;right:10px;width:320px;max-height:60vh;overflow:auto;background:rgba(0,0,0,0.85);color:#fff;border:1px solid #444;border-radius:8px;padding:10px;z-index:1100;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong>AR Debug</strong>
        <div>
          <button id="exportLogBtn" style="background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;font-size:11px;margin-right:6px;cursor:pointer;">Export</button>
          <button id="clearLogBtn" style="background:#333;color:#fff;border:1px solid #555;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;">Clear</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
        <button id="testVideoBtn" style="background:#cc3300;color:#fff;border:none;border-radius:4px;padding:6px 8px;font-size:12px;cursor:pointer;">Test Video</button>
        <button id="resetArBtn" style="background:#444;color:#fff;border:1px solid #666;border-radius:4px;padding:6px 8px;font-size:12px;cursor:pointer;">Reset AR</button>
        <button id="checkEnvBtn" style="background:#444;color:#fff;border:1px solid #666;border-radius:4px;padding:6px 8px;font-size:12px;cursor:pointer;">Check Env</button>
        <button id="checkResourcesBtn" style="background:#444;color:#fff;border:1px solid #666;border-radius:4px;padding:6px 8px;font-size:12px;cursor:pointer;">Check Resources</button>
      </div>
      <div id="debug-content" style="font-family:monospace;font-size:12px;white-space:pre-wrap;line-height:1.25;"></div>
    </div>

    <a-scene
      id="arScene"
      mindar-image="imageTargetSrc: ${mindFileUrl};"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
      loading-screen="enabled: false"
      style="opacity:0; transition: opacity .3s ease;"
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
          material="shader: flat; src: #videoTexture; transparent: true"
          visible="false"
        ></a-plane>
      </a-entity>
    </a-scene>

    <script>
      async function preflightMind(url) {
        try {
          const res = await fetch(url, { method: 'GET', mode: 'cors' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return true;
        } catch (e) {
          console.error('Mind file preflight failed:', e);
          return false;
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

      function logDebug(...args) {
        try {
          console.log('[AR]', ...args);
          const panel = document.getElementById('debug-content');
          if (panel) {
            const line = document.createElement('div');
            line.textContent = args.map(a => {
              try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch { return String(a); }
            }).join(' ');
            panel.appendChild(line);
            panel.scrollTop = panel.scrollHeight;
          }
        } catch {}
      }

      async function checkEnvironment() {
        const result = {
          webgl: !!(window.WebGLRenderingContext),
          mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          userAgent: navigator.userAgent,
        };
        logDebug('Env:', result);
        return result;
      }

      async function checkResources() {
        const endpoints = [
          { name: 'mind', url: '${mindFileUrl}' },
          { name: 'video', url: '${experience.video_url}' },
        ];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep.url, { method: 'HEAD', mode: 'cors' });
            logDebug('Resource', ep.name, 'status:', res.status);
          } catch (e) {
            logDebug('Resource', ep.name, 'error:', e && e.message);
          }
        }
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
          video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            const ratio = video.videoWidth / video.videoHeight || (16/9);
            const planeHeight = 1 / ratio;
            videoPlane.setAttribute('width', 1);
            videoPlane.setAttribute('height', planeHeight);
            backgroundPlane.setAttribute('width', 1);
            backgroundPlane.setAttribute('height', planeHeight);
          });
        }

        // A-Frame/MindAR lifecycle
        if (scene) {
          scene.addEventListener('arReady', () => {
            console.log('MindAR arReady');
            scene.style.opacity = '1';
          });
          scene.addEventListener('arError', (e) => {
            console.error('MindAR arError', e);
            showStatus('AR Initialization Error', 'Please allow camera access and try again.');
          });
        }

        if (target) {
          console.log('Target element found, adding event listeners');
          target.addEventListener('targetFound', () => {
            console.log('Target found!');
            if (backgroundPlane) backgroundPlane.setAttribute('visible', 'true');
            if (videoPlane) videoPlane.setAttribute('visible', 'true');
            if (video) video.play().catch(() => {});
            showStatus('Target Found!', 'AR content should be visible');
            setTimeout(hideStatus, 1500);
          });

          target.addEventListener('targetLost', () => {
            console.log('Target lost!');
            if (backgroundPlane) backgroundPlane.setAttribute('visible', 'false');
            if (videoPlane) videoPlane.setAttribute('visible', 'false');
            if (video) video.pause();
            showStatus('Target Lost', 'Point camera at your marker again');
          });
        } else {
          console.error('Target element not found!');
        }

        // Tap to start to satisfy autoplay/camera permissions
        if (startBtn && overlay) {
          startBtn.addEventListener('click', async () => {
            try {
              if (video) await video.play().catch(() => {});
            } catch {}
            overlay.style.display = 'none';
            showStatus('Initializing...', 'Starting camera and tracker');
            setTimeout(hideStatus, 1000);
          }, { once: true });
        }

        setInterval(nukeLoadingScreens, 1000);

        const toggleBtn = document.getElementById('toggleDebugBtn');
        const debugPanel = document.getElementById('debug-panel');
        const clearLogBtn = document.getElementById('clearLogBtn');
        const exportLogBtn = document.getElementById('exportLogBtn');
        const testVideoBtn = document.getElementById('testVideoBtn');
        const resetArBtn = document.getElementById('resetArBtn');
        const checkEnvBtn = document.getElementById('checkEnvBtn');
        const checkResourcesBtn = document.getElementById('checkResourcesBtn');

        toggleBtn?.addEventListener('click', () => {
          if (!debugPanel) return;
          debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        });

        clearLogBtn?.addEventListener('click', () => {
          const panel = document.getElementById('debug-content');
          if (panel) panel.textContent = '';
        });

        exportLogBtn?.addEventListener('click', () => {
          const panel = document.getElementById('debug-content');
          if (!panel) return;
          const blob = new Blob([panel.textContent || ''], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ar-debug-log.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });

        checkEnvBtn?.addEventListener('click', checkEnvironment);
        checkResourcesBtn?.addEventListener('click', checkResources);

        testVideoBtn?.addEventListener('click', async () => {
          const v = document.getElementById('videoTexture');
          if (v && 'play' in v) {
            try { await v.play(); logDebug('Test video: play ok'); } catch (e) { logDebug('Test video: play error', e && e.message); }
          }
        });

        resetArBtn?.addEventListener('click', () => {
          const scene = document.getElementById('arScene');
          if (scene) {
            logDebug('Resetting AR scene');
            scene.style.opacity = '0';
            setTimeout(() => { scene.style.opacity = '1'; }, 50);
          }
        });

        logDebug('DOM loaded, initializing AR script');
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
