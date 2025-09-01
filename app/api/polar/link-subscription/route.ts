import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Polar API envs (ensure these are set in your environment)
const POLAR_API_URL = process.env.POLAR_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.polar.sh/api/v1' : 'https://sandbox-api.polar.sh/v1')
const POLAR_API_KEY = process.env.POLAR_API_KEY

export async function POST(request: NextRequest) {
  const { checkout_id } = await request.json()
  const supabase = createRouteHandlerClient({ cookies })

  if (!checkout_id || typeof checkout_id !== 'string') {
    return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
  }

  if (!POLAR_API_KEY) {
    console.error('POLAR_API_KEY is not configured for success-link endpoint.')
    return NextResponse.json({ error: 'Polar API not configured' }, { status: 503 })
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // 1. Fetch checkout session from Polar to get subscription and customer IDs
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
      return NextResponse.json({ error: 'Failed to fetch checkout details from Polar' }, { status: polarResponse.status })
    }

    const checkoutSession = await polarResponse.json()
    const { subscription_id, customer_id } = checkoutSession

    if (!subscription_id || !customer_id) {
      console.error('Checkout session is missing subscription_id or customer_id', checkoutSession)
      return NextResponse.json({ error: 'Invalid checkout session data' }, { status: 400 })
    }

    // 2. Upsert the subscription details into our database, linking it to the user
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(
        {
          user_id: user.id,
          polar_subscription_id: subscription_id,
          polar_customer_id: customer_id,
          // We don't know the status yet, webhook will update it to 'active'.
          // Setting a temporary status can be helpful for UI.
          status: 'pending_webhook',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'polar_subscription_id' // If webhook runs first, this will just update the user_id
        }
      )

    if (upsertError) {
      console.error('Error upserting subscription for user:', upsertError)
      return NextResponse.json({ error: 'Failed to save subscription details' }, { status: 500 })
    }

    console.log(`Successfully linked subscription ${subscription_id} to user ${user.id}`)
    return NextResponse.json({ success: true, subscription_id })

  } catch (error) {
    console.error('Unexpected error in link-subscription handler:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
