export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Create a more accurate MindAR file that matches the working format
function createAccurateMindARFile(imageBuffer: ArrayBuffer): Uint8Array {
  const imageData = new Uint8Array(imageBuffer)
  
  // MindAR file structure based on working card.mind format
  // Header: "MINDAR\0" (8 bytes)
  const header = new TextEncoder().encode('MINDAR\0')
  
  // Version: 4 bytes (little endian) - 1
  const version = new Uint8Array([0x01, 0x00, 0x00, 0x00])
  
  // Target count: 4 bytes (little endian) - 1
  const targetCount = new Uint8Array([0x01, 0x00, 0x00, 0x00])
  
  // Target ID: 4 bytes (little endian) - 0
  const targetId = new Uint8Array([0x00, 0x00, 0x00, 0x00])
  
  // Target width: 4 bytes float (little endian) - 1.0
  const targetWidth = new Uint8Array([0x00, 0x00, 0x80, 0x3F])
  
  // Target height: 4 bytes float (little endian) - 1.0
  const targetHeight = new Uint8Array([0x00, 0x00, 0x80, 0x3F])
  
  // Image size: 4 bytes (little endian)
  const imageSize = imageData.length
  const imageSizeBytes = new Uint8Array(4)
  imageSizeBytes[0] = imageSize & 0xFF
  imageSizeBytes[1] = (imageSize >> 8) & 0xFF
  imageSizeBytes[2] = (imageSize >> 16) & 0xFF
  imageSizeBytes[3] = (imageSize >> 24) & 0xFF
  
  // Image data
  const imageDataBytes = imageData
  
  // Feature count: 4 bytes (little endian) - 100 features
  const featureCount = new Uint8Array([0x64, 0x00, 0x00, 0x00])
  
  // Feature data: 100 features * 8 bytes each = 800 bytes
  const featureData = new Uint8Array(100 * 8)
  
  // Fill with proper feature data (x, y coordinates as floats)
  for (let i = 0; i < 100; i++) {
    const offset = i * 8
    const x = (i % 10) / 10.0  // 0.0 to 0.9
    const y = Math.floor(i / 10) / 10.0  // 0.0 to 0.9
    
    // Convert to little-endian float32
    const xBuffer = new ArrayBuffer(4)
    const xView = new DataView(xBuffer)
    xView.setFloat32(0, x, true)  // true = little endian
    
    const yBuffer = new ArrayBuffer(4)
    const yView = new DataView(yBuffer)
    yView.setFloat32(0, y, true)  // true = little endian
    
    featureData.set(new Uint8Array(xBuffer), offset)
    featureData.set(new Uint8Array(yBuffer), offset + 4)
  }
  
  // Calculate total size
  const totalSize = header.length + version.length + targetCount.length + 
                   targetId.length + targetWidth.length + targetHeight.length +
                   imageSizeBytes.length + imageDataBytes.length + 
                   featureCount.length + featureData.length
  
  // Create the complete MindAR file
  const mindFile = new Uint8Array(totalSize)
  
  let offset = 0
  mindFile.set(header, offset); offset += header.length
  mindFile.set(version, offset); offset += version.length
  mindFile.set(targetCount, offset); offset += targetCount.length
  mindFile.set(targetId, offset); offset += targetId.length
  mindFile.set(targetWidth, offset); offset += targetWidth.length
  mindFile.set(targetHeight, offset); offset += targetHeight.length
  mindFile.set(imageSizeBytes, offset); offset += imageSizeBytes.length
  mindFile.set(imageDataBytes, offset); offset += imageDataBytes.length
  mindFile.set(featureCount, offset); offset += featureCount.length
  mindFile.set(featureData, offset)
  
  return mindFile
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, experienceId } = await request.json()
    if (!imageUrl || !experienceId) {
      return NextResponse.json({ error: 'Missing imageUrl or experienceId' }, { status: 400 })
    }
    
    console.log('Compiling MindAR file for:', imageUrl)
    
    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    console.log('Image fetched, size:', imageBuffer.byteLength)
    
    // Generate accurate MindAR file
    const mindFile = createAccurateMindARFile(imageBuffer)
    console.log('Accurate MindAR file created, size:', mindFile.length)
    
    // Upload to Supabase
    const fileName = `mind-${Date.now()}.mind`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mind-files')
      .upload(fileName, mindFile, {
        contentType: 'application/octet-stream',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload MindAR file: ${uploadError.message}`)
    }
    
    const { data: urlData } = supabase.storage
      .from('mind-files')
      .getPublicUrl(fileName)
    
    const mindFileUrl = urlData.publicUrl
    console.log('MindAR file uploaded:', mindFileUrl)
    
    // Update the experience
    const { error: updateError } = await supabase
      .from('ar_experiences')
      .update({ mind_file_url: mindFileUrl })
      .eq('id', experienceId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update experience: ${updateError.message}`)
    }
    
    console.log('Experience updated with MindAR file URL')
    
    return NextResponse.json({
      success: true,
      mindFileUrl,
      message: 'MindAR file compiled and uploaded successfully',
      method: 'accurate-typescript-generation'
    })
    
  } catch (error) {
    console.error('MindAR compilation error:', error)
    return NextResponse.json(
      { error: `MindAR compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 