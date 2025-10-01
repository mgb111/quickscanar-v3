import { NextRequest, NextResponse } from 'next/server'

// Very small proxy to work around CORS on third-party assets (e.g., .mind, video)
// Usage: /api/proxy?url=https%3A%2F%2Fexample.com%2Ffile.mind
// Note: In production, restrict allowed hosts as needed.

const ALLOWED_HOSTS = new Set([
  'pub-cf0963a3225741748e1469cc318f690d.r2.dev',
])

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const target = searchParams.get('url')
    if (!target) {
      return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
    }

    const u = new URL(target)
    if (!ALLOWED_HOSTS.has(u.host)) {
      return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
    }

    // Forward Range header for video streaming support
    const range = req.headers.get('range') || undefined

    const upstream = await fetch(u.toString(), {
      method: 'GET',
      headers: range ? { Range: range } : undefined,
      // No-cors is NOT used here; server can fetch directly
      // Important to pass through response body as-is (streaming)
    })

    // Build response
    const resHeaders = new Headers()

    // Pass through content headers from upstream when possible
    const copyHeaders = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'last-modified',
      'etag',
      'cache-control',
    ]
    copyHeaders.forEach((h) => {
      const v = upstream.headers.get(h)
      if (v) resHeaders.set(h, v)
    })

    // CORS headers for browser
    resHeaders.set('Access-Control-Allow-Origin', '*')
    resHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    resHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type')
    resHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type, ETag, Last-Modified')

    // Stream body with proper status (200 or 206 for partial content)
    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: resHeaders,
    })
  } catch (err: any) {
    console.error('Proxy error:', err)
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 502 })
  }
}

export async function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Type')
  return new NextResponse(null, { status: 204, headers })
}
