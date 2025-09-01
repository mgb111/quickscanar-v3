import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user's subscription to determine plan limits
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    // Count user's campaigns
    const { count: campaignCount, error: countError } = await supabase
      .from('user_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting campaigns:', countError)
      return NextResponse.json({ error: 'Failed to fetch campaign usage' }, { status: 500 })
    }

    // Determine plan limits based on subscription
    let limit = 1 // Free plan default
    let planName = 'Free Plan'

    if (subscription && subscription.status === 'active') {
      // Map price_id to plan details
      const priceId = subscription.price_id
      
      if (priceId === '911e3835-9350-440e-a4d3-86702b91f49f' || priceId === 'price_monthly') {
        limit = -1 // Unlimited for paid plans
        planName = 'QuickScanAR Monthly'
      } else if (priceId === 'price_yearly') {
        limit = -1 // Unlimited for paid plans
        planName = 'QuickScanAR Annual'
      }
    }

    return NextResponse.json({
      used: campaignCount || 0,
      limit: limit,
      plan_name: planName
    })
  } catch (error) {
    console.error('Unexpected error fetching campaign usage:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
