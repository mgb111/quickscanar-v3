import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For local development, return a mock response
    // In production, this will be handled by the Python function
    return NextResponse.json({
      status: 'healthy',
      service: 'mindar-compiler',
      version: '1.0.0',
      note: 'Integrated Python service'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    )
  }
} 