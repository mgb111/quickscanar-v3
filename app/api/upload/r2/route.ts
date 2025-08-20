import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'quickscanar'

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ Missing Cloudflare R2 environment variables')
  console.error('Account ID:', R2_ACCOUNT_ID ? '✅ Set' : '❌ Missing')
  console.error('Access Key:', R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing')
  console.error('Secret Key:', R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing')
  console.error('Bucket Name:', R2_BUCKET_NAME)
}

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    console.log('☁️  R2 upload request received')
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('fileType') as string // 'video' or 'mind'
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      sizeMB: (file.size / 1024 / 1024).toFixed(2),
      type: file.type,
      fileType
    })

    // Check file size (limit to 100MB)
    const maxSizeInBytes = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is 100MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB` 
      }, { status: 413 })
    }

    // Validate file types based on fileType
    if (fileType === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
      if (!allowedVideoTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Unsupported video format. Please use MP4, WebM, or MOV files. Current type: ${file.type}` 
        }, { status: 400 })
      }
    } else if (fileType === 'mind') {
      if (!file.name.endsWith('.mind')) {
        return NextResponse.json({ 
          error: 'Please upload a .mind file' 
        }, { status: 400 })
      }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${fileType}-${timestamp}-${randomId}.${fileExtension}`

    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        fileType: fileType,
        uploadedAt: new Date().toISOString(),
      },
      // Set CORS headers for web access
      CacheControl: 'public, max-age=31536000',
      ACL: 'public-read'
    })

    await r2Client.send(uploadCommand)

    // Generate public URL (R2 public bucket)
    const publicUrl = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`

    console.log('✅ File uploaded to R2:', {
      fileName,
      publicUrl,
      size: file.size
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: file.size
    })

  } catch (error) {
    console.error('❌ R2 upload error:', error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
