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
    // Get user's subscription to determine plan limits
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans!inner(*)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
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
    let limit = 1 // Free plan default
    let planName = 'Free Plan'

    if (subscription && subscription.status === 'active') {
      // Get limits from subscription_plans and subscription_limits tables
      const { data: planLimits } = await supabase
        .from('subscription_limits')
        .select('*')
        .eq('plan_id', subscription.subscription_plans.id)
        .eq('feature', 'ar_experiences')
        .maybeSingle()

      if (planLimits) {
        limit = planLimits.limit_value
        planName = subscription.subscription_plans.name
      } else {
        // Fallback to hardcoded mapping
        const priceId = subscription.price_id
        
        if (priceId === '911e3835-9350-440e-a4d3-86702b91f49f' || priceId === 'price_monthly') {
          limit = 3 // Monthly plan: 3 campaigns
          planName = 'QuickScanAR Monthly'
        } else if (priceId === 'price_yearly' || priceId === 'price_annual') {
          limit = 36 // Yearly plan: 36 campaigns (3 per month × 12)
          planName = 'QuickScanAR Annual'
        }
      }
    }

    return NextResponse.json({
      used: experienceCount || 0,
      limit: limit,
      plan_name: planName
    })
  } catch (error) {
    console.error('Unexpected error fetching campaign usage:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
