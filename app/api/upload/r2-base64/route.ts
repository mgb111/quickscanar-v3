import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Force Next.js to handle larger request bodies for this route
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout
export const runtime = 'nodejs'



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
    console.log('☁️  R2 base64 upload request received')
    
    // Parse JSON body
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }
    const { fileName, fileType, contentType, base64Data } = body

    if (!fileName || !fileType || !base64Data) {
      return NextResponse.json({ 
        error: 'Missing required fields: fileName, fileType, or base64Data' 
      }, { status: 400 })
    }

    // Validate base64 string
    const base64Pattern = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/
    if (!base64Pattern.test(base64Data.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid base64 data.' }, { status: 400 })
    }

    // Check file size (base64 expands size by ~33%)
    const fileSizeBytes = Math.floor((base64Data.length * 3) / 4) // rough estimate
    const maxBytes = 50 * 1024 * 1024 // 50MB
    if (fileSizeBytes > maxBytes) {
      return NextResponse.json({ error: `File too large. Max allowed is 50MB.` }, { status: 413 })
    }

    console.log('📁 File details:', {
      name: fileName,
      type: contentType,
      fileType,
      base64Length: base64Data.length,
      fileSizeBytes,
    })

    // Validate file types based on fileType
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

    console.log('📤 Starting base64 file upload to R2...')
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    
    console.log('📦 Buffer created from base64, size:', buffer.length)
    
    const uploadCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        originalName: fileName,
        fileType: fileType,
        uploadedAt: new Date().toISOString(),
        uploadMethod: 'base64'
      }
    })

    console.log('🚀 Sending upload command to R2...')
    await r2Client.send(uploadCommand)

    // Generate public URL (R2 public bucket)
    const publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFileName}`

    console.log('✅ File uploaded to R2 successfully:', {
      fileName: uniqueFileName,
      publicUrl,
      size: buffer.length
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      size: buffer.length
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ R2 base64 upload error:', error)
    
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
