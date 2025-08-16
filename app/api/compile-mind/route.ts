import { NextRequest, NextResponse } from 'next/server'
import { CompilerScraper } from '@/lib/compiler-scraper'

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

    const scraper = new CompilerScraper()
    
    try {
      console.log('🚀 Initializing scraper...')
      await scraper.init()
      
      console.log('🔄 Starting conversion process...')
      const mindFileBuffer = await scraper.convertImageToMind(imageFile)
      
      console.log('✅ Conversion completed successfully')
      console.log('📊 Mind file size:', mindFileBuffer.length, 'bytes')
      
      // Return the .mind file
      return new NextResponse(mindFileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${imageFile.name.replace(/\.[^/.]+$/, '')}.mind"`,
          'Content-Length': mindFileBuffer.length.toString()
        }
      })
      
    } catch (conversionError: any) {
      console.error('❌ Conversion failed:', conversionError)
      
      return NextResponse.json({ 
        error: 'Conversion failed',
        details: conversionError.message || 'Failed to convert image to mind file'
      }, { status: 500 })
      
    } finally {
      await scraper.close()
    }
    
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