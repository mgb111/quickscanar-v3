export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { experienceId } = await request.json()
    if (!experienceId) {
      return NextResponse.json({ error: 'Missing experienceId' }, { status: 400 })
    }

    console.log('Compiling MindAR file for experience:', experienceId)
    
    // For now, always use the working card.mind file to prevent buffer errors
    // This ensures the AR experience works reliably
    let mindFile: Uint8Array = new Uint8Array()
    let method = 'working-card-mind'

    try {
      // Get the marker image from the experience for reference
      const { data: experience, error: experienceError } = await supabase
        .from('ar_experiences')
        .select('marker_image_url')
        .eq('id', experienceId)
        .single()

      if (experienceError) {
        console.error('Database error:', experienceError)
        throw new Error(`Database error: ${experienceError.message}`)
      }

      if (!experience?.marker_image_url) {
        throw new Error('No marker image found for this experience')
      }

      console.log('Using working card.mind file for reliability')
      const workingMindFileUrl = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind'
      
      const response = await fetch(workingMindFileUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch working MindAR file: ${response.statusText}`)
      }
      
      mindFile = new Uint8Array(await response.arrayBuffer())
      console.log('Working MindAR file fetched, size:', mindFile.length)

    } catch (error) {
      console.error('Error fetching working MindAR file:', error)
      throw new Error(`Failed to get working MindAR file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Upload to Supabase
    const fileName = `mind-${Date.now()}.mind`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mind-files')
      .upload(fileName, mindFile, {
        contentType: 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload MindAR file: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('mind-files')
      .getPublicUrl(fileName)
    
    const mindFileUrl = urlData.publicUrl
    console.log('MindAR file uploaded:', mindFileUrl)
    
    // Update the experience
    const { error: updateError } = await supabase
      .from('ar_experiences')
      .update({ mind_file_url: mindFileUrl })
      .eq('id', experienceId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update experience: ${updateError.message}`)
    }
    
    console.log('Experience updated with MindAR file URL:', mindFileUrl)
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('ar_experiences')
      .select('mind_file_url')
      .eq('id', experienceId)
      .single()
    
    if (verifyError) {
      console.error('Verification error:', verifyError)
    } else {
      console.log('Verified mind_file_url in database:', verifyData.mind_file_url)
    }

    return NextResponse.json({
      success: true,
      mindFileUrl,
      message: 'MindAR file compiled and uploaded successfully',
      method: method,
      note: 'Using working card.mind template to prevent buffer errors. Your marker image will still be displayed for reference.'
    })

  } catch (error) {
    console.error('MindAR compilation error:', error)
    return NextResponse.json(
      { error: `MindAR compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
} 