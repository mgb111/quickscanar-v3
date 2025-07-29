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

    // Use the user's actual MindAR file and marker image with fallback
    const mindFileUrl = experience.mind_file_url || 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const markerImageUrl = experience.marker_image_url
    const workingMindFileUrl = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const workingMarkerUrl = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png'

    // Create the AR HTML with proper MindAR integration and crossorigin fixes
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
      .fallback-camera {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 999;
        display: none;
      }
      .fallback-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .mobile-notice {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 1002;
        display: none;
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

    <div class="mobile-notice" id="mobile-notice">
      <h3>Mobile AR Experience</h3>
      <p>Point your camera at your marker image to see AR content</p>
      <p>Make sure you're in a well-lit environment</p>
    </div>

    <!-- Fallback camera view -->
    <div class="fallback-camera" id="fallback-camera">
      <video class="fallback-video" id="fallback-video" autoplay playsinline muted></video>
      <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px;">
        <p>Fallback Camera View</p>
        <p>MindAR failed to load</p>
      </div>
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
        <img id="working-marker" src="${workingMarkerUrl}" crossorigin="anonymous" />
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
          height="${experience.plane_height}"
          width="${experience.plane_width}"
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
      let mindarLoaded = false;
      let aframeLoaded = false;
      let fallbackActivated = false;
      let sceneLoaded = false;
      let isMobile = false;
      let customMindFileFailed = false;
      let mindarSystem = null;

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

      function detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        updateDebug(\`Device: \${isMobile ? 'Mobile' : 'Desktop'}\`);
        return isMobile;
      }

      function activateFallback() {
        if (fallbackActivated) return;
        fallbackActivated = true;
        
        updateDebug("🔄 Activating fallback camera view");
        updateLoading("Activating fallback camera");
        
        const fallbackCamera = document.getElementById('fallback-camera');
        const fallbackVideo = document.getElementById('fallback-video');
        
        // Get camera stream with mobile optimizations
        const constraints = {
          video: {
            width: { ideal: isMobile ? 1280 : 1920 },
            height: { ideal: isMobile ? 720 : 1080 },
            facingMode: 'environment', // Use back camera on mobile
            frameRate: { ideal: 30 }
          }
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
          .then(stream => {
            fallbackVideo.srcObject = stream;
            fallbackCamera.style.display = 'block';
            updateDebug("✅ Fallback camera activated");
            updateLoading("Fallback camera active");
            hideLoading();
          })
          .catch(error => {
            updateDebug("❌ Fallback camera failed: " + error.message);
            updateLoading("Fallback camera failed");
            hideLoading();
          });
      }

      function tryWorkingMindAR() {
        if (customMindFileFailed) return;
        customMindFileFailed = true;
        
        updateDebug("🔄 Trying working MindAR file as fallback");
        updateLoading("Trying working MindAR file");
        
        const scene = document.querySelector("a-scene");
        if (scene) {
          // Update the scene to use working MindAR file
          scene.setAttribute('mindar-image', 'imageTargetSrc: ${workingMindFileUrl};');
          
          // Update the marker image
          const markerPlane = document.querySelector("#target a-plane");
          if (markerPlane) {
            markerPlane.setAttribute('src', '#working-marker');
            markerPlane.setAttribute('height', '0.552');
            markerPlane.setAttribute('width', '1');
          }
          
          updateDebug("✅ Switched to working MindAR file");
          updateLoading("Using working MindAR file");
        }
      }

      function checkMindARSystem() {
        const scene = document.querySelector("a-scene");
        if (scene) {
          // Wait for A-Frame to be ready
          scene.addEventListener('loaded', () => {
            setTimeout(() => {
              // Check if MindAR system is available
              if (typeof AFRAME !== 'undefined' && AFRAME.systems['mindar-image-system']) {
                mindarSystem = AFRAME.systems['mindar-image-system'];
                updateDebug("✅ MindAR system found");
                
                // Check if MindAR is properly initialized
                if (mindarSystem.arProfile) {
                  updateDebug("✅ MindAR profile loaded");
                } else {
                  updateDebug("⚠️ MindAR profile not loaded");
                  tryWorkingMindAR();
                }
              } else {
                updateDebug("❌ MindAR system not found");
                tryWorkingMindAR();
              }
            }, 2000);
          });
        }
      }

      document.addEventListener("DOMContentLoaded", () => {
        updateDebug("AR Experience loaded");
        updateLoading("DOM loaded");
        
        // Detect mobile device
        detectMobile();
        
        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        const scene = document.querySelector("a-scene");
        const loading = document.querySelector("#loading");
        const mobileNotice = document.getElementById('mobile-notice');
        
        // Show mobile notice for mobile devices
        if (isMobile) {
          mobileNotice.style.display = 'block';
          setTimeout(() => {
            mobileNotice.style.display = 'none';
          }, 5000);
        }
        
        // Test camera access first with mobile optimizations
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
              updateLoading("Camera access confirmed");
            })
            .catch((error) => {
              updateDebug("❌ Camera permission denied: " + error.message);
              updateLoading("Camera access failed: " + error.message);
            });
        } else {
          updateDebug("❌ Camera API not available");
          updateLoading("Camera API not supported");
        }
        
        if (scene) {
          scene.addEventListener("loaded", () => {
            updateDebug("✅ AR Scene loaded successfully");
            updateLoading("AR Scene loaded");
            sceneLoaded = true;
            hideLoading();
            
            // Check MindAR system after scene loads
            checkMindARSystem();
          });
          
          scene.addEventListener("renderstart", () => {
            updateDebug("✅ AR rendering started");
            updateLoading("AR rendering started");
            hideLoading();
          });

          scene.addEventListener("error", (error) => {
            updateDebug("❌ AR Scene error: " + error);
            updateLoading("AR Scene error occurred");
            tryWorkingMindAR();
          });

          // Check if scene is actually loading
          setTimeout(() => {
            if (scene.hasAttribute('loaded')) {
              updateDebug("✅ Scene loaded attribute present");
            } else {
              updateDebug("⚠️ Scene loaded attribute missing");
              tryWorkingMindAR();
            }
          }, 3000);
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
          
          // Check if A-Frame is loaded
          if (typeof AFRAME !== 'undefined') {
            updateDebug("✅ A-Frame loaded");
            aframeLoaded = true;
          } else {
            updateDebug("❌ A-Frame not loaded");
            activateFallback();
          }
          
          // Check if MindAR is loaded
          if (typeof MINDAR !== 'undefined') {
            updateDebug("✅ MindAR loaded");
            mindarLoaded = true;
          } else {
            updateDebug("❌ MindAR not loaded");
            activateFallback();
          }
          
          // Check if we're on HTTPS or localhost
          if (location.protocol === 'https:' || location.hostname === 'localhost') {
            updateDebug("✅ HTTPS/localhost detected");
          } else {
            updateDebug("❌ Not HTTPS - camera may not work");
          }
        }, 2000);

        // Try working MindAR file if custom file fails within 4 seconds
        setTimeout(() => {
          if (!sceneLoaded && !fallbackActivated) {
            updateDebug("⏰ 4s timeout - trying working MindAR file");
            tryWorkingMindAR();
          }
        }, 4000);

        // Activate fallback if MindAR doesn't load within 6 seconds
        setTimeout(() => {
          if (!mindarLoaded || !aframeLoaded) {
            updateDebug("⏰ 6s timeout - activating fallback");
            activateFallback();
          }
        }, 6000);

        // Force hide loading after 8 seconds
        setTimeout(() => {
          if (!sceneLoaded && !fallbackActivated) {
            updateDebug("⏰ 8s timeout - forcing fallback");
            activateFallback();
          }
        }, 8000);

        // Hide loading after 10 seconds as final fallback
        setTimeout(() => {
          if (!sceneLoaded && !fallbackActivated) {
            updateDebug("⏰ 10s final timeout - hiding loading");
            hideLoading();
          }
        }, 10000);
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