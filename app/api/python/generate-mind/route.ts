import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // For local development, return a mock response
    // In production, this will be handled by the Python function
    const imageData = await request.arrayBuffer()
    
    // Create a basic mock mind file for testing
    const mockMindData = {
      images: [{
        width: 512,
        height: 512,
        keypoints: Array.from({ length: 100 }, (_, i) => [i % 10, Math.floor(i / 10), 0, 1]),
        descriptors: Array.from({ length: 100 }, () => Array.from({ length: 32 }, () => Math.random()))
      }],
      trackingData: {
        imageSize: [512, 512],
        featureCount: 100
      }
    }
    
    const mindFileData = new TextEncoder().encode(JSON.stringify(mockMindData))
    
    return new NextResponse(mindFileData, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="marker.mind"'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Mind file generation failed' },
      { status: 500 }
    )
  }
} 