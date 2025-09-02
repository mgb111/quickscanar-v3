import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// POST /api/admin/set-campaign-limit
// Body: { limit: number }
// Purpose: Quickly set the authenticated user's subscription campaign_limit for testing.
// Notes: This is intended for development/testing. Consider protecting with an admin token if exposing publicly.
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Authenticate user from cookies or Authorization header
  let user = null as any
  const cookieUser = await supabase.auth.getUser()
  user = cookieUser.data.user
  if (!user) {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const jwtRes = await supabase.auth.getUser(token)
      user = jwtRes.data.user
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: any
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const limit = Number(body?.limit)
  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json({ error: 'limit must be a positive number' }, { status: 400 })
  }

  // Admin client for RLS-bypassing updates
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }
  const admin = createClient(url, serviceKey)

  // Fetch existing active subscription for the user (by user_id or email)
  const { data: existing, error: fetchErr } = await admin
    .from('subscriptions')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (fetchErr) {
    console.error('Error fetching subscription:', fetchErr)
    return NextResponse.json({ error: 'Database error while fetching subscription' }, { status: 500 })
  }

  const now = new Date()
  const oneMonthLater = new Date(now)
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

  if (existing) {
    // Update existing subscription
    const { data: updated, error: updErr } = await admin
      .from('subscriptions')
      .update({
        campaign_limit: limit,
        status: 'active',
        end_date: existing.end_date || oneMonthLater.toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updErr) {
      console.error('Error updating subscription:', updErr)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscription: updated })
  } else {
    // Create a minimal active subscription row for testing
    const { data: inserted, error: insErr } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        email: user.email || '',
        plan: 'Custom',
        price_id: null,
        status: 'active',
        start_date: now.toISOString(),
        end_date: oneMonthLater.toISOString(),
        campaign_limit: limit,
      })
      .select()
      .single()

    if (insErr) {
      console.error('Error creating subscription:', insErr)
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, subscription: inserted })
  }
}
