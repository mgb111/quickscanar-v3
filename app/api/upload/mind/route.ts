import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.mind')) {
      return NextResponse.json({ error: 'Invalid file type. Must be a .mind file.' }, { status: 400 })
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate file size
    if (buffer.length < 1000) {
      return NextResponse.json({ error: 'Invalid .mind file. File is too small.' }, { status: 400 })
    }

    // Upload to Supabase
    const fileName = `mind-${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mind-files')
      .upload(fileName, buffer, {
        contentType: 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload .mind file: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('mind-files')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    })

  } catch (error) {
    console.error('.mind file upload error:', error)
    return NextResponse.json(
      { error: `.mind file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}