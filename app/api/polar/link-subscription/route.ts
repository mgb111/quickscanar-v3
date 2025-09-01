import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Polar API envs (ensure these are set in your environment)
// Note: Polar moved API root from /api/v1 to /v1.
const POLAR_API_URL = process.env.POLAR_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.polar.sh/v1' : 'https://sandbox-api.polar.sh/v1')
const POLAR_API_KEY = process.env.POLAR_API_KEY

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { checkout_id, user_id: bodyUserId, polar_subscription_id: bodySubId, polar_customer_id: bodyCustId } = body || {}
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (!checkout_id || typeof checkout_id !== 'string') {
    return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
  }

  // We'll proceed even if POLAR_API_KEY is missing/invalid; we'll rely on webhook or provided IDs.

  try {
    // Try to identify the user from auth cookie if possible; optional for service role
    let authedUserId: string | null = bodyUserId || null
    try {
      if (!authedUserId) {
        const { data } = await supabase.auth.getUser()
        authedUserId = data?.user?.id ?? null
      }
    } catch {}

    // 1. Determine subscription and customer IDs
    let subscription_id: string | null = bodySubId || null
    let customer_id: string | null = bodyCustId || null
    if (!subscription_id || !customer_id) {
      if (POLAR_API_KEY) {
        const polarResponse = await fetch(`${POLAR_API_URL}/checkouts/${checkout_id}`,
          {
            headers: {
              Authorization: `Bearer ${POLAR_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!polarResponse.ok) {
          const errorBody = await polarResponse.text()
          console.error(`Failed to fetch Polar checkout ${checkout_id}:`, errorBody)
          // Gracefully degrade: do NOT insert placeholder rows (schema requires non-null IDs).
          // If we know the user, attempt an update to an existing row only.
          if (authedUserId) {
            try {
              const now = new Date().toISOString()
              const { error: updErr } = await supabase
                .from('user_subscriptions')
                .update({ status: 'pending_webhook', updated_at: now })
                .eq('user_id', authedUserId)
              if (updErr) console.warn('Pending placeholder update failed (non-fatal):', updErr)
            } catch (e) {
              console.warn('Unable to update pending placeholder row:', e)
            }
          }
          return NextResponse.json({
            linked: false,
            queued: true,
            message: 'Could not fetch checkout from Polar (unauthorized or unavailable). Will rely on webhook to link subscription.',
          }, { status: 202 })
        }

        const checkoutSession = await polarResponse.json()
        console.log('Checkout session data from Polar:', JSON.stringify(checkoutSession, null, 2))
        console.log('Available fields:', Object.keys(checkoutSession))
        subscription_id = checkoutSession.subscription_id
        customer_id = checkoutSession.customer_id
      } else {
        console.warn('POLAR_API_KEY missing; cannot fetch checkout. Relying on webhook to link later.')
        if (authedUserId) {
          try {
            const now = new Date().toISOString()
            const { error: updErr } = await supabase
              .from('user_subscriptions')
              .update({ status: 'pending_webhook', updated_at: now })
              .eq('user_id', authedUserId)
            if (updErr) console.warn('Pending placeholder update failed (non-fatal):', updErr)
          } catch (e) {
            console.warn('Unable to update pending placeholder row:', e)
          }
        }
        return NextResponse.json({
          linked: false,
          queued: true,
          message: 'POLAR_API_KEY not set. Will rely on webhook to link subscription after payment.'
        }, { status: 202 })
      }
    }

    // Handle race condition: if sub ID is missing post-payment, accept and rely on webhook
    if (!customer_id) {
      console.error('Checkout session is missing critical customer_id', { checkout_id })
      return NextResponse.json({ error: 'Invalid checkout session: missing customer_id' }, { status: 400 })
    }
    if (!subscription_id) {
      console.log(`Checkout ${checkout_id} is pending subscription_id; trying to fetch subscriptions for customer ${customer_id}`)
      
      // Try to fetch subscriptions for this customer as a fallback
      if (POLAR_API_KEY) {
        try {
          const subscriptionsResponse = await fetch(`${POLAR_API_URL}/subscriptions?customer_id=${customer_id}`, {
            headers: {
              Authorization: `Bearer ${POLAR_API_KEY}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (subscriptionsResponse.ok) {
            const subscriptionsData = await subscriptionsResponse.json()
            console.log('Customer subscriptions:', JSON.stringify(subscriptionsData, null, 2))
            
            // Look for the most recent subscription for this customer
            if (subscriptionsData.items && subscriptionsData.items.length > 0) {
              const latestSubscription = subscriptionsData.items[0] // Assuming they're sorted by creation date
              subscription_id = latestSubscription.id
              console.log(`Found subscription ${subscription_id} for customer ${customer_id}`)
            }
          }
        } catch (e) {
          console.warn('Failed to fetch customer subscriptions:', e)
        }
      }
      
      if (!subscription_id) {
        console.log(`Checkout ${checkout_id} is still pending subscription_id; accepting and awaiting webhook.`)
        // Gracefully accept and let the webhook handle the final linking.
        // We can't create a placeholder row without subscription_id due to NOT NULL constraint.
        return NextResponse.json({
          linked: false,
          queued: true,
          message: 'Subscription creation is pending. It will be linked via webhook shortly.'
        }, { status: 202 })
      }
    }

    // 2. Upsert the subscription details into our database, linking it to the user
    // Build the row; only include user_id when we have it
    const upsertRow: Record<string, any> = {
      polar_subscription_id: subscription_id,
      polar_customer_id: customer_id,
      status: 'pending_webhook',
      updated_at: new Date().toISOString(),
    }
    if (authedUserId) upsertRow.user_id = authedUserId

    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(
        upsertRow,
        { onConflict: 'polar_subscription_id' }
      )

    if (upsertError) {
      console.error('Error upserting subscription for user:', upsertError)
      return NextResponse.json({ error: 'Failed to save subscription details' }, { status: 500 })
    }

    console.log(`Successfully linked subscription ${subscription_id} to user ${authedUserId || 'unknown (no session)'}`)
    return NextResponse.json({ success: true, subscription_id, linked: true })

  } catch (error) {
    console.error('Unexpected error in link-subscription handler:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
