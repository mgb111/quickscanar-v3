import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Force Next.js to handle larger request bodies for this route
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout



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
console.log('🔧 Initializing R2 client with:', {
  accountId: R2_ACCOUNT_ID,
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  hasAccessKey: !!R2_ACCESS_KEY_ID,
  hasSecretKey: !!R2_SECRET_ACCESS_KEY,
  bucketName: R2_BUCKET_NAME
})

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
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
    console.log('☁️  R2 presigned URL request received')
    
    // Parse JSON body for presigned URL request
    const body = await request.json()
    const { fileName, fileType, contentType } = body
    
    if (!fileName || !fileType) {
      return NextResponse.json({ 
        error: 'Missing fileName or fileType' 
      }, { status: 400 })
    }

    console.log('📁 Presigned URL request:', {
      fileName,
      fileType,
      contentType
    })

    // // Validate file types based on fileType
    if (fileType === 'video') {
      const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
      if (contentType && !allowedVideoTypes.includes(contentType)) {
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
    const uniqueFileName = `${fileType}-${timestamp}-${randomId}.${fileExtension}`

    // putObjectCommand for PUT operation
    const putObjectCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType,
      Metadata: {
        originalName: fileName,
        fileType: fileType,
        uploadedAt: new Date().toISOString(),
      }
    })

    // Generate presigned URL (expires in 5 minutes)
    const presignedUrl = await getSignedUrl(r2Client, putObjectCommand, { expiresIn: 300 })

    // Generate final public URL
    const publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFileName}`

    console.log('✅ Presigned URL generated:', {
      uniqueFileName,
      presignedUrl: presignedUrl.substring(0, 100) + '...',
      publicUrl,
      expiresIn: '5 minutes'
    })

    return NextResponse.json({
      success: true,
      presignedUrl,
      publicUrl,
      fileName: uniqueFileName,
      uploadMethod: 'PUT'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ R2 presigned URL error:', error)
    
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: `Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
