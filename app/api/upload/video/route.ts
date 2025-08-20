import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force Next.js to handle larger request bodies for this route
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout
export const runtime = 'nodejs'

// Use service role key if available for server-side uploads; fallback to anon for local/demo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
)

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎬 Video upload request received')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('📁 Video file details:', {
      name: file.name,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
      type: file.type
    })

    // Check file size (limit from environment or default to 100MB)
    const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '100')
    const maxSizeInBytes = maxSizeMB * 1024 * 1024
    
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ 
        error: `Video file too large. Maximum size is ${maxSizeMB}MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB` 
      }, { status: 413 })
    }

    // Validate video file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Unsupported video format. Please use MP4, WebM, or MOV files. Current type: ${file.type}` 
      }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const fileName = `video-${Date.now()}-${file.name}`
    console.log('📤 Uploading video file to Supabase storage...')

    // Upload to Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Video upload error:', uploadError)
      throw new Error(`Failed to upload video: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    console.log('✅ Video file uploaded successfully:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error: any) {
    console.error('❌ Video upload error:', error)
    return NextResponse.json(
      { error: `Video upload failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}