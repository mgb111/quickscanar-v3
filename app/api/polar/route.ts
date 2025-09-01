import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use the available environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables for Polar API')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

// Polar.sh API configuration (default to sandbox in non-production)
const POLAR_API_URL = process.env.POLAR_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.polar.sh/api/v1' : 'https://sandbox-api.polar.sh/v1')
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET
const POLAR_SUCCESS_URL = process.env.POLAR_SUCCESS_URL || 'https://yourdomain.com/subscription/success?checkout_id={CHECKOUT_ID}'
const POLAR_CANCEL_URL = process.env.POLAR_CANCEL_URL || 'https://yourdomain.com/subscription/cancel'

interface PolarSubscription {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  customer: {
    id: string
    email: string
    name?: string
  }
  price: {
    id: string
    unit_amount: number
    currency: string
    recurring: {
      interval: 'month' | 'year'
    }
  }
}

interface PolarWebhookEvent {
  type: string
  data: any
  created: number
}

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured for Polar API')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    switch (action) {
      case 'health':
        return NextResponse.json({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          polarApiKey: !!process.env.POLAR_API_KEY,
          polarApiUrl: POLAR_API_URL
        })
      case 'subscription':
        return await getSubscription(userId)
      case 'prices':
        return await getPrices()
      case 'customer':
        return await getCustomer(userId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Polar API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured for Polar API')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, userId, priceId, customerId } = body

    switch (action) {
      case 'create_subscription':
        return await createSubscription(userId, priceId)
      case 'cancel_subscription':
        return await cancelSubscription(userId)
      case 'update_subscription':
        return await updateSubscription(userId, priceId)
      case 'webhook':
        return await handleWebhook(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Polar API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 503 }
    )
  }
}

async function getSubscription(userId: string) {
  try {
    // Get user's subscription from database
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    // Fetch latest data from Polar.sh
    const polarResponse = await fetch(`${POLAR_API_URL}/subscriptions/${subscription.polar_subscription_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (polarResponse.ok) {
      const polarData = await polarResponse.json()
      
      // Update local database with latest data
      await supabase
        .from('user_subscriptions')
        .update({
          status: polarData.status,
          current_period_end: polarData.current_period_end,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      return NextResponse.json({ subscription: { ...subscription, ...polarData } })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

async function getPrices() {
  try {
    console.log('🔍 getPrices called - POLAR_API_KEY exists:', !!process.env.POLAR_API_KEY)
    console.log('🔍 POLAR_API_URL:', POLAR_API_URL)
    
    // Check if API key exists
    if (!process.env.POLAR_API_KEY) {
      console.error('❌ POLAR_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'Polar.sh API key not configured' },
        { status: 500 }
      )
    }

    // Fetch available pricing tiers from Polar.sh
    console.log('📡 Fetching from:', `${POLAR_API_URL}/prices`)
    const response = await fetch(`${POLAR_API_URL}/prices`, {
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Polar.sh API error:', response.status, errorText)
      throw new Error(`Failed to fetch prices from Polar.sh: ${response.status} ${errorText}`)
    }

    const prices = await response.json()
    console.log('✅ Raw prices from Polar.sh:', prices)
    
    // Filter and format prices for QuickScanAR
    const formattedPrices = prices.data
      .filter((price: any) => price.active)
      .map((price: any) => ({
        id: price.id,
        name: price.nickname || `AR Experience Plan`,
        amount: price.unit_amount / 100, // Convert from cents
        currency: price.currency.toUpperCase(),
        interval: price.recurring.interval,
        features: getFeaturesForPrice(price.unit_amount, price.recurring.interval),
        description: getDescriptionForPrice(price.unit_amount, price.recurring.interval)
      }))

    console.log('🎯 Formatted prices:', formattedPrices)
    return NextResponse.json({ prices: formattedPrices })
  } catch (error) {
    console.error('💥 Error in getPrices:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch pricing information', details: errorMessage },
      { status: 500 }
    )
  }
}

async function getCustomer(userId: string) {
  try {
    // Get user's customer ID from database
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('polar_customer_id')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!subscription?.polar_customer_id) {
      return NextResponse.json({ customer: null })
    }

    // Fetch customer data from Polar.sh
    const response = await fetch(`${POLAR_API_URL}/customers/${subscription.polar_customer_id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch customer from Polar.sh')
    }

    const customer = await response.json()
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer information' },
      { status: 500 }
    )
  }
}

async function createSubscription(userId: string, priceId: string) {
  try {
    // Get user information
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError) throw userError

    // Create customer in Polar.sh if doesn't exist
    let customerId = await getOrCreateCustomer(userId, user.user)

    // Create subscription in Polar.sh
    const subscriptionResponse = await fetch(`${POLAR_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        success_url: POLAR_SUCCESS_URL,
        cancel_url: POLAR_CANCEL_URL
      })
    })

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json()
      throw new Error(error.message || 'Failed to create subscription')
    }

    const subscription = await subscriptionResponse.json()

    // Save subscription to database
    const { error: dbError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        polar_subscription_id: subscription.id,
        polar_customer_id: customerId,
        price_id: priceId,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) throw dbError

    return NextResponse.json({ 
      subscription,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

async function cancelSubscription(userId: string) {
  try {
    // Get subscription from database
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('polar_subscription_id')
      .eq('user_id', userId)
      .single()

    if (error || !subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Cancel subscription in Polar.sh
    const response = await fetch(`${POLAR_API_URL}/subscriptions/${subscription.polar_subscription_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to cancel subscription in Polar.sh')
    }

    // Update local database
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

async function updateSubscription(userId: string, newPriceId: string) {
  try {
    // Get current subscription
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('polar_subscription_id')
      .eq('user_id', userId)
      .single()

    if (error || !subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Update subscription in Polar.sh
    const response = await fetch(`${POLAR_API_URL}/subscriptions/${subscription.polar_subscription_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{ price: newPriceId }],
        proration_behavior: 'create_prorations'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to update subscription in Polar.sh')
    }

    const updatedSubscription = await response.json()

    // Update local database
    await supabase
      .from('user_subscriptions')
      .update({
        price_id: newPriceId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return NextResponse.json({ subscription: updatedSubscription })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

async function handleWebhook(event: PolarWebhookEvent) {
  try {
    // Verify webhook signature
    if (!verifyWebhookSignature(event)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const { type, data } = event

    switch (type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(data)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeletion(data)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(data)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailure(data)
        break
      default:
        console.log(`Unhandled webhook event: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: PolarSubscription) {
  // Update subscription in database
  await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('polar_subscription_id', subscription.id)
}

async function handleSubscriptionDeletion(subscription: PolarSubscription) {
  // Mark subscription as canceled in database
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('polar_subscription_id', subscription.id)
}

async function handlePaymentSuccess(invoice: any) {
  // Handle successful payment
  console.log('Payment succeeded:', invoice.id)
}

async function handlePaymentFailure(invoice: any) {
  // Handle failed payment
  console.log('Payment failed:', invoice.id)
}

async function getOrCreateCustomer(userId: string, user: any): Promise<string> {
  // Check if customer already exists
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('polar_customer_id')
    .eq('user_id', userId)
    .single()

  if (existingSubscription?.polar_customer_id) {
    return existingSubscription.polar_customer_id
  }

  // Create new customer in Polar.sh
  const response = await fetch(`${POLAR_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.POLAR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      metadata: {
        user_id: userId
      }
    })
  })

  if (!response.ok) {
    throw new Error('Failed to create customer in Polar.sh')
  }

  const customer = await response.json()
  return customer.id
}

function verifyWebhookSignature(event: any): boolean {
  // Implement webhook signature verification
  // This is a simplified version - implement proper verification in production
  return true
}

function getFeaturesForPrice(amount: number, interval: string): string[] {
  const baseFeatures = ['AR Experience Creation', 'Analytics Dashboard', 'Basic Support']
  
  if (amount >= 4999) { // $49.99+
    return [...baseFeatures, 'Unlimited AR Experiences', 'Advanced Analytics', 'Priority Support', 'Custom Branding']
  } else if (amount >= 999) { // $9.99+
    return [...baseFeatures, 'Up to 10 AR Experiences', 'Standard Analytics', 'Email Support']
  }
  
  return baseFeatures
}

function getDescriptionForPrice(amount: number, interval: string): string {
  const price = (amount / 100).toFixed(2)
  const intervalText = interval === 'month' ? 'monthly' : 'yearly'
  
  if (amount >= 4999) {
    return `Professional plan for businesses and agencies. ${price}/${intervalText}`
  } else if (amount >= 999) {
    return `Standard plan for growing creators. ${price}/${intervalText}`
  }
  
  return `Free plan for getting started. ${price}/${intervalText}`
}
