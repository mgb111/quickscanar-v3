import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/admin/set-campaign-limit-by-email
// Body: { email: string, limit: number }
// Requires: SUPABASE service role key in env (bypasses RLS). Intended for internal/admin use only.
export async function POST(request: NextRequest) {
  // Validate input
  let body: any
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = String(body?.email || '').trim().toLowerCase()
  const limit = Number(body?.limit)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json({ error: 'limit must be a positive number' }, { status: 400 })
  }

  // Service role client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })
  }
  const admin = createClient(url, serviceKey)

  // Ensure there is an active subscription record for this email and set the campaign_limit
  const now = new Date()
  const oneMonthLater = new Date(now)
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)

  // Find an existing active subscription by email
  const { data: existing, error: fetchErr } = await admin
    .from('subscriptions')
    .select('*')
    .eq('email', email)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (fetchErr) {
    console.error('Error fetching subscription by email:', fetchErr)
    return NextResponse.json({ error: 'Database error while fetching subscription' }, { status: 500 })
  }

  if (existing) {
    // Update existing
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
  }

  // Otherwise, create a minimal active subscription row keyed by email
  const { data: inserted, error: insErr } = await admin
    .from('subscriptions')
    .insert({
      user_id: null, // may be linked later via webhook/link flow
      email,
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
