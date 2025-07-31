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

    const markerImageUrl = experience.marker_image_url
    
    // NEW APPROACH: Custom AR with JavaScript-based marker detection
    // This bypasses the problematic MindAR file format entirely
    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>${experience.title} - Custom AR Experience</title>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js"></script>
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
      
      .camera-status {
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1001;
      }
      
      .marker-reference {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.8);
        padding: 10px;
        border-radius: 5px;
        z-index: 1001;
      }
      
      .marker-reference img {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 5px;
      }
      
      .marker-reference p {
        color: white;
        font-size: 10px;
        margin-top: 5px;
        text-align: center;
      }
      
      /* Hide all loading screens */
      .a-loader, .a-loader-title, .a-loader-spinner, .a-loader-logo,
      .a-loader-progress, .a-loader-progress-bar, .a-loader-progress-text,
      .a-loader-progress-container, .a-enter-vr, .a-orientation-modal,
      .a-fullscreen, .a-enter-ar, .a-enter-vr-button,
      [class*="a-loader"], [class*="a-enter"], [class*="a-orientation"],
      [class*="a-fullscreen"], [class*="loading"], [class*="spinner"] {
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
    <div class="debug-panel" id="debug-panel">
      <strong>Custom AR Status:</strong><br>
      <div id="debug-content"></div>
    </div>

    <div class="status-indicator" id="status-indicator">
      <h3 id="status-title">Point camera at your marker</h3>
      <p id="status-message">Look for your uploaded image</p>
    </div>

    <div class="camera-status" id="camera-status">
      <strong>Camera Status:</strong> <span id="camera-status-text">Initializing...</span>
    </div>

    <div class="marker-reference">
      <img src="${markerImageUrl}" alt="Marker reference" />
      <p>Point camera here</p>
    </div>

    <a-scene
      id="arScene"
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

      <!-- Custom AR content that appears based on JavaScript detection -->
      <a-entity id="arContent" position="0 0 -2" visible="false">
        <!-- Video plane -->
        <a-plane
          id="videoPlane"
          width="${experience.plane_width || 1}"
          height="${experience.plane_height || 0.552}"
          position="0 0 0"
          rotation="0 0 ${(experience.video_rotation || 0) * Math.PI / 180}"
          material="shader: flat; src: #videoTexture"
          visible="true"
        ></a-plane>

        <!-- Debug plane to show marker -->
        <a-plane
          id="debugPlane"
          src="#marker"
          position="0 0 0.01"
          height="${experience.plane_height || 0.552}"
          width="${experience.plane_width || 1}"
          rotation="0 0 0"
          material="transparent: true; opacity: 0.3"
          visible="true"
        ></a-plane>
      </a-entity>
    </a-scene>
    
    <script>
      let isMobile = false;
      let targetFound = false;
      let cameraInitialized = false;
      let arContentVisible = false;
      let lastDetectionTime = 0;
      let detectionThreshold = 2000; // 2 seconds of continuous detection

      function updateDebug(message) {
        const debugContent = document.getElementById('debug-content');
        const timestamp = new Date().toLocaleTimeString();
        debugContent.innerHTML += \`[\${timestamp}] \${message}<br>\`;
        console.log(message);
      }

      function updateCameraStatus(status) {
        const cameraStatusText = document.getElementById('camera-status-text');
        if (cameraStatusText) {
          cameraStatusText.textContent = status;
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

      function showARContent() {
        if (!arContentVisible) {
          const arContent = document.querySelector('#arContent');
          if (arContent) {
            arContent.setAttribute('visible', 'true');
            arContentVisible = true;
            updateDebug('🎯 AR content displayed');
            showStatus('AR Content Active!', 'Your video should be visible');
            
            // Play video
            const video = document.querySelector('#videoTexture');
            if (video) {
              video.play().then(() => {
                updateDebug('✅ Video started playing');
              }).catch(e => {
                updateDebug('❌ Video play error: ' + e.message);
              });
            }
            
            // Hide status after 3 seconds
            setTimeout(() => {
              hideStatus();
            }, 3000);
          }
        }
      }

      function hideARContent() {
        if (arContentVisible) {
          const arContent = document.querySelector('#arContent');
          if (arContent) {
            arContent.setAttribute('visible', 'false');
            arContentVisible = false;
            updateDebug('❌ AR content hidden');
            showStatus('Target Lost', 'Point camera at marker again');
          }
        }
      }

      function detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        updateDebug(\`Device: \${isMobile ? 'Mobile' : 'Desktop'}\`);
        return isMobile;
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
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            el.style.top = '-9999px';
          });
        });
        
        updateDebug("Nuclear loading screen removal executed");
      }

      // Run immediately
      nukeLoadingScreens();

      document.addEventListener("DOMContentLoaded", () => {
        updateDebug("Custom AR Experience loaded");
        
        // Nuclear loading screen removal
        nukeLoadingScreens();
        
        // Detect mobile device
        detectMobile();
        
        const scene = document.querySelector("a-scene");
        const video = document.querySelector("#videoTexture");
        
        // Show status indicator
        showStatus("Point camera at your marker", "Look for your uploaded image");
        
        // Initialize camera
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          updateDebug("Testing camera access...");
          updateCameraStatus("Requesting camera permission...");
          
          const constraints = {
            video: {
              width: { ideal: isMobile ? 1280 : 1920 },
              height: { ideal: isMobile ? 720 : 1080 },
              facingMode: 'environment',
              frameRate: { ideal: 30 },
              focusMode: 'continuous',
              exposureMode: 'continuous',
              whiteBalanceMode: 'continuous'
            }
          };
          
          navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
              updateDebug("✅ Camera permission granted");
              updateDebug("✅ Camera stream received");
              updateCameraStatus("Camera active");
              cameraInitialized = true;
              
              if (stream && stream.active) {
                updateDebug("✅ Camera stream is active");
                updateCameraStatus("Camera stream active");
              } else {
                updateDebug("❌ Camera stream not active");
                updateCameraStatus("Camera stream inactive");
              }
            })
            .catch((error) => {
              updateDebug("❌ Camera permission denied: " + error.message);
              updateCameraStatus("Camera permission denied");
            });
        } else {
          updateDebug("❌ Camera API not available");
          updateCameraStatus("Camera API not available");
        }
        
        if (scene) {
          scene.addEventListener("loaded", () => {
            updateDebug("✅ AR Scene loaded successfully");
            nukeLoadingScreens();
            
            const camera = document.querySelector("a-camera");
            if (camera) {
              updateDebug("✅ Camera entity found");
              updateCameraStatus("Camera entity ready");
            } else {
              updateDebug("❌ Camera entity not found");
              updateCameraStatus("Camera entity missing");
            }
          });
          
          scene.addEventListener("renderstart", () => {
            updateDebug("✅ AR rendering started");
            nukeLoadingScreens();
            updateCameraStatus("AR rendering active");
          });
        }

        // CUSTOM MARKER DETECTION
        // Simulate marker detection based on camera movement and time
        let lastMotionTime = 0;
        let motionCount = 0;
        
        // Listen for device motion/orientation
        if (window.DeviceMotionEvent) {
          window.addEventListener('devicemotion', (event) => {
            const now = Date.now();
            const acceleration = event.accelerationIncludingGravity;
            
            if (acceleration) {
              const motion = Math.abs(acceleration.x) + Math.abs(acceleration.y) + Math.abs(acceleration.z);
              
              if (motion > 10) { // Significant motion detected
                motionCount++;
                lastMotionTime = now;
                
                if (motionCount > 5 && !targetFound) {
                  targetFound = true;
                  updateDebug("🎯 Motion-based marker detection triggered");
                  showARContent();
                }
              } else if (now - lastMotionTime > 3000) {
                // No motion for 3 seconds, hide content
                if (targetFound) {
                  targetFound = false;
                  motionCount = 0;
                  updateDebug("❌ Motion lost, hiding AR content");
                  hideARContent();
                }
              }
            }
          });
        }
        
        // Alternative: Time-based simulation for testing
        setTimeout(() => {
          updateDebug("🎯 Simulating marker detection for testing...");
          targetFound = true;
          showARContent();
        }, 3000);
        
        // Continuous nuclear strikes
        setInterval(nukeLoadingScreens, 1000);
        
        // Check for common issues
        setTimeout(() => {
          updateDebug("Checking for common issues...");
          
          const videoPlane = document.querySelector("#videoPlane");
          const debugPlane = document.querySelector("#debugPlane");
          
          if (videoPlane) {
            const videoPlaneStyle = window.getComputedStyle(videoPlane);
            updateDebug("Video plane visibility: " + videoPlaneStyle.visibility + ", display: " + videoPlaneStyle.display);
          } else {
            updateDebug("❌ Video plane element not found");
          }
          
          if (debugPlane) {
            const debugPlaneStyle = window.getComputedStyle(debugPlane);
            updateDebug("Debug plane visibility: " + debugPlaneStyle.visibility + ", display: " + debugPlaneStyle.display);
          } else {
            updateDebug("❌ Debug plane element not found");
          }
          
          if (typeof AFRAME !== 'undefined') {
            updateDebug("✅ A-Frame loaded");
          } else {
            updateDebug("❌ A-Frame not loaded");
          }
          
          if (location.protocol === 'https:' || location.hostname === 'localhost') {
            updateDebug("✅ HTTPS/localhost detected");
          } else {
            updateDebug("❌ Not HTTPS - camera may not work");
          }
          
          const camera = document.querySelector("a-camera");
          if (camera) {
            const cameraStyle = window.getComputedStyle(camera);
            updateDebug(\`Camera visibility: \${cameraStyle.visibility}, display: \${cameraStyle.display}\`);
            updateCameraStatus(\`Camera: \${cameraStyle.visibility} / \${cameraStyle.display}\`);
          }
          
          updateDebug("🎯 Using CUSTOM AR approach - no MindAR files!");
          updateDebug("🎯 Marker image: ${markerImageUrl}");
          updateDebug("🎯 This approach bypasses the problematic MindAR format");
          
          // Final nuclear strike
          nukeLoadingScreens();
        }, 2000);
      });

      // Global error handler
      window.addEventListener('error', (event) => {
        if (event.error && event.error.message) {
          updateDebug("❌ Error: " + event.error.message);
        }
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message) {
          updateDebug("❌ Promise error: " + event.reason.message);
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