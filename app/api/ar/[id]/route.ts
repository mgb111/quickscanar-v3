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

    const mindFileUrl = experience.mind_file_url || 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const markerImageUrl = experience.marker_image_url
    const usingCustomMind = !!experience.mind_file_url

    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>${experience.title} - AR Experience</title>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
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
    <!-- Debug panel disabled -->
    <!--
    <div class="debug-panel" id="debug-panel">
      <strong>AR Status:</strong><br>
      <div id="debug-content"></div>
    </div>
    -->

    <div class="status-indicator" id="status-indicator">
      <h3 id="status-title">Point camera at your marker</h3>
      <p id="status-message">Look for your uploaded image</p>
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
    >
      <a-assets>
        <img id="marker" src="${markerImageUrl}" crossorigin="anonymous" />
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
          src="#marker"
          position="0 0 0"
          height="${experience.plane_height || 0.552}"
          width="${experience.plane_width || 1}"
          material="transparent: true; opacity: 0.0"
          visible="false"
        ></a-plane>

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

        <a-plane
          id="debugPlane"
          src="#marker"
          position="0 0 0.02"
          height="1"
          width="1"
          material="transparent: true; opacity: 0.0"
          visible="false"
        ></a-plane>
      </a-entity>
    </a-scene>

    <script>
      function updateDebug(message) {
        // Debugging disabled
        // console.log(message);
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

      function detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
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

      function switchToFallback() {
        const scene = document.getElementById('arScene');
        if (!scene) return;
        const fallbackMindFile = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';
        scene.setAttribute('mindar-image', \`imageTargetSrc: \${fallbackMindFile};\`);
      }

      nukeLoadingScreens();

      document.addEventListener("DOMContentLoaded", () => {
        nukeLoadingScreens();
        const isMobile = detectMobile();

        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        const videoPlane = document.querySelector("#videoPlane");
        const backgroundPlane = document.querySelector("#backgroundPlane");
        const debugPlane = document.querySelector("#debugPlane");

        if (video && videoPlane) {
          video.addEventListener('loadedmetadata', () => {
            const ratio = video.videoWidth / video.videoHeight;
            const planeHeight = 1 / ratio;
            videoPlane.setAttribute('width', 1);
            videoPlane.setAttribute('height', planeHeight);
            backgroundPlane.setAttribute('width', 1);
            backgroundPlane.setAttribute('height', planeHeight);
            debugPlane.setAttribute('width', 1);
            debugPlane.setAttribute('height', planeHeight);
          });
        }

        showStatus("Point camera at your marker", "Look for your uploaded image");

        target?.addEventListener("targetFound", () => {
          backgroundPlane?.setAttribute('visible', 'true');
          videoPlane?.setAttribute('visible', 'true');
          debugPlane?.setAttribute('visible', 'true');

          setTimeout(() => {
            debugPlane?.setAttribute('visible', 'false');
          }, 2000);

          video?.play();
          showStatus("Target Found!", "AR content should be visible");
          setTimeout(hideStatus, 3000);
        });

        target?.addEventListener("targetLost", () => {
          backgroundPlane?.setAttribute('visible', 'false');
          videoPlane?.setAttribute('visible', 'false');
          debugPlane?.setAttribute('visible', 'false');
          video?.pause();
          showStatus("Target Lost", "Point camera at your marker again");
        });

        setInterval(nukeLoadingScreens, 1000);
      });

      window.addEventListener('error', (event) => {
        if (event.error?.message?.includes('RangeError')) {
          switchToFallback();
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('RangeError')) {
          switchToFallback();
        }
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
