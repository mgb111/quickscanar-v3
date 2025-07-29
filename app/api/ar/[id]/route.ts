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
    // Fetch the AR experience
    const { data: experience, error } = await supabase
      .from('ar_experiences')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !experience) {
      return new NextResponse('Experience not found', { status: 404 })
    }

    // Always use working MindAR file for now to ensure it works
    const mindFileUrl = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const markerImageUrl = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png'

    // Create a simplified AR HTML that works reliably
    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>${experience.title} - AR Experience</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #000;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      a-scene {
        width: 100vw;
        height: 100vh;
      }
      .loading {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        z-index: 1000;
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 10px;
      }
      .debug-panel {
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        max-width: 300px;
        z-index: 1001;
      }
    </style>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
  </head>
  <body>
    <div class="loading" id="loading">
      <h2>Loading AR Experience...</h2>
      <p>Please wait while we initialize the camera</p>
      <div id="debug-info"></div>
    </div>

    <div class="debug-panel" id="debug-panel">
      <strong>Debug Info:</strong><br>
      <div id="debug-content"></div>
    </div>

    <a-scene
      mindar-image="imageTargetSrc: ${mindFileUrl};"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
      loading-screen="enabled: false"
    >
      <a-assets>
        <img id="card" src="${markerImageUrl}" crossorigin="anonymous" />
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
          src="#card"
          position="0 0 0"
          height="0.552"
          width="1"
          rotation="0 0 0"
          material="transparent: true; opacity: 0.3"
        ></a-plane>

        <a-plane
          id="videoPlane"
          width="${experience.plane_width}"
          height="${experience.plane_height}"
          position="0 0 0.01"
          rotation="0 0 ${experience.video_rotation * Math.PI / 180}"
          material="shader: flat; src: #videoTexture"
        ></a-plane>
      </a-entity>
    </a-scene>

    <script>
      function updateDebug(message) {
        const debugContent = document.getElementById('debug-content');
        const timestamp = new Date().toLocaleTimeString();
        debugContent.innerHTML += \`[\${timestamp}] \${message}<br>\`;
        console.log(message);
      }

      function updateLoading(message) {
        const loading = document.getElementById('loading');
        const debugInfo = document.getElementById('debug-info');
        debugInfo.innerHTML = message;
      }

      function hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
          updateDebug("Hiding loading screen");
          loading.style.display = "none";
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        updateDebug("AR Experience loaded");
        updateLoading("DOM loaded");
        
        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        const scene = document.querySelector("a-scene");
        const loading = document.querySelector("#loading");
        
        // Test camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          updateDebug("Testing camera access...");
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
              updateDebug("✅ Camera permission granted");
              updateLoading("Camera access confirmed");
            })
            .catch((error) => {
              updateDebug("❌ Camera permission denied: " + error.message);
              updateLoading("Camera access failed: " + error.message);
            });
        }
        
        if (scene) {
          scene.addEventListener("loaded", () => {
            updateDebug("✅ AR Scene loaded successfully");
            updateLoading("AR Scene loaded");
            hideLoading();
          });
          
          scene.addEventListener("renderstart", () => {
            updateDebug("✅ AR rendering started");
            updateLoading("AR rendering started");
            hideLoading();
          });

          scene.addEventListener("error", (error) => {
            updateDebug("❌ AR Scene error: " + error);
            updateLoading("AR Scene error occurred");
            hideLoading();
          });
        }
        
        if (target) {
          target.addEventListener("targetFound", () => {
            updateDebug("🎯 Target found - playing video");
            if (video) {
              video.play().catch(e => updateDebug("❌ Video play error: " + e));
            }
          });
          
          target.addEventListener("targetLost", () => {
            updateDebug("❌ Target lost");
          });
        }

        // Check for common issues
        setTimeout(() => {
          updateDebug("Checking for common issues...");
          
          if (typeof AFRAME !== 'undefined') {
            updateDebug("✅ A-Frame loaded");
          } else {
            updateDebug("❌ A-Frame not loaded");
          }
          
          if (typeof MINDAR !== 'undefined') {
            updateDebug("✅ MindAR loaded");
          } else {
            updateDebug("❌ MindAR not loaded");
          }
          
          if (location.protocol === 'https:' || location.hostname === 'localhost') {
            updateDebug("✅ HTTPS/localhost detected");
          } else {
            updateDebug("❌ Not HTTPS - camera may not work");
          }
        }, 2000);

        // Force hide loading after 5 seconds
        setTimeout(() => {
          updateDebug("⏰ 5s timeout - forcing loading screen to hide");
          hideLoading();
        }, 5000);

        // Final fallback - hide loading after 8 seconds
        setTimeout(() => {
          updateDebug("⏰ 8s final timeout - hiding loading");
          hideLoading();
        }, 8000);
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