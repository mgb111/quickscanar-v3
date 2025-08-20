import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { mindFileUrl, videoUrl } = await request.json()
    if (!mindFileUrl || !videoUrl) {
      return NextResponse.json({ error: 'Missing mindFileUrl or videoUrl' }, { status: 400 })
    }

    // Create a new experience with the uploaded .mind file
    const experienceId = 'test-' + Date.now()
    const { error: dbError } = await supabase
      .from('ar_experiences')
      .insert({
        id: experienceId,
        mind_file_url: mindFileUrl,
        video_file_url: videoUrl,
        plane_width: 1,
        plane_height: 0.5625,
        video_rotation: 0
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error(`Failed to create experience: ${dbError.message}`)
    }

    return NextResponse.json({
      success: true,
      experienceId,
      message: 'AR experience created successfully',
      method: 'custom-mind-file'
    })

  } catch (error) {
    console.error('Experience creation error:', error)
    return NextResponse.json(
      { error: `Failed to create experience: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}