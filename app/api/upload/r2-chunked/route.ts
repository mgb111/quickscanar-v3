import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'

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
    console.log('☁️  R2 chunked upload request received')
    
    // Check if this is a multipart form data request
    const contentType = request.headers.get('content-type')
    console.log('📋 Content-Type:', contentType)
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type. Expected multipart/form data' }, { status: 400 })
    }
    
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

    // Check file size (limit to 500MB)
    const maxSizeInBytes = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is 500MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB` 
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

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${fileType}-${timestamp}-${randomId}.${fileExtension}`

    console.log('📤 Starting chunked file upload to R2...')
    
    // For files larger than 50MB, use multipart upload
    if (file.size > 50 * 1024 * 1024) {
      console.log('🔄 Using multipart upload for large file')
      
      // Create multipart upload
      const createMultipartCommand = new CreateMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          fileType: fileType,
          uploadedAt: new Date().toISOString(),
          uploadMethod: 'multipart'
        }
      })
      
      const multipartUpload = await r2Client.send(createMultipartCommand)
      const uploadId = multipartUpload.UploadId
      
      if (!uploadId) {
        throw new Error('Failed to create multipart upload')
      }
      
      console.log('📋 Multipart upload created, ID:', uploadId)
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Upload in chunks (5MB chunks)
      const chunkSize = 5 * 1024 * 1024 // 5MB
      const parts: any[] = []
      let partNumber = 1
      
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize)
        
        console.log(`📦 Uploading part ${partNumber}, size: ${chunk.length} bytes`)
        
        const uploadPartCommand = new UploadPartCommand({
          Bucket: R2_BUCKET_NAME,
          Key: fileName,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: chunk
        })
        
        const uploadPartResult = await r2Client.send(uploadPartCommand)
        
        if (uploadPartResult.ETag) {
          parts.push({
            ETag: uploadPartResult.ETag,
            PartNumber: partNumber
          })
          console.log(`✅ Part ${partNumber} uploaded successfully`)
        }
        
        partNumber++
      }
      
      // Complete multipart upload
      console.log('🔚 Completing multipart upload...')
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts }
      })
      
      await r2Client.send(completeCommand)
      console.log('✅ Multipart upload completed successfully')
      
    } else {
      // For smaller files, use regular upload
      console.log('📤 Using regular upload for smaller file')
      
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const uploadCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          fileType: fileType,
          uploadedAt: new Date().toISOString(),
          uploadMethod: 'regular'
        }
      })

      await r2Client.send(uploadCommand)
      console.log('✅ Regular upload completed successfully')
    }

    // Generate public URL (R2 public bucket)
    const publicUrl = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`

    console.log('✅ File uploaded to R2 successfully:', {
      fileName,
      publicUrl,
      size: file.size
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: file.size
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('❌ R2 chunked upload error:', error)
    
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Check if it's a size-related error
    if (error instanceof Error && error.message.includes('413')) {
      return NextResponse.json(
        { error: `File too large. Please try a smaller file or contact support.` },
        { status: 413 }
      )
    }
    
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
