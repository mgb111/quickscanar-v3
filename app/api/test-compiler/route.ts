import { NextRequest, NextResponse } from 'next/server'
import { testCompilerScraper } from '@/lib/compiler-scraper'

export async function GET(request: NextRequest) {
  console.log('🧪 Testing compiler accessibility...')
  
  try {
    const isAccessible = await testCompilerScraper()
    
    return NextResponse.json({ 
      success: true,
      accessible: isAccessible,
      message: isAccessible 
        ? 'Compiler page is accessible and ready for automation' 
        : 'Compiler page is not accessible - check if https://quickscanar.com/compiler/ is working',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Compiler test failed:', error)
    
    return NextResponse.json({ 
      success: false,
      accessible: false,
      error: error.message,
      message: 'Failed to test compiler accessibility',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
