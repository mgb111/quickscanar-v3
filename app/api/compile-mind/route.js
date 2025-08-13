import { NextResponse } from 'next/server'
import { mindarService } from '@/lib/mindar-service'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request) {
  try {
    const form = await request.formData()
    const image = form.get('image')
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 })

    const buf = Buffer.from(await image.arrayBuffer())
    // Start async job but return immediately so client can poll
    const job = await mindarService.compileImageToMind(buf, image.name)
    return NextResponse.json({ success: true, jobId: job.jobId, downloadUrl: job.downloadUrl })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
