import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    // Get user's subscription; be robust to email case
    let subscription: any = null
    let subError: any = null

    // Try by user_id first
    if (user.id) {
      const resByUser = await supabase
        .from('subscriptions')
        .select('plan, status, campaign_limit, end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .maybeSingle()
      subscription = resByUser.data
      subError = resByUser.error
    }

    // If not found, try by email (case-insensitive)
    if ((!subscription && user.email) || subError) {
      const resByEmail = await supabase
        .from('subscriptions')
        .select('plan, status, campaign_limit, end_date')
        .ilike('email', user.email)
        .order('created_at', { ascending: false })
        .maybeSingle()
      if (resByEmail.data) subscription = resByEmail.data
    }

    // If still no row or RLS blocked, try admin client as fallback (server-side only)
    if (!subscription && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

      // Try by user_id
      if (user.id && !subscription) {
        const adminByUser = await admin
          .from('subscriptions')
          .select('plan, status, campaign_limit, end_date')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .maybeSingle()
        if (adminByUser.data) subscription = adminByUser.data
      }

      // Try by email (case-insensitive)
      if (user.email && !subscription) {
        const adminByEmail = await admin
          .from('subscriptions')
          .select('plan, status, campaign_limit, end_date')
          .ilike('email', user.email)
          .order('created_at', { ascending: false })
          .maybeSingle()
        if (adminByEmail.data) subscription = adminByEmail.data
      }
    }

    // Count total campaigns created (including deleted ones) using campaign claims table
    let totalCampaignsCreated = 0
    
    // First try to get from user_campaign_claims table (tracks total created)
    const { data: claimData, error: claimError } = await supabase
      .from('user_campaign_claims')
      .select('campaigns_created_count')
      .eq('user_id', user.id)
      .maybeSingle()

    if (claimError) {
      console.warn('Claims table not available, falling back to active count:', claimError.message)
      // Fallback: count active AR experiences
      const { count: experienceCount, error: countError } = await supabase
        .from('ar_experiences')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) {
        console.error('Error counting AR experiences:', countError)
        return NextResponse.json({ error: 'Failed to fetch campaign usage' }, { status: 500 })
      }
      
      totalCampaignsCreated = experienceCount || 0
    } else {
      // Use the persistent counter from claims table
      totalCampaignsCreated = claimData?.campaigns_created_count || 0
    }

    // Determine plan limits based on subscription
    let usageLimit = 1 // Free plan default
    let planName = 'Free Plan'

    const isActiveLike = (sub: any) => {
      if (!sub) return false
      const status = (sub.status || '').toLowerCase()
      const endOk = sub.end_date ? new Date(sub.end_date) > new Date() : true
      return status !== 'canceled' && status !== 'expired' && endOk
    }

    if (subscription && isActiveLike(subscription)) {
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

    // Final authoritative mapping: plan_name strictly from limit
    const nameByLimit: Record<number, string> = {
      1: 'Free Plan',
      3: 'Monthly Plan',
      36: 'Annual Plan',
    }
    if (nameByLimit[usageLimit]) {
      planName = nameByLimit[usageLimit]
    }

    return NextResponse.json({
      used: totalCampaignsCreated,
      limit: usageLimit,
      plan_name: planName
    })
  } catch (error) {
    console.error('Unexpected error fetching campaign usage:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
