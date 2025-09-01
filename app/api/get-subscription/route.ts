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
