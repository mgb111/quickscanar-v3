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

    // Create the AR HTML
    const arHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${experience.title} - AR Experience</title>
    <script src="https://aframe.io/releases/1.5.0/aframe.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
  </head>
  <body>
    <a-scene
      mindar-image="imageTargetSrc: ${experience.mind_file_url};"
      color-space="sRGB"
      renderer="colorManagement: true, physicallyCorrectLights"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      embedded
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
        const video = document.querySelector("#videoTexture");
        const target = document.querySelector("#target");
        
        if (target) {
          target.addEventListener("targetFound", () => {
            if (video) video.play();
          });
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