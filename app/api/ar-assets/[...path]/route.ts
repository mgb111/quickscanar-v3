// Updated API Route Fix:

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params
    
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    // Join the path to get the filename
    const filename = path.join('/')
    
    console.log('🔍 Path received:', path)
    console.log('🔍 Filename:', filename)
    
    // Get R2 configuration from environment variables
    const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
    const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'quickscanar'
    
    if (!R2_ACCOUNT_ID) {
      console.error('❌ Missing CLOUDFLARE_ACCOUNT_ID environment variable')
      return NextResponse.json({ error: 'R2 configuration missing' }, { status: 500 })
    }
    
    // Construct the full R2 URL from the filename
    // Correct format: https://{ACCOUNT_ID}.r2.cloudflarestorage.com/{BUCKET_NAME}/{FILENAME}
    const r2Url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`
    
    console.log('🔍 Full R2 URL:', r2Url)

    // Fetch the file from R2
    const response = await fetch(r2Url)
    
    if (!response.ok) {
      console.error('❌ R2 fetch failed:', response.status, response.statusText)
      return NextResponse.json({ 
        error: 'File not found on R2',
        status: response.status 
      }, { status: response.status })
    }

    // Get the file content
    const data = await response.arrayBuffer()
    
    // Determine content type based on file extension
    const fileExtension = filename.split('.').pop()?.toLowerCase()
    let contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    // Set appropriate content types for common AR file types
    if (fileExtension === 'mind') {
      contentType = 'application/octet-stream'
    } else if (fileExtension === 'mp4') {
      contentType = 'video/mp4'
    } else if (fileExtension === 'webm') {
      contentType = 'video/webm'
    } else if (fileExtension === 'mov') {
      contentType = 'video/quicktime'
    }

    console.log('✅ Successfully proxied file:', {
      filename,
      size: data.byteLength,
      contentType
    })

    // Return with proper CORS headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': data.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('❌ Proxy error:', error)
    return NextResponse.json(
      { error: `Proxy failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params
    
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    const filename = path.join('/')
    
    // Get R2 configuration
    const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
    const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'quickscanar'
    
    if (!R2_ACCOUNT_ID) {
      return NextResponse.json({ error: 'R2 configuration missing' }, { status: 500 })
    }
    
    // ✅ FIXED: Construct the R2 URL using the correct format
    const r2Url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${filename}`
    
    // Fetch headers only from R2
    const response = await fetch(r2Url, { method: 'HEAD' })
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'File not found on R2',
        status: response.status 
      }, { status: response.status })
    }

    // Return headers with CORS
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Content-Length': response.headers.get('content-length') || '0',
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Last-Modified': response.headers.get('last-modified') || new Date().toUTCString(),
      },
    })

  } catch (error) {
    console.error('❌ HEAD proxy error:', error)
    return NextResponse.json(
      { error: `HEAD proxy failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  })
}