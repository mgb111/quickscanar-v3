import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { title, video_file_url, mind_file_url, marker_image_url } = await request.json()
    
    if (!title || !video_file_url || !mind_file_url || !marker_image_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, video_file_url, mind_file_url, or marker_image_url' 
      }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Missing or invalid authorization header' 
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

    console.log('📝 Creating AR experience:', {
      title,
      video_file_url,
      mind_file_url,
      marker_image_url,
      user_id: user.id
    })

    // Create a new experience
    const { data, error: dbError } = await supabase
      .from('ar_experiences')
      .insert({
        user_id: user.id,
        title: title,
        marker_image_url: marker_image_url,
        mind_file_url: mind_file_url,
        video_file_url: video_file_url,
        plane_width: 1,
        plane_height: 0.5625,
        video_rotation: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error:', dbError)
      throw new Error(`Failed to create experience: ${dbError.message}`)
    }

    console.log('✅ AR experience created successfully:', data)

    return NextResponse.json({
      success: true,
      id: data.id,
      title: data.title,
      video_file_url: data.video_file_url,
      mind_file_url: data.mind_file_url,
      marker_image_url: data.marker_image_url,
      message: 'AR experience created successfully'
    })

  } catch (error) {
    console.error('❌ Experience creation error:', error)
    return NextResponse.json(
      { error: `Failed to create experience: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
