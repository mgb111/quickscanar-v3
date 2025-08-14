import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = (formData.get('path') as string) || `mind-${Date.now()}-${file?.name || 'file.mind'}`
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!path.endsWith('.mind') && file.name && !file.name.endsWith('.mind')) {
      return NextResponse.json({ error: 'Invalid file type. Must be a .mind file.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length < 1000) {
      return NextResponse.json({ error: 'Invalid .mind file. File is too small.' }, { status: 400 })
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mind-files')
      .upload(path, buffer, {
        contentType: 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload .mind file: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('mind-files')
      .getPublicUrl(path)

    return NextResponse.json({ success: true, url: urlData.publicUrl, path })
  } catch (error: any) {
    console.error('.mind file upload error:', error)
    return NextResponse.json(
      { error: `.mind file upload failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}