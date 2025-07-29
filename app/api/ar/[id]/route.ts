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

    // For debugging, let's use a known working MindAR file first
    const mindFileUrl = experience.mind_file_url.includes('compiled') 
      ? 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
      : experience.mind_file_url

    // Create the AR HTML with full-screen camera and better compatibility
    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <title>${experience.title} - AR Experience</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background: #000;
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
      }
    </style>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
  </head>
  <body>
    <div class="loading" id="loading">
      <h2>Loading AR Experience...</h2>
      <p>Please wait while we initialize the camera</p>
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
        <img id="marker" src="${experience.marker_image_url}" />
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
      document.addEventListener("DOMContentLoaded", () => {
        console.log("AR Experience loaded");
        
        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        const scene = document.querySelector("a-scene");
        const loading = document.querySelector("#loading");
        
        if (scene) {
          scene.addEventListener("loaded", () => {
            console.log("AR Scene loaded successfully");
            if (loading) loading.style.display = "none";
          });
          
          scene.addEventListener("renderstart", () => {
            console.log("AR rendering started");
            if (loading) loading.style.display = "none";
          });

          scene.addEventListener("error", (error) => {
            console.error("AR Scene error:", error);
            if (loading) {
              loading.innerHTML = "<h2>Error Loading AR</h2><p>Please refresh the page</p>";
            }
          });
        }
        
        if (target) {
          target.addEventListener("targetFound", () => {
            console.log("Target found - playing video");
            if (video) {
              video.play().catch(e => console.log("Video play error:", e));
            }
          });
          
          target.addEventListener("targetLost", () => {
            console.log("Target lost");
          });
        }
        
        // Request camera permissions explicitly
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => {
              console.log("Camera permission granted");
            })
            .catch((error) => {
              console.error("Camera permission denied:", error);
              if (loading) {
                loading.innerHTML = "<h2>Camera Permission Required</h2><p>Please allow camera access and refresh</p>";
              }
            });
        }

        // Hide loading after 10 seconds as fallback
        setTimeout(() => {
          if (loading) loading.style.display = "none";
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