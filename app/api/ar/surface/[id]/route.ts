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

    const is3D = (experience.content_type === '3d' || experience.content_type === 'both') && !!experience.model_url

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>${experience.title} - Surface AR</title>
  <script type="module" src="https://unpkg.com/@google/model-viewer@3.3.0/dist/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: linear-gradient(180deg, #0f0f23 0%, #1a1a2e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    model-viewer {
      width: 100%;
      height: 70vh;
      background-color: transparent;
      --poster-color: transparent;
    }
    
    .controls {
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 100;
      flex-wrap: wrap;
    }
    
    .btn {
      background: #111827;
      color: #fff;
      border: 2px solid #000;
      border-radius: 12px;
      padding: 12px 18px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .btn:active {
      transform: scale(0.95);
    }
    
    .btn-primary {
      background: #dc2626;
      flex: 1;
      min-width: 150px;
    }
    
    .info {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      color: #fff;
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      font-size: 14px;
      line-height: 1.5;
      z-index: 100;
    }
    
    .info strong {
      display: block;
      margin-bottom: 4px;
      color: #4ade80;
    }
    
    @media (max-width: 480px) {
      .controls { top: 12px; left: 12px; right: 12px; gap: 8px; }
      .btn { padding: 10px 14px; font-size: 13px; }
      .info { bottom: 12px; left: 12px; right: 12px; padding: 12px; font-size: 13px; }
    }
  </style>
</head>
<body>
  <div id="container">
    <div class="controls">
      <button class="btn" onclick="window.location.href='/api/ar/${experience.id}'">← Use Marker</button>
      <button class="btn btn-primary" id="arBtn">View in AR</button>
    </div>
    
    ${is3D ? `
    <model-viewer
      id="modelViewer"
      src="${experience.model_url}"
      ar
      ar-modes="scene-viewer webxr quick-look"
      camera-controls
      touch-action="pan-y"
      shadow-intensity="1"
      auto-rotate
      rotation-per-second="30deg"
      scale="${experience.model_scale || 1} ${experience.model_scale || 1} ${experience.model_scale || 1}"
    >
      <button slot="ar-button" style="display: none;"></button>
    </model-viewer>
    ` : '<div style="color: #fff; text-align: center;">No 3D model available</div>'}
    
    <div class="info">
      <strong>Surface Placement AR</strong>
      Tap "View in AR" to place this 3D model on any surface using your device camera.
    </div>
  </div>

  <script>
    const arBtn = document.getElementById('arBtn');
    const modelViewer = document.getElementById('modelViewer');
    
    if (arBtn && modelViewer) {
      arBtn.addEventListener('click', () => {
        modelViewer.activateAR();
      });
    }
  </script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Permissions-Policy': "camera=(self), xr-spatial-tracking=(self)"
      },
    })
  } catch (error) {
    console.error('Error serving Surface AR experience:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
