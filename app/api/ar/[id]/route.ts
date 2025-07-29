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

    // Use the user's actual MindAR file and marker image
    const mindFileUrl = experience.mind_file_url || 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const markerImageUrl = experience.marker_image_url

    // Simple, clean AR HTML - no loading screen removal
    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>${experience.title} - AR Experience</title>
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
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      a-scene {
        width: 100vw;
        height: 100vh;
        position: absolute;
        top: 0;
        left: 0;
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
    </style>
  </head>
  <body>
    <div class="debug-panel" id="debug-panel">
      <strong>AR Status:</strong><br>
      <div id="debug-content"></div>
    </div>

    <div class="status-indicator" id="status-indicator">
      <h3 id="status-title">Point camera at your marker</h3>
      <p id="status-message">Look for your uploaded image</p>
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
        <!-- Marker plane (invisible) -->
        <a-plane 
          src="#marker"
          position="0 0 0"
          height="${experience.plane_height || 0.552}"
          width="${experience.plane_width || 1}"
          rotation="0 0 0"
          material="transparent: true; opacity: 0.0"
          visible="false"
        ></a-plane>

        <!-- Video plane (visible when target found) -->
        <a-plane
          id="videoPlane"
          width="${experience.plane_width || 1}"
          height="${experience.plane_height || 0.552}"
          position="0 0 0.01"
          rotation="0 0 ${(experience.video_rotation || 0) * Math.PI / 180}"
          material="shader: flat; src: #videoTexture"
          visible="false"
        ></a-plane>

        <!-- Debug plane to show marker detection -->
        <a-plane
          id="debugPlane"
          src="#marker"
          position="0 0 0.02"
          height="${experience.plane_height || 0.552}"
          width="${experience.plane_width || 1}"
          rotation="0 0 0"
          material="transparent: true; opacity: 0.5"
          visible="false"
        ></a-plane>
      </a-entity>
    </a-scene>

    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
    
    <script>
      let isMobile = false;
      let targetFound = false;

      function updateDebug(message) {
        const debugContent = document.getElementById('debug-content');
        const timestamp = new Date().toLocaleTimeString();
        debugContent.innerHTML += \`[\${timestamp}] \${message}<br>\`;
        console.log(message);
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
        isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        updateDebug(\`Device: \${isMobile ? 'Mobile' : 'Desktop'}\`);
        return isMobile;
      }

      document.addEventListener("DOMContentLoaded", () => {
        updateDebug("AR Experience loaded");
        
        // Detect mobile device
        detectMobile();
        
        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        const videoPlane = document.querySelector("#videoPlane");
        const debugPlane = document.querySelector("#debugPlane");
        const scene = document.querySelector("a-scene");
        
        // Show status indicator
        showStatus("Point camera at your marker", "Look for your uploaded image");
        
        // Test camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          updateDebug("Testing camera access...");
          
          const constraints = {
            video: {
              width: { ideal: isMobile ? 1280 : 1920 },
              height: { ideal: isMobile ? 720 : 1080 },
              facingMode: 'environment',
              frameRate: { ideal: 30 }
            }
          };
          
          navigator.mediaDevices.getUserMedia(constraints)
            .then(() => {
              updateDebug("✅ Camera permission granted");
            })
            .catch((error) => {
              updateDebug("❌ Camera permission denied: " + error.message);
            });
        }
        
        if (scene) {
          scene.addEventListener("loaded", () => {
            updateDebug("✅ AR Scene loaded successfully");
          });
          
          scene.addEventListener("renderstart", () => {
            updateDebug("✅ AR rendering started");
          });

          scene.addEventListener("error", (error) => {
            updateDebug("❌ AR Scene error: " + error);
          });
        }
        
        if (target) {
          target.addEventListener("targetFound", () => {
            updateDebug("🎯 Target found - showing AR content");
            targetFound = true;
            
            // Show video plane
            if (videoPlane) {
              videoPlane.setAttribute('visible', 'true');
              updateDebug("✅ Video plane made visible");
            }
            
            // Show debug plane
            if (debugPlane) {
              debugPlane.setAttribute('visible', 'true');
              updateDebug("✅ Debug plane made visible");
            }
            
            // Play video
            if (video) {
              video.play().catch(e => updateDebug("❌ Video play error: " + e));
              updateDebug("✅ Video started playing");
            }
            
            // Update status
            showStatus("Target Found!", "AR content should be visible");
            
            // Hide status after 3 seconds
            setTimeout(() => {
              hideStatus();
            }, 3000);
          });
          
          target.addEventListener("targetLost", () => {
            updateDebug("❌ Target lost");
            targetFound = false;
            
            // Hide video plane
            if (videoPlane) {
              videoPlane.setAttribute('visible', 'false');
            }
            
            // Hide debug plane
            if (debugPlane) {
              debugPlane.setAttribute('visible', 'false');
            }
            
            // Pause video
            if (video) {
              video.pause();
            }
            
            // Show status again
            showStatus("Target Lost", "Point camera at your marker again");
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