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
    console.log('☁️  R2 presign request received')

    // Require JSON metadata: { fileName, fileType, contentType }
    const contentTypeHeader = request.headers.get('content-type') || ''
    if (!contentTypeHeader.includes('application/json')) {
      return NextResponse.json({ error: 'Expected application/json with file metadata' }, { status: 400 })
    }

    const body = await request.json()
    const { fileName, fileType, contentType } = body as { fileName: string; fileType?: string; contentType: string }

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Missing fileName or contentType' }, { status: 400 })
    }

    // Validate content type
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowed3DTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
    const isMind = fileType === 'mind'
    const isMarkerImage = fileType === 'markerImage'
    const is3DModel = fileType === '3d' || fileType === 'model'
    
    if (!isMind && !isMarkerImage && !is3DModel && !allowedVideoTypes.includes(contentType)) {
      return NextResponse.json({
        error: `Unsupported content type. Allowed: ${allowedVideoTypes.join(', ')}, 3D models (GLB/GLTF), or image files for marker images`
      }, { status: 400 })
    }
    
    if (isMind && !fileName.endsWith('.mind')) {
      return NextResponse.json({ error: 'For mind files, fileName must end with .mind' }, { status: 400 })
    }
    
    if (isMarkerImage && !allowedImageTypes.includes(contentType)) {
      return NextResponse.json({
        error: `Unsupported image type for marker. Allowed: ${allowedImageTypes.join(', ')}`
      }, { status: 400 })
    }
    
    if (is3DModel && !fileName.match(/\.(glb|gltf)$/i)) {
      return NextResponse.json({ error: 'For 3D models, fileName must end with .glb or .gltf' }, { status: 400 })
    }

    // Generate unique key in bucket
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).slice(2, 10)
    const ext = fileName.includes('.') ? fileName.split('.').pop() : undefined
    const safeExt = ext ? `.${ext}` : ''
    
    // Ensure proper extension for different file types
    let finalExt = safeExt
    if (isMind && !safeExt.endsWith('.mind')) {
      finalExt = '.mind'
    } else if (isMarkerImage && !safeExt.match(/\.(jpg|jpeg|png|webp)$/i)) {
      finalExt = '.png' // Default to PNG for marker images
    } else if (is3DModel && !safeExt.match(/\.(glb|gltf)$/i)) {
      finalExt = '.glb' // Default to GLB for 3D models
    }
    
    const key = `${fileType || 'upload'}-${timestamp}-${randomId}${finalExt}`

    // Create a presigned PUT URL so the client can upload directly to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
      // Optional: add metadata if needed
      Metadata: {
        originalName: fileName,
        fileType: fileType || 'unknown',
        requestedAt: new Date().toISOString(),
      },
    })

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 * 5 }) // 5 minutes expiry

    // Public URL for retrieval (assuming R2 public bucket)
    const publicUrl = `https://pub-d1d447d39fae4aaf9194ec01c5252450.r2.dev/${key}`

    return NextResponse.json({ signedUrl, key, publicUrl })

  } catch (error) {
    console.error('❌ R2 upload error:', error)
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
