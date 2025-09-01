import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log("get-subscription - cookies:", request.headers.get('cookie'));
  console.log("get-subscription - headers:", Object.fromEntries(request.headers.entries()));
  const supabase = createRouteHandlerClient({ cookies })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (error) {
      console.error('Error fetching subscription:', error)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    return NextResponse.json({ subscription: data })
  } catch (error) {
    console.error('Unexpected error fetching subscription:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
