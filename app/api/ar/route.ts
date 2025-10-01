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
    const { 
      title, 
      video_file_url,
      video_scale,
      model_url,
      content_type,
      model_scale,
      model_rotation,
      model_position_x,
      model_position_y,
      model_position_z,
      mind_file_url, 
      marker_image_url, 
      user_id, 
      link_url 
    } = body
    
    console.log('📝 Creating AR experience with data:', {
      title,
      video_file_url,
      model_url,
      content_type,
      mind_file_url,
      marker_image_url,
      user_id,
      hasTitle: !!title,
      hasVideo: !!video_file_url,
      hasModel: !!model_url,
      contentType: content_type,
      hasMind: !!mind_file_url,
      hasMarkerImage: !!marker_image_url,
      hasUserId: !!user_id,
      hasLink: !!link_url
    })

    // Validate required fields - need either video or 3D model
    if (!title || !user_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: title and user_id are required' 
      }, { status: 400 })
    }

    // Validate content type and corresponding URL
    const actualContentType = content_type || 'video'
    
    // Validate based on content type
    if (actualContentType === 'video' && !video_file_url) {
      return NextResponse.json({ 
        error: 'video_file_url is required when content_type is "video"' 
      }, { status: 400 })
    }
    if (actualContentType === '3d' && !model_url) {
      return NextResponse.json({ 
        error: 'model_url is required when content_type is "3d"' 
      }, { status: 400 })
    }
    if (actualContentType === 'both' && (!video_file_url || !model_url)) {
      return NextResponse.json({ 
        error: 'Both video_file_url and model_url are required when content_type is "both"' 
      }, { status: 400 })
    }
    
    // Must have at least one content URL
    if (!video_file_url && !model_url) {
      return NextResponse.json({ 
        error: 'At least video_file_url or model_url is required' 
      }, { status: 400 })
    }

    // Enforce 1 campaign per user (free plan)
    // Phase 1: Lifetime limit via claims table (if present)
    try {
      const { data: claimRows, error: claimErr } = await supabase
        .from('user_campaign_claims')
        .select('id')
        .eq('user_id', user_id)
        .limit(1)

      if (claimErr) {
        // If table doesn't exist or permission error, log and continue to fallback check
        console.warn('⚠️ Claims table check skipped:', claimErr.message)
      } else if (claimRows && claimRows.length > 0) {
        return NextResponse.json({
          error: 'Free plan allows only 1 campaign lifetime per user. Upgrade to create more.',
          code: 'LIMIT_LIFETIME'
        }, { status: 409 })
      }
    } catch (e: any) {
      console.warn('⚠️ Claims table check failed unexpectedly:', e?.message || e)
    }

    // Phase 2: Check subscription-based limits
    const { count: existingCount, error: countError } = await supabase
      .from('ar_experiences')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)

    if (countError) {
      console.error('❌ Error checking existing experiences count:', countError)
      return NextResponse.json({ 
        error: `Failed to validate user quota: ${countError.message}`
      }, { status: 500 })
    }

    // Get user's subscription to determine actual limits
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status, campaign_limit, end_date')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .maybeSingle()

    // Determine plan limits based on subscription
    let usageLimit = 1 // Free plan default
    
    const isActiveLike = (sub: any) => {
      if (!sub) return false
      const status = (sub.status || '').toLowerCase()
      const endOk = sub.end_date ? new Date(sub.end_date) > new Date() : true
      return status !== 'canceled' && status !== 'expired' && endOk
    }

    if (subscription && isActiveLike(subscription)) {
      const planLimits = {
        monthly: 3,
        annual: 36,
        yearly: 36,
        pro: 10,
      } as const

      const rawPlan = (subscription.plan || '').toLowerCase()
      if (rawPlan in planLimits) {
        usageLimit = planLimits[rawPlan as keyof typeof planLimits]
      } else if (rawPlan.includes('annual') || rawPlan.includes('yearly') || rawPlan.includes('year')) {
        usageLimit = 36
      } else if (rawPlan.includes('monthly') || rawPlan.includes('month')) {
        usageLimit = 3
      } else if (rawPlan.includes('pro')) {
        usageLimit = 10
      }

      // Override with per-user campaign_limit when present
      if (typeof subscription.campaign_limit === 'number' && subscription.campaign_limit > 0) {
        usageLimit = subscription.campaign_limit
      }
    }

    if ((existingCount ?? 0) >= usageLimit) {
      return NextResponse.json({
        error: `Limit reached: Only ${usageLimit} campaign${usageLimit > 1 ? 's' : ''} allowed on your current plan. Upgrade to create more.`,
        code: 'LIMIT_EXCEEDED'
      }, { status: 409 })
    }

    // Create AR experience in database
    const { data: experience, error } = await supabase
      .from('ar_experiences')
      .insert({
        title: title.trim(),
        description: null,

        mind_file_url: mind_file_url || null,
        marker_image_url: marker_image_url || null,
        video_url: video_file_url || null,
        video_scale: video_scale || 1.0,
        model_url: model_url || null,
        content_type: actualContentType,
        model_scale: model_scale || 1.0,
        model_rotation: model_rotation || 0,
        model_position_x: model_position_x || 0,
        model_position_y: model_position_y || 0.3,
        model_position_z: model_position_z || 0.15,
        link_url: link_url ? String(link_url).trim() : null,
        user_id: user_id,
        
        // Default values for other fields as needed
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating AR experience:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update campaign creation counter
    try {
      // Get current count and increment
      const { data: currentClaim, error: fetchError } = await supabase
        .from('user_campaign_claims')
        .select('campaigns_created_count')
        .eq('user_id', user_id)
        .maybeSingle()

      if (fetchError || !currentClaim) {
        // Insert new record with count = 1
        const { error: insertError } = await supabase
          .from('user_campaign_claims')
          .insert({ 
            user_id, 
            campaigns_created_count: 1,
            first_created_at: new Date().toISOString(),
            last_created_at: new Date().toISOString()
          })
        
        if (insertError) {
          console.warn('⚠️ Failed to track campaign creation (non-fatal):', insertError.message)
        }
      } else {
        // Update existing record with incremented count
        const newCount = (currentClaim.campaigns_created_count || 0) + 1
        const { error: updateError } = await supabase
          .from('user_campaign_claims')
          .update({ 
            campaigns_created_count: newCount,
            last_created_at: new Date().toISOString()
          })
          .eq('user_id', user_id)

        if (updateError) {
          console.warn('⚠️ Failed to update campaign count (non-fatal):', updateError.message)
        }
      }
    } catch (e: any) {
      console.warn('⚠️ Failed to track campaign creation (unexpected):', e?.message || e)
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
