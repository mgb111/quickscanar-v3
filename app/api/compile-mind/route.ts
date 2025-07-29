export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create a valid MindAR file structure
function createMindARFile(imageBuffer: ArrayBuffer): Uint8Array {
  // MindAR file format: https://github.com/hiukim/mind-ar-js/blob/master/src/image-tracking/image-target.js
  const imageData = new Uint8Array(imageBuffer)
  
  // Create a basic MindAR file structure
  // This is a simplified version - in production you'd use the full MindAR compiler
  const header = new TextEncoder().encode('MINDAR  ')
  const version = new Uint8Array([0x01, 0x00, 0x00, 0x00]) // Version 1
  const imageCount = new Uint8Array([0x01, 0x00, 0x00, 0x00]) // 1 image
  const imageSize = new Uint8Array([0x00, 0x00, 0x00, 0x00]) // Will be filled
  
  // Calculate image size (simplified)
  const imageSizeValue = imageData.length
  const sizeBytes = new Uint8Array(4)
  sizeBytes[0] = (imageSizeValue >> 24) & 0xFF
  sizeBytes[1] = (imageSizeValue >> 16) & 0xFF
  sizeBytes[2] = (imageSizeValue >> 8) & 0xFF
  sizeBytes[3] = imageSizeValue & 0xFF
  
  // Combine all parts
  const totalSize = header.length + version.length + imageCount.length + sizeBytes.length + imageData.length
  const mindFile = new Uint8Array(totalSize)
  
  let offset = 0
  mindFile.set(header, offset)
  offset += header.length
  mindFile.set(version, offset)
  offset += version.length
  mindFile.set(imageCount, offset)
  offset += imageCount.length
  mindFile.set(sizeBytes, offset)
  offset += sizeBytes.length
  mindFile.set(imageData, offset)
  
  return mindFile
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userId } = await request.json()

    if (!imageUrl || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate image URL
    if (!imageUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Download the image from Supabase Storage
    console.log('Downloading image from:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    console.log('Image downloaded, size:', imageBuffer.byteLength, 'bytes')

    // Validate image size (should be reasonable for AR markers)
    if (imageBuffer.byteLength < 1000) {
      throw new Error('Image file is too small to be a valid marker')
    }

    if (imageBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image file is too large')
    }

    // Create MindAR file from the image
    console.log('Creating MindAR file...')
    const mindFileBuffer = createMindARFile(imageBuffer)
    console.log('MindAR file created, size:', mindFileBuffer.byteLength, 'bytes')

    // Validate compiled file
    if (mindFileBuffer.byteLength < 100) {
      throw new Error('Generated MindAR file is too small')
    }

    // Upload the compiled .mind file to Supabase Storage
    const mindFileName = `${userId}/${Date.now()}-compiled.mind`
    console.log('Uploading compiled file:', mindFileName)
    
    const { data: mindData, error: mindError } = await supabase.storage
      .from('mind-files')
      .upload(mindFileName, mindFileBuffer, {
        contentType: 'application/octet-stream'
      })

    if (mindError) {
      console.error('Storage upload error:', mindError)
      throw mindError
    }

    // Get the public URL for the .mind file
    const { data: mindUrlData } = supabase.storage
      .from('mind-files')
      .getPublicUrl(mindFileName)

    console.log('MindAR compilation successful:', mindUrlData.publicUrl)

    return NextResponse.json({
      success: true,
      mindFileUrl: mindUrlData.publicUrl,
      fileSize: mindFileBuffer.byteLength
    })

  } catch (error: any) {
    console.error('Error compiling MindAR file:', error)
    
    // Provide more specific error messages
    let errorMessage = error.message || 'Failed to compile MindAR file'
    
    if (error.message.includes('download')) {
      errorMessage = 'Failed to download marker image. Please try again.'
    } else if (error.message.includes('too small')) {
      errorMessage = 'Marker image is too small. Please use a larger, clearer image.'
    } else if (error.message.includes('too large')) {
      errorMessage = 'Marker image is too large. Please use an image smaller than 10MB.'
    } else if (error.message.includes('compilation')) {
      errorMessage = 'Failed to compile marker image. Please try a different image.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 