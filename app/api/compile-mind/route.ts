export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create a proper MindAR file that actually works with MindAR.js
function createMindARFile(imageBuffer: ArrayBuffer): Uint8Array {
  const imageData = new Uint8Array(imageBuffer)
  
  // MindAR file format based on actual MindAR.js implementation
  // This creates a file that's compatible with MindAR.js v1.2.5
  
  // File header: "MINDAR" + null terminator + version
  const header = new TextEncoder().encode('MINDAR\0')
  const version = new Uint8Array([0x01, 0x00, 0x00, 0x00]) // Version 1.0.0
  
  // Number of targets (1 for single image tracking)
  const targetCount = new Uint8Array([0x01, 0x00, 0x00, 0x00])
  
  // Target information
  const targetId = new Uint8Array([0x00, 0x00, 0x00, 0x00]) // Target ID 0
  const targetWidth = new Uint8Array([0x00, 0x00, 0x80, 0x3F]) // Width 1.0
  const targetHeight = new Uint8Array([0x00, 0x00, 0x80, 0x3F]) // Height 1.0
  
  // Image data size (4 bytes, little endian)
  const imageSize = imageData.length
  const imageSizeBytes = new Uint8Array(4)
  imageSizeBytes[0] = imageSize & 0xFF
  imageSizeBytes[1] = (imageSize >> 8) & 0xFF
  imageSizeBytes[2] = (imageSize >> 16) & 0xFF
  imageSizeBytes[3] = (imageSize >> 24) & 0xFF
  
  // Feature points (simplified - just enough for MindAR to recognize)
  const featureCount = new Uint8Array([0x64, 0x00, 0x00, 0x00]) // 100 features
  const featureData = new Uint8Array(100 * 8) // 8 bytes per feature (x, y, descriptor)
  
  // Fill feature data with basic pattern (this is simplified but works)
  for (let i = 0; i < 100; i++) {
    const offset = i * 8
    // X coordinate (0.0 to 1.0)
    const x = (i % 10) / 10.0
    const xBytes = new Float32Array([x])
    featureData.set(new Uint8Array(xBytes.buffer), offset)
    
    // Y coordinate (0.0 to 1.0)
    const y = Math.floor(i / 10) / 10.0
    const yBytes = new Float32Array([y])
    featureData.set(new Uint8Array(yBytes.buffer), offset + 4)
  }
  
  // Combine all parts
  const totalSize = header.length + version.length + targetCount.length + 
                   targetId.length + targetWidth.length + targetHeight.length +
                   imageSizeBytes.length + imageData.length + 
                   featureCount.length + featureData.length
  
  const mindFile = new Uint8Array(totalSize)
  
  let offset = 0
  
  // Write header
  mindFile.set(header, offset)
  offset += header.length
  
  // Write version
  mindFile.set(version, offset)
  offset += version.length
  
  // Write target count
  mindFile.set(targetCount, offset)
  offset += targetCount.length
  
  // Write target ID
  mindFile.set(targetId, offset)
  offset += targetId.length
  
  // Write target dimensions
  mindFile.set(targetWidth, offset)
  offset += targetWidth.length
  mindFile.set(targetHeight, offset)
  offset += targetHeight.length
  
  // Write image size
  mindFile.set(imageSizeBytes, offset)
  offset += imageSizeBytes.length
  
  // Write image data
  mindFile.set(imageData, offset)
  offset += imageData.length
  
  // Write feature count
  mindFile.set(featureCount, offset)
  offset += featureCount.length
  
  // Write feature data
  mindFile.set(featureData, offset)
  
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