import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Get authenticated user (cookies first, then Authorization header)
    let user = null as any
    let authError: any = null
    const cookieRes = await supabase.auth.getUser()
    user = cookieRes.data.user
    authError = cookieRes.error

    if (!user) {
      const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const jwtRes = await supabase.auth.getUser(token)
        user = jwtRes.data.user
        authError = jwtRes.error
      }
    }

    if (authError || !user) {
      console.log('Auth error or no user:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching subscription for user:', user.id, user.email)

    // Get user's subscription from new subscriptions table (Zapier-managed)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (error) {
      console.error('❌ Database query error in get-subscription:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('✅ Fetched subscription data from DB:', JSON.stringify(data, null, 2));

    if (!data) {
      console.log('ℹ️ No active subscription found for user:', user.id, user.email, 'Returning Free Plan.')
      return NextResponse.json({ 
        subscription: null,
        plan: {
          name: 'Free Plan',
          features: ['1 AR Experience'],
          limit: 1
        }
      })
    }

    // Map plan names to plan info - handle various plan name formats
    const planInfo = {
      'monthly': {
        name: 'Monthly Plan',
        features: ['3 AR Experiences per month', 'Priority Support'],
        limit: 3
      },
      'annual': {
        name: 'Annual Plan', 
        features: ['36 AR Experiences per year', 'Priority Support', 'Advanced Analytics'],
        limit: 36
      },
      'yearly': {
        name: 'Annual Plan', 
        features: ['36 AR Experiences per year', 'Priority Support', 'Advanced Analytics'],
        limit: 36
      },
      'pro': {
        name: 'Pro Plan',
        features: ['10 AR Experiences per month', 'Priority Support', 'Advanced Analytics'],
        limit: 10
      }
    }

    // Enhanced plan detection logic
    const planName = (data.plan || '').toLowerCase();
    console.log('🔍 Raw plan name from DB:', data.plan, 'Lowercase:', planName);
    
    let planType: keyof typeof planInfo | null = null;
    
    // Check for exact matches first
    if (planInfo[planName as keyof typeof planInfo]) {
      planType = planName as keyof typeof planInfo;
    } else {
      // Check for partial matches
      if (planName.includes('annual') || planName.includes('yearly') || planName.includes('year')) {
        planType = 'annual';
      } else if (planName.includes('monthly') || planName.includes('month')) {
        planType = 'monthly';
      } else if (planName.includes('pro')) {
        planType = 'pro';
      }
    }
    
    console.log('🎯 Detected plan type:', planType);
    
    let plan = planType ? planInfo[planType] : {
      name: data.plan || 'Custom Plan',
      features: ['Contact Support for details'],
      limit: 1 // Default to 1 as a fallback
    };

    // IMPORTANT: Override the plan's default limit with the actual limit from the user's subscription record.
    // This ensures that stacked subscriptions are correctly reflected.
    if (data.campaign_limit && typeof data.campaign_limit === 'number') {
      plan.limit = data.campaign_limit;
    }

    // Normalize the plan name strictly from the final numeric limit to keep UI labels consistent
    const nameByLimit: Record<number, string> = {
      1: 'Free Plan',
      3: 'Monthly Plan',
      36: 'Annual Plan',
    };
    if (typeof plan.limit === 'number' && nameByLimit[plan.limit]) {
      plan.name = nameByLimit[plan.limit];
    }

    const responsePayload = {
      subscription: data,
      plan: plan
    };

    console.log('✅ Sending subscription payload to dashboard:', JSON.stringify(responsePayload, null, 2));

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Unexpected error fetching subscription:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
