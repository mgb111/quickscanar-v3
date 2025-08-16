import { NextRequest, NextResponse } from 'next/server'
import { CompilerScraper } from '@/lib/compiler-scraper'
import { MindARServerCompiler } from '@/lib/mindar-server-compiler'

export async function POST(request: NextRequest) {
  console.log('🎯 Mind compilation API called')
  
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      console.error('❌ No image file provided')
      return NextResponse.json({ 
        error: 'No image file provided',
        details: 'Please upload an image file'
      }, { status: 400 })
    }

    console.log('📝 Image file details:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    })

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(imageFile.type)) {
      console.error('❌ Invalid file type:', imageFile.type)
      return NextResponse.json({ 
        error: 'Invalid file type',
        details: 'Please upload a JPG or PNG image'
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (imageFile.size > maxSize) {
      console.error('❌ File too large:', imageFile.size)
      return NextResponse.json({ 
        error: 'File too large',
        details: 'Please upload an image smaller than 10MB'
      }, { status: 400 })
    }

    // Strategy 1: Try browser automation first
    let mindFileBuffer: Buffer | null = null
    let webScrapingFailed = false
    
    try {
      console.log('🚀 Strategy 1: Trying browser automation...')
      const scraper = new CompilerScraper()
      
      try {
        await scraper.init()
        mindFileBuffer = await scraper.convertImageToMind(imageFile)
        console.log('✅ Browser automation successful')
      } finally {
        await scraper.close()
      }
      
    } catch (browserError: any) {
      console.log('❌ Browser automation failed:', browserError.message)
      webScrapingFailed = true
      
      // Strategy 2: Fall back to server-side compilation
      if (browserError.message.includes('Chrome') || browserError.message.includes('browser')) {
        console.log('🚀 Strategy 2: Trying server-side MindAR compilation...')
        
        try {
          const serverCompiler = new MindARServerCompiler()
          const imageBuffer = Buffer.from(await imageFile.arrayBuffer())
          mindFileBuffer = await serverCompiler.compileImageToMindBuffer(imageBuffer)
          console.log('✅ Server-side compilation successful')
        } catch (serverError: any) {
          console.error('❌ Server-side compilation also failed:', serverError.message)
          throw new Error(`Both browser automation and server-side compilation failed. Browser error: ${browserError.message}. Server error: ${serverError.message}`)
        }
      } else {
        throw browserError
      }
    }
    
    if (!mindFileBuffer) {
      throw new Error('Failed to generate mind file using any available method')
    }
    
    console.log('✅ Mind file generation completed successfully')
    console.log('📊 Mind file size:', mindFileBuffer.length, 'bytes')
    console.log('🔧 Method used:', webScrapingFailed ? 'Server-side compilation' : 'Browser automation')
    
    // Return the .mind file
    return new NextResponse(mindFileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${imageFile.name.replace(/\.[^/.]+$/, '')}.mind"`,
        'Content-Length': mindFileBuffer.length.toString(),
        'X-Compilation-Method': webScrapingFailed ? 'server-side' : 'browser-automation'
      }
    })
    
  } catch (error: any) {
    console.error('❌ API error:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'An unexpected error occurred'
    }, { status: 500 })
  }
}

// Test endpoint to check if the compiler page is accessible
export async function GET(request: NextRequest) {
  console.log('🧪 Testing compiler page accessibility...')
  
  try {
    const scraper = new CompilerScraper()
    const isAccessible = await scraper.testPageAccess()
    
    return NextResponse.json({ 
      accessible: isAccessible,
      message: isAccessible ? 'Compiler page is accessible' : 'Compiler page is not accessible',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    
    return NextResponse.json({ 
      accessible: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}