import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  let user = null

  // Try to get user from cookies first
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  user = cookieUser

  // If no user from cookies, try JWT token from Authorization header
  if (!user) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user: jwtUser } } = await supabase.auth.getUser(token)
      user = jwtUser
    }
  }
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user's subscription to determine limits from new Zapier-managed table
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status, campaign_limit')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .eq('status', 'active')
      .maybeSingle()

    // Count user's AR experiences (not campaigns)
    const { count: experienceCount, error: countError } = await supabase
      .from('ar_experiences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting AR experiences:', countError)
      // Fallback: try user_campaigns table if ar_experiences doesn't exist
      const { count: campaignCount, error: campaignError } = await supabase
        .from('user_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      if (campaignError) {
        console.error('Error counting campaigns:', campaignError)
        return NextResponse.json({ error: 'Failed to fetch campaign usage' }, { status: 500 })
      }
      
      // Use campaign count as fallback
      return NextResponse.json({
        used: campaignCount || 0,
        limit: 1,
        plan_name: 'Free Plan'
      })
    }

    // Determine plan limits based on subscription
    let usageLimit = 1 // Free plan default
    let planName = 'Free Plan'

    if (subscription && subscription.status === 'active') {
      const planLimits = {
        monthly: { limit: 3, name: 'Monthly Plan' },
        annual: { limit: 36, name: 'Annual Plan' },
        yearly: { limit: 36, name: 'Annual Plan' },
        pro: { limit: 10, name: 'Pro Plan' },
      } as const

      const rawPlan = (subscription.plan || '').toLowerCase()
      let detected: keyof typeof planLimits | null = null
      if (rawPlan in planLimits) {
        detected = rawPlan as keyof typeof planLimits
      } else if (rawPlan.includes('annual') || rawPlan.includes('yearly') || rawPlan.includes('year')) {
        detected = 'annual'
      } else if (rawPlan.includes('monthly') || rawPlan.includes('month')) {
        detected = 'monthly'
      } else if (rawPlan.includes('pro')) {
        detected = 'pro'
      }

      if (detected) {
        usageLimit = planLimits[detected].limit
        planName = planLimits[detected].name
      }

      // IMPORTANT: override with per-user campaign_limit when present
      if (typeof (subscription as any).campaign_limit === 'number' && (subscription as any).campaign_limit > 0) {
        usageLimit = (subscription as any).campaign_limit
      }
    }

    return NextResponse.json({
      used: experienceCount || 0,
      limit: usageLimit,
      plan_name: planName
    })
  } catch (error) {
    console.error('Unexpected error fetching campaign usage:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
