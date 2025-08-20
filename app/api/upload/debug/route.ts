import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
      CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
      CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
      CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'quickscanar',
    }

    // Calculate expected URLs
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'quickscanar'
    
    const expectedUrls = {
      r2Endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '❌ Missing Account ID',
      publicUrl: accountId ? `https://pub-${accountId}.r2.dev` : '❌ Missing Account ID',
      bucketUrl: accountId ? `https://${bucketName}.${accountId}.r2.cloudflarestorage.com` : '❌ Missing Account ID',
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      expectedUrls,
      note: 'This endpoint helps debug R2 configuration. Check that all environment variables are set correctly.'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: `Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
