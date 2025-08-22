import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force Next.js to handle larger request bodies for this route
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout
export const runtime = 'nodejs'

// Use service role key for server-side uploads to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Supabase environment variables are required for server-side uploads')
}

const supabase = createClient(supabaseUrl!, serviceKey!, {
  auth: { persistSession: false }
})

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
    // Check if Supabase is configured
    if (!supabaseUrl || !serviceKey) {
      console.error('Supabase not configured for marker image uploads')
      return NextResponse.json(
        { error: 'Upload service not configured' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = (formData.get('path') as string) || `marker-${Date.now()}-${file?.name || 'image.jpg'}`
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Must be a JPEG, PNG, or WebP image.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB for marker images)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to markers bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('markers')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload marker image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('markers')
      .getPublicUrl(path)

    console.log('✅ Marker image uploaded successfully:', {
      path,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl
    })

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl, 
      path 
    })
  } catch (error: any) {
    console.error('Marker image upload error:', error)
    return NextResponse.json(
      { error: `Marker image upload failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}
