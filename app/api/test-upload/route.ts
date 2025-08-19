import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test upload endpoint hit')
    
    // Log request headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log('📋 Request headers:', headers)
    
    // Try to get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (file) {
      console.log('📁 File received:', {
        name: file.name,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        type: file.type
      })
      
      return NextResponse.json({
        success: true,
        message: 'File received successfully',
        file: {
          name: file.name,
          size: file.size,
          sizeMB: (file.size / 1024 / 1024).toFixed(2),
          type: file.type
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No file received'
      })
    }
    
  } catch (error) {
    console.error('❌ Test upload error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
