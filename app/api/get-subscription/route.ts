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
      .select('*')
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

    // Map price_id to plan information (hardcoded since subscription_plans table doesn't exist)
    const getPlanInfo = (priceId: string) => {
      const planMap: Record<string, any> = {
        'price_free': {
          name: 'Free Plan',
          features: ['1 AR Experience', 'Basic Analytics', 'Community Support'],
          amount: 0,
          currency: 'USD',
          interval: 'month'
        },
        '911e3835-9350-440e-a4d3-86702b91f49f': {
          name: 'QuickScanAR Monthly',
          features: ['3 AR Experiences', 'Advanced Analytics', 'Priority Support'],
          amount: 4900,
          currency: 'USD',
          interval: 'month'
        },
        'price_monthly': {
          name: 'QuickScanAR Monthly',
          features: ['3 AR Experiences', 'Advanced Analytics', 'Priority Support'],
          amount: 4900,
          currency: 'USD',
          interval: 'month'
        },
        '70818a87-09b8-48a4-a44e-3ee0cfda4b17': {
          name: 'QuickScanAR Annual',
          features: ['36 AR Experiences (3/month)', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
          amount: 49900,
          currency: 'USD',
          interval: 'year'
        },
        'price_yearly': {
          name: 'QuickScanAR Annual',
          features: ['36 AR Experiences (3/month)', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
          amount: 49900,
          currency: 'USD',
          interval: 'year'
        }
      }
      
      return planMap[priceId] || {
        name: 'QuickScanAR Monthly',
        features: ['3 AR Experiences', 'Advanced Analytics', 'Priority Support'],
        amount: 4900,
        currency: 'USD',
        interval: 'month'
      }
    }

    const planInfo = getPlanInfo(data.price_id)

    // Enhance subscription data with plan information
    const enhancedSubscription = {
      ...data,
      plan_name: planInfo.name,
      plan_features: planInfo.features,
      plan_amount: planInfo.amount,
      plan_currency: planInfo.currency,
      plan_interval: planInfo.interval
    }

    return NextResponse.json({ subscription: enhancedSubscription })
  } catch (error) {
    console.error('Unexpected error fetching subscription:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
