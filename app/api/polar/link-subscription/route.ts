import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Polar API envs (ensure these are set in your environment)
// Note: Polar moved API root from /api/v1 to /v1.
const POLAR_API_URL = process.env.POLAR_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.polar.sh/v1' : 'https://sandbox-api.polar.sh/v1')
const POLAR_API_KEY = process.env.POLAR_API_KEY

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { checkout_id, user_id: bodyUserId, polar_subscription_id: bodySubId, polar_customer_id: bodyCustId } = body || {}
  
  // Use service role client for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
  
  // Also get user from auth context
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!checkout_id || typeof checkout_id !== 'string') {
    return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
  }

  // We'll proceed even if POLAR_API_KEY is missing/invalid; we'll rely on webhook or provided IDs.

  try {
    // Try to identify the user from auth cookie if possible
    let authedUserId: string | null = bodyUserId || authUser?.id || null
    console.log('Link subscription - User ID:', authedUserId, 'Checkout ID:', checkout_id)
    
    if (!authedUserId) {
      console.warn('No user ID found for linking subscription')
    }

    // 1. Determine subscription and customer IDs
    let subscription_id: string | null = bodySubId || null
    let customer_id: string | null = bodyCustId || null
    let checkoutSession: any = null
    let price_id: string = 'unknown'
    
    if (!subscription_id || !customer_id) {
      if (POLAR_API_KEY) {
        console.log('Fetching checkout session from Polar API...')
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

        checkoutSession = await polarResponse.json()
        console.log('Checkout session data from Polar:', JSON.stringify(checkoutSession, null, 2))
        console.log('Available fields:', Object.keys(checkoutSession))
        subscription_id = checkoutSession.subscription_id
        customer_id = checkoutSession.customer_id
        price_id = checkoutSession.product_price_id || checkoutSession.price_id || 'unknown'
        
        // If user_id is in checkout metadata, use it
        if (!authedUserId && checkoutSession.metadata?.user_id) {
          authedUserId = checkoutSession.metadata.user_id
          console.log('Found user_id in checkout metadata:', authedUserId)
        }
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
              
              // Also extract the price_id and other details we'll need for the database
              const subscriptionDetails = {
                id: latestSubscription.id,
                price_id: latestSubscription.price_id,
                status: latestSubscription.status,
                current_period_start: latestSubscription.current_period_start,
                current_period_end: latestSubscription.current_period_end,
                amount: latestSubscription.amount,
                currency: latestSubscription.currency
              }
              console.log('Subscription details:', subscriptionDetails)
              price_id = latestSubscription.price_id || 'unknown'
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
    console.log('Linking subscription:', subscription_id, 'to user:', authedUserId, 'with price_id:', price_id)
    
    // Build the row; only include user_id when we have it
    const upsertRow: Record<string, any> = {
      polar_subscription_id: subscription_id,
      polar_customer_id: customer_id,
      price_id: price_id, // REQUIRED by schema (NOT NULL)
      status: 'active', // Set to active since we found an active subscription
      updated_at: new Date().toISOString(),
    }
    if (authedUserId) upsertRow.user_id = authedUserId

    const { error: upsertError } = await supabaseAdmin
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
    
    // Verify the link was successful
    if (authedUserId) {
      const { data: verifyData } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', authedUserId)
        .eq('polar_subscription_id', subscription_id)
        .maybeSingle()
      
      console.log('Verification - subscription linked:', verifyData ? 'YES' : 'NO')
    }
    
    return NextResponse.json({ 
      success: true, 
      subscription_id, 
      linked: true, 
      user_id: authedUserId,
      price_id 
    })

  } catch (error) {
    console.error('Unexpected error in link-subscription handler:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
