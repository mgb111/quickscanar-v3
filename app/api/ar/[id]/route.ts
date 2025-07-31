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

    // Use custom .mind file if available, otherwise fallback to card.mind
    const mindFileUrl = experience.mind_file_url || 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
    const markerImageUrl = experience.marker_image_url
    const usingCustomMind = !!experience.mind_file_url
    
    // Check if marker image is the placeholder (no custom marker uploaded)
    const isPlaceholderMarker = markerImageUrl && markerImageUrl.includes('card-example/card.png')

    // Simple, clean AR HTML - no loading screen removal
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
      
      /* Force hide ALL possible loading screens */
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
    <div class="debug-panel" id="debug-panel">
      <strong>AR Status:</strong><br>
      <div id="debug-content"></div>
    </div>

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
        ${!isPlaceholderMarker ? `<img id="marker" src="${markerImageUrl}" crossorigin="anonymous" />` : ''}
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

        <!-- Background plane (black) -->
        <a-plane
          id="backgroundPlane"
          width="1"
          height="1"
          position="0 0 0.005"
          rotation="0 0 ${(experience.video_rotation || 0) * Math.PI / 180}"
          material="color: #000000"
          visible="false"
        ></a-plane>

        <!-- Video plane (visible when target found) -->
        <a-plane
          id="videoPlane"
          width="1"
          height="1"
          position="0 0 0.01"
          rotation="0 0 ${(experience.video_rotation || 0) * Math.PI / 180}"
          material="shader: flat; src: #videoTexture; transparent: true"
          visible="false"
        ></a-plane>

        <!-- Debug plane to show marker detection (only if real marker image exists) -->
        ${!isPlaceholderMarker ? `
        <a-plane
          id="debugPlane"
          src="#marker"
          position="0 0 0.02"
          height="1"
          width="1"
          rotation="0 0 0"
          material="transparent: true; opacity: 0.0"
          visible="false"
        ></a-plane>
        ` : ''}
      </a-entity>
    </a-scene>
    
    <script>
      let isMobile = false;
      let targetFound = false;
      let mindarError = false;
      let fallbackUsed = false;

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

      function nukeLoadingScreens() {
        // Nuclear option - remove ALL possible loading elements
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

      function switchToFallback() {
        if (fallbackUsed) return; // Prevent infinite loops
        
        fallbackUsed = true;
        updateDebug("🔄 Switching to fallback MindAR file due to format error");
        
        const scene = document.getElementById('arScene');
        const fallbackMindFile = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';
        
        // Update the scene with fallback MindAR file
        scene.setAttribute('mindar-image', \`imageTargetSrc: \${fallbackMindFile};\`);
        
        updateDebug("✅ Switched to fallback MindAR file");
        updateDebug("Note: Using fallback MindAR file but your marker image is still displayed");
      }

      // Run immediately
      nukeLoadingScreens();

      document.addEventListener("DOMContentLoaded", () => {
        updateDebug("AR Experience loaded");
        
        // Nuclear loading screen removal
        nukeLoadingScreens();
        
        // Detect mobile device
        detectMobile();
        
        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        const videoPlane = document.querySelector("#videoPlane");
        const backgroundPlane = document.querySelector("#backgroundPlane");
        const debugPlane = document.querySelector("#debugPlane");
        const scene = document.querySelector("a-scene");
        
        // Calculate video dimensions and set video plane size to match original aspect ratio
        if (video && videoPlane) {
          video.addEventListener('loadedmetadata', () => {
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            
            if (videoWidth && videoHeight) {
              // Calculate aspect ratio
              const aspectRatio = videoWidth / videoHeight;
              
              // Set video plane dimensions to match video's original aspect ratio
              // Use a base width of 1 and calculate height accordingly
              const planeWidth = 1;
              const planeHeight = 1 / aspectRatio;
              
              videoPlane.setAttribute('width', planeWidth);
              videoPlane.setAttribute('height', planeHeight);
              
              // Also update background and debug planes to match video dimensions
              if (backgroundPlane) {
                backgroundPlane.setAttribute('width', planeWidth);
                backgroundPlane.setAttribute('height', planeHeight);
              }
              
              if (debugPlane) {
                debugPlane.setAttribute('width', planeWidth);
                debugPlane.setAttribute('height', planeHeight);
              }
              
              updateDebug(\`📐 Video dimensions: \${videoWidth}x\${videoHeight}\`);
              updateDebug(\`📐 Video plane dimensions: \${planeWidth}x\${planeHeight.toFixed(3)} (preserves original ratio)\`);
              updateDebug(\`📐 Aspect ratio: \${aspectRatio.toFixed(3)} (original video ratio)\`);
            }
          });
        }
        
        // Show status indicator
        showStatus("Point camera at your marker", isPlaceholderMarker ? "Look for your target" : "Look for your uploaded image");
        
        // Explicitly test camera access first
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
            .then((stream) => {
              updateDebug("✅ Camera permission granted");
              updateDebug("✅ Camera stream received");
              
              // Ensure the camera is working by checking the stream
              if (stream && stream.active) {
                updateDebug("✅ Camera stream is active");
              } else {
                updateDebug("❌ Camera stream not active");
              }
            })
            .catch((error) => {
              updateDebug("❌ Camera permission denied: " + error.message);
            });
        }
        
        if (scene) {
          scene.addEventListener("loaded", () => {
            updateDebug("✅ AR Scene loaded successfully");
            nukeLoadingScreens(); // Remove any loading screens that appeared
            
            // Check if camera entity exists and is working
            const camera = document.querySelector("a-camera");
            if (camera) {
              updateDebug("✅ Camera entity found");
            } else {
              updateDebug("❌ Camera entity not found");
            }
          });
          
          scene.addEventListener("renderstart", () => {
            updateDebug("✅ AR rendering started");
            nukeLoadingScreens(); // Remove any loading screens that appeared
          });

          scene.addEventListener("error", (error) => {
            updateDebug("❌ AR Scene error: " + error);
            mindarError = true;
          });
        }
        
        if (target) {
          target.addEventListener("targetFound", () => {
            updateDebug("🎯 Target found - showing AR content");
            targetFound = true;
            
            // Show background plane
            if (backgroundPlane) {
              backgroundPlane.setAttribute('visible', 'true');
              updateDebug("✅ Background plane made visible");
            }
            
            // Show video plane
            if (videoPlane) {
              videoPlane.setAttribute('visible', 'true');
              updateDebug("✅ Video plane made visible");
            }
            
            // Show debug plane briefly for debugging, then hide it
            if (debugPlane) {
              debugPlane.setAttribute('visible', 'true');
              updateDebug("✅ Debug plane made visible");
              
              // Hide debug plane after 2 seconds to avoid background interference
              setTimeout(() => {
                if (debugPlane) {
                  debugPlane.setAttribute('visible', 'false');
                  updateDebug("✅ Debug plane hidden to avoid background");
                }
              }, 2000);
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
            
            // Hide background plane
            if (backgroundPlane) {
              backgroundPlane.setAttribute('visible', 'false');
            }
            
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
            showStatus("Target Lost", isPlaceholderMarker ? "Point camera at your target again" : "Point camera at your marker again");
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
          
          // Check if camera is visible
          const camera = document.querySelector("a-camera");
          if (camera) {
            const cameraStyle = window.getComputedStyle(camera);
            updateDebug(\`Camera visibility: \${cameraStyle.visibility}, display: \${cameraStyle.display}\`);
          }
          
          // Check MindAR file URL
          updateDebug(\`MindAR file: \${usingCustomMind ? 'Custom .mind file' : 'Fallback card.mind file'}\`);
          updateDebug(\`Marker image: \${markerImageUrl}\`);
          
          // Check MindAR file status
          if (usingCustomMind) {
            updateDebug("✅ Using custom .mind file for your marker");
          } else {
            updateDebug("✅ Using fallback card.mind file (guaranteed to work)");
          }
          
          // Check marker image status
          if (isPlaceholderMarker) {
            updateDebug("ℹ️ No custom marker image - using .mind file for tracking only");
          } else {
            updateDebug("✅ Custom marker image available for visual reference");
          }

          // Final nuclear strike
          nukeLoadingScreens();
        }, 2000);
        
        // Continuous nuclear strikes
        setInterval(nukeLoadingScreens, 1000);
      });

      // Global error handler for MindAR errors
      window.addEventListener('error', (event) => {
        if (event.error && event.error.message && event.error.message.includes('RangeError')) {
          updateDebug("❌ MindAR RangeError detected - switching to fallback");
          mindarError = true;
          switchToFallback();
        }
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && event.reason.message.includes('RangeError')) {
          updateDebug("❌ MindAR RangeError in promise - switching to fallback");
          mindarError = true;
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