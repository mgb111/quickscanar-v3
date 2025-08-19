import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const r2Config = {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
      accessKey: process.env.CLOUDFLARE_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      secretKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'quickscanar'
    }

    return NextResponse.json({
      message: 'R2 Configuration Test',
      timestamp: new Date().toISOString(),
      r2Config,
      status: 'ready'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'R2 test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
