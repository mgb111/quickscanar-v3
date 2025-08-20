import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
    console.log('🔐 Generating presigned URL for direct upload')
    
    const body = await request.json()
    const { fileName, fileType, contentType } = body
    
    if (!fileName || !fileType || !contentType) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName, fileType, contentType' 
      }, { status: 400 })
    }

    console.log('📁 File details:', {
      name: fileName,
      type: contentType,
      fileType
    })

    // Validate file types based on fileType
    if (fileType === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
      if (!allowedVideoTypes.includes(contentType)) {
        return NextResponse.json({ 
          error: `Unsupported video format. Please use MP4, WebM, or MOV files. Current type: ${contentType}` 
        }, { status: 400 })
      }
    } else if (fileType === 'mind') {
      if (!fileName.endsWith('.mind')) {
        return NextResponse.json({ 
          error: 'Please upload a .mind file' 
        }, { status: 400 })
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = fileName.split('.').pop()
    const finalFileName = `${fileType}-${timestamp}-${randomId}.${fileExtension}`

    // Create the PutObject command
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: finalFileName,
      ContentType: contentType,
      Metadata: {
        originalName: fileName,
        fileType: fileType,
        uploadedAt: new Date().toISOString(),
      },
      // Set CORS headers for web access
      CacheControl: 'public, max-age=31536000',
      ACL: 'public-read'
    })

    // Generate presigned URL (valid for 15 minutes)
    const signedUrl = await getSignedUrl(r2Client, putObjectCommand, { expiresIn: 900 })

    // Generate public URL for after upload
    // Use the same bucket endpoint but with 'pub-' prefix for public access
    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${finalFileName}`

    console.log('✅ Presigned URL generated:', {
      fileName: finalFileName,
      publicUrl,
      expiresIn: '15 minutes'
    })

    return NextResponse.json({
      success: true,
      signedUrl,
      key: finalFileName,
      publicUrl,
      expiresIn: 900
    })

  } catch (error) {
    console.error('❌ Presigned URL generation error:', error)
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
