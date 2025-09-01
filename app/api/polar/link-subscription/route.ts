import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Polar API envs (ensure these are set in your environment)
const POLAR_API_URL = process.env.POLAR_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.polar.sh/api/v1' : 'https://sandbox-api.polar.sh/v1')
const POLAR_API_KEY = process.env.POLAR_API_KEY

export async function POST(request: NextRequest) {
  const { checkout_id } = await request.json()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (!checkout_id || typeof checkout_id !== 'string') {
    return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
  }

  // We'll proceed even if POLAR_API_KEY is missing, but we won't be able to fetch checkout details.

  try {
    // Try to identify the user from auth cookie if possible; optional for service role
    let authedUserId: string | null = null
    try {
      const { data } = await supabase.auth.getUser()
      authedUserId = data?.user?.id ?? null
    } catch {}

    // 1. Fetch checkout session from Polar to get subscription and customer IDs
    let subscription_id: string | null = null
    let customer_id: string | null = null
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
        return NextResponse.json({ error: 'Failed to fetch checkout details from Polar' }, { status: polarResponse.status })
      }

      const checkoutSession = await polarResponse.json()
      subscription_id = checkoutSession.subscription_id
      customer_id = checkoutSession.customer_id
    }

    if (!subscription_id || !customer_id) {
      console.error('Checkout session is missing subscription_id or customer_id', { checkout_id })
      return NextResponse.json({ error: 'Invalid checkout session data' }, { status: 400 })
    }

    // 2. Upsert the subscription details into our database, linking it to the user
    const { error: upsertError } = await supabase
      .from('user_subscriptions')
      .upsert(
        {
          user_id: authedUserId,
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

    console.log(`Successfully linked subscription ${subscription_id} to user ${authedUserId}`)
    return NextResponse.json({ success: true, subscription_id })

  } catch (error) {
    console.error('Unexpected error in link-subscription handler:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
