import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('ar_experiences')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code
      }, { status: 500 })
    }
    
    console.log('✅ Database connection successful')
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tableExists: true
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
