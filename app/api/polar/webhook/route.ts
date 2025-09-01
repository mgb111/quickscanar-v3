import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use the available environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables for Polar webhook')
}

// Note: Schema does not include a plan_name column; we avoid storing it.

// Polar API envs (support sandbox vs prod via env; default to sandbox in non-production)
// Note: Polar moved API root from /api/v1 to /v1. Use /v1 for production by default.
const POLAR_API_URL = process.env.POLAR_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.polar.sh/v1' : 'https://sandbox-api.polar.sh/v1')
const POLAR_API_KEY = process.env.POLAR_API_KEY

async function fetchPolarCustomerUserId(polarCustomerId: string): Promise<string | null> {
  try {
    if (!POLAR_API_KEY) {
      return null
    }
    const resp = await fetch(`${POLAR_API_URL}/customers/${polarCustomerId}`, {
      headers: {
        Authorization: `Bearer ${POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    if (!resp.ok) return null
    const customer = await resp.json()
    const userId = customer?.metadata?.user_id || customer?.metadata?.supabase_user_id || null
    return typeof userId === 'string' ? userId : null
  } catch (e) {
    console.warn('fetchPolarCustomerUserId failed:', e)
    return null
  }
}

// Helper function to get price_id from subscription data
function extractPriceId(subscription: any): string {
  return subscription?.price?.id 
    || subscription?.price_id 
    || subscription?.price?.polar_price_id
    || subscription?.product_price_id
    || 'unknown'
}

// Helper function to get user_id from checkout session
async function getUserIdFromCheckout(checkoutId: string): Promise<string | null> {
  if (!POLAR_API_KEY) return null
  
  try {
    const resp = await fetch(`${POLAR_API_URL}/checkouts/${checkoutId}`, {
      headers: {
        Authorization: `Bearer ${POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    if (!resp.ok) return null
    const checkout = await resp.json()
    return checkout?.metadata?.user_id || checkout?.metadata?.supabase_user_id || null
  } catch (e) {
    console.warn('getUserIdFromCheckout failed:', e)
    return null
  }
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// Helper: resolve our auth user_id from a Polar customer_id stored in DB
async function resolveUserIdByPolarCustomerId(polarCustomerId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('polar_customer_id', polarCustomerId)
      .maybeSingle?.() ?? { data: null, error: null }

    if ((error as any)?.code && (error as any).code !== 'PGRST116') {
      console.error('Error resolving user by polar_customer_id:', error)
      return null
    }
    return (data as any)?.user_id ?? null
  } catch (e) {
    console.error('Unexpected error resolving user by polar_customer_id:', e)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const event = JSON.parse(body)
    
    console.log(`[WEBHOOK] Received event: ${event.type} at ${new Date().toISOString()}`)
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured for Polar webhook')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      )
    }

    // TODO: Implement proper signature verification using POLAR_WEBHOOK_SECRET
    // const signature = request.headers.get('polar-signature')
    console.log('Polar.sh webhook received:', event.type)
    // Minimal IDs to help correlate in logs
    try {
      console.log('Payload IDs snapshot:', {
        subscription_id: event?.data?.id || event?.data?.subscription_id,
        customer_id: event?.data?.customer_id,
        order_id: event?.data?.id,
      })
    } catch {}

    switch (event.type) {
      // Subscription events
      case 'subscription.created':
        await handleSubscriptionCreated(event.data)
        break
      case 'subscription.updated':
      case 'subscription.active':
        await handleSubscriptionUpdated(event.data)
        break
      case 'subscription.canceled':
      case 'subscription.revoked':
        await handleSubscriptionDeleted(event.data)
        break
      
      // Order/Payment events
      case 'order.paid':
        await handlePaymentSucceeded(event.data)
        break
      case 'order.updated':
        // This event can signify many things. We might handle payment failures here.
        // For now, let's just log it to see the payload.
        console.log('Order updated event received:', JSON.stringify(event.data, null, 2))
        break
      
      default:
        console.log('Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 503 }
    )
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('Processing subscription.created:', subscription.id)
    
    // Resolve user_id: check top-level, then DB, then Polar customer metadata
    let resolvedUserId = subscription.user_id
    if (!resolvedUserId) {
      resolvedUserId = await resolveUserIdByPolarCustomerId(subscription.customer_id)
    }
    if (!resolvedUserId) {
      // Try to fetch from Polar customer metadata as a fallback
      resolvedUserId = await fetchPolarCustomerUserId(subscription.customer_id)
    }
    
    // If still no user_id, try to get it from checkout metadata
    if (!resolvedUserId && subscription.checkout_id) {
      resolvedUserId = await getUserIdFromCheckout(subscription.checkout_id)
    }
    
    const priceId = extractPriceId(subscription)
    console.log('Extracted price_id:', priceId, 'for subscription:', subscription.id)
    
    const record: any = {
      polar_subscription_id: subscription.id,
      polar_customer_id: subscription.customer_id,
      price_id: priceId, // REQUIRED by schema (NOT NULL)
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      canceled_at: null, // schema uses canceled_at TIMESTAMPTZ
      created_at: subscription.created_at,
      updated_at: new Date().toISOString()
    }
    if (resolvedUserId) {
      record.user_id = resolvedUserId
      console.log('Linking subscription to user:', resolvedUserId)
    } else {
      console.warn('No user_id found for subscription:', subscription.id, 'customer:', subscription.customer_id)
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(record, { onConflict: 'polar_subscription_id' })

    if (error) {
      console.error('Error creating subscription in Supabase:', error)
    } else {
      console.log('Subscription created in Supabase:', subscription.id, 'linked to user:', resolvedUserId || 'none')
    }
  } catch (error) {
    console.error('Error handling subscription.created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('Processing subscription.updated:', subscription.id)
    
    // Resolve user_id if possible for backfill
    let resolvedUserId = subscription.user_id
    if (!resolvedUserId) {
      resolvedUserId = await resolveUserIdByPolarCustomerId(subscription.customer_id)
    }
    if (!resolvedUserId) {
      resolvedUserId = await fetchPolarCustomerUserId(subscription.customer_id)
    }
    
    // If still no user_id, try to get it from checkout metadata
    if (!resolvedUserId && subscription.checkout_id) {
      resolvedUserId = await getUserIdFromCheckout(subscription.checkout_id)
    }
    
    const priceId = extractPriceId(subscription)
    console.log('Updated subscription price_id:', priceId, 'status:', subscription.status)

    const record: any = {
      polar_subscription_id: subscription.id,
      polar_customer_id: subscription.customer_id,
      price_id: priceId, // REQUIRED by schema (NOT NULL)
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      // keep canceled_at null unless we explicitly get a cancel event
      canceled_at: subscription.canceled_at || null,
      updated_at: new Date().toISOString()
    }
    if (resolvedUserId) {
      record.user_id = resolvedUserId
      console.log('Updating subscription for user:', resolvedUserId)
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(record, { onConflict: 'polar_subscription_id' })

    if (error) {
      console.error('Error upserting subscription in Supabase:', error)
    } else {
      console.log('Subscription upserted in Supabase:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription.updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('polar_subscription_id', subscription.id)

    if (error) {
      console.error('Error marking subscription as canceled in Supabase:', error)
    } else {
      console.log('Subscription marked as canceled in Supabase:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription.canceled:', error)
  }
}

async function handlePaymentSucceeded(order: any) {
  try {
    console.log('Processing order.paid:', order.id, 'subscription:', order.subscription_id)
    
    // When an order is paid, the subscription is typically created or renewed.
    if (order.subscription_id) {
      let resolvedUserId = order.customer_id ? await resolveUserIdByPolarCustomerId(order.customer_id) : null
      if (!resolvedUserId && order.customer_id) {
        resolvedUserId = await fetchPolarCustomerUserId(order.customer_id)
      }
      
      // If still no user_id, try to get it from checkout metadata
      if (!resolvedUserId && order.checkout_id) {
        resolvedUserId = await getUserIdFromCheckout(order.checkout_id)
      }
      
      console.log('Payment succeeded for user:', resolvedUserId, 'subscription:', order.subscription_id)

      // Get the price_id from the order or subscription
      const priceId = extractPriceId(order) !== 'unknown' ? extractPriceId(order) : 'price_monthly' // default fallback
      
      // Ensure the row exists with proper price_id: upsert if missing or to backfill user/customer
      const upsertRecord: any = {
        polar_subscription_id: order.subscription_id,
        polar_customer_id: order.customer_id,
        price_id: priceId, // REQUIRED by schema
        status: 'active',
        updated_at: new Date().toISOString()
      }
      if (resolvedUserId) upsertRecord.user_id = resolvedUserId

      const { error: upsertErr } = await supabase
        .from('user_subscriptions')
        .upsert(upsertRecord, { onConflict: 'polar_subscription_id' })

      if (upsertErr) {
        console.error('Error upserting subscription after payment:', upsertErr)
      } else {
        console.log('Subscription ensured active after payment:', order.subscription_id, 'user:', resolvedUserId)
      }

      // If we resolved a user and the row is missing user_id, try to set it
      if (resolvedUserId) {
        try {
          await supabase
            .from('user_subscriptions')
            .update({ user_id: resolvedUserId })
            .is('user_id', null as any)
            .eq('polar_subscription_id', order.subscription_id)
        } catch (e) {
          console.warn('Unable to backfill user_id on user_subscriptions:', e)
        }
      }
    }

    // Log the successful payment in the payment_history table
    let resolvedUserId = order.customer_id ? await resolveUserIdByPolarCustomerId(order.customer_id) : null
    if (!resolvedUserId && order.customer_id) {
      resolvedUserId = await fetchPolarCustomerUserId(order.customer_id)
    }
    if (!resolvedUserId && order.checkout_id) {
      resolvedUserId = await getUserIdFromCheckout(order.checkout_id)
    }
    
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        polar_order_id: order.id,
        user_id: resolvedUserId,
        amount: order.amount,
        currency: order.currency,
        status: 'succeeded',
        payment_date: order.created_at || new Date().toISOString()
      })

    if (paymentError) {
      console.error('Error logging payment in Supabase:', paymentError)
    } else {
      console.log('Payment logged for user:', resolvedUserId, 'order:', order.id)
    }
  } catch (error) {
    console.error('Error handling order.paid:', error)
  }
}
