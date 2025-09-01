import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("get-subscription - cookies:", request.headers.get('cookie'));
  console.log("get-subscription - headers:", Object.fromEntries(request.headers.entries()));
  
  const supabase = createRouteHandlerClient({ cookies })
  let user = null;

  // Try to get user from cookies first
  const { data: { user: cookieUser } } = await supabase.auth.getUser()
  user = cookieUser;

  // If no user from cookies, try JWT token from Authorization header
  if (!user) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: jwtUser } } = await supabase.auth.getUser(token);
      user = jwtUser;
    }
  }

  if (!user) {
    console.log("No user found in get-subscription - neither cookies nor JWT token");
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (error) {
      console.error('Error fetching subscription:', error)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    // If no active subscription found, return null
    if (!data) {
      return NextResponse.json({ subscription: null })
    }

    // Enhance subscription data with plan information
    const enhancedSubscription = {
      ...data,
      plan_name: data.subscription_plans?.name || 'Unknown Plan',
      plan_features: data.subscription_plans?.features || [],
      plan_amount: data.subscription_plans?.amount || 0,
      plan_currency: data.subscription_plans?.currency || 'USD',
      plan_interval: data.subscription_plans?.interval || 'month'
    }

    return NextResponse.json({ subscription: enhancedSubscription })
  } catch (error) {
    console.error('Unexpected error fetching subscription:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
