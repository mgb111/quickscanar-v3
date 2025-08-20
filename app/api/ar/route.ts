import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, video_file_url, mind_file_url, user_id } = body
    
    console.log('📝 Creating AR experience with data:', {
      title,
      video_file_url,
      mind_file_url,
      user_id,
      hasTitle: !!title,
      hasVideo: !!video_file_url,
      hasMind: !!mind_file_url,
      hasUserId: !!user_id
    })

    // Validate required fields
    if (!title || !video_file_url || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, video_file_url, and user_id are required' 
      }, { status: 400 })
    }

    // Create AR experience in database
    const { data: experience, error } = await supabase
      .from('ar_experiences')
      .insert({
        title: title.trim(),
        description: null,

        mind_file_url: mind_file_url || null,
        video_url: video_file_url,
        preview_image_url: null,
        plane_width: 1.0,
        plane_height: 0.5625, // Match the schema default
        video_rotation: 0,
        user_id: user_id
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error creating AR experience:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: `Failed to create AR experience: ${error.message}` 
      }, { status: 500 })
    }

    console.log('AR experience created successfully:', experience.id)

    return NextResponse.json({
      success: true,
      id: experience.id,
      message: 'AR experience created successfully!'
    })

  } catch (error) {
    console.error('Error creating AR experience:', error)
    return NextResponse.json(
      { error: `AR experience creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ 
        error: 'userId parameter is required' 
      }, { status: 400 })
    }

    // Get all AR experiences for the user
    const { data: experiences, error } = await supabase
      .from('ar_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching AR experiences:', error)
      return NextResponse.json({ 
        error: `Failed to fetch AR experiences: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      experiences: experiences || []
    })

  } catch (error) {
    console.error('Error fetching AR experiences:', error)
    return NextResponse.json(
      { error: `Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
