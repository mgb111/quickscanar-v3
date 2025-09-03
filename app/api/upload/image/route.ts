import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'Missing fileName or contentType' }, { status: 400 });
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({
        error: `Unsupported image format. Please use JPEG, PNG, WEBP, or GIF. Current type: ${contentType}`
      }, { status: 400 });
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID as string
    const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID as string
    const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY as string
    const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME as string

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      return NextResponse.json({ error: 'Cloudflare R2 is not configured on the server' }, { status: 500 })
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    const key = `uploads/images/${Date.now()}_${fileName}`
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 10 }) // 10 minutes

    return NextResponse.json({ signedUrl, key })
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: `Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
