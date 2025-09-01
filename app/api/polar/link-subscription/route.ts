import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const POLAR_API_URL = process.env.POLAR_API_URL || 'https://api.polar.sh'
const POLAR_API_KEY = process.env.POLAR_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const key = ip
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

export async function POST(request: NextRequest) {
  console.log('Link subscription API called at:', new Date().toISOString())
  
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    const body = await request.json()
    const { checkout_id, user_id: bodyUserId } = body
    
    console.log('Link subscription request:', { checkout_id, bodyUserId })
    
    if (!checkout_id) {
      return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    let authedUserId: string | null = bodyUserId || authUser?.id || null
    
    if (!authedUserId) {
      return NextResponse.json({ error: 'User authentication required' }, { status: 401 })
    }
    
    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    
    // Fetch checkout session from Polar API
    if (!POLAR_API_KEY) {
      return NextResponse.json({ error: 'Polar API not configured' }, { status: 503 })
    }

    console.log('Fetching checkout session from Polar API...')
    const polarResponse = await fetch(`${POLAR_API_URL}/checkouts/${checkout_id}`, {
      headers: {
        Authorization: `Bearer ${POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!polarResponse.ok) {
      const errorBody = await polarResponse.text()
      console.error(`Failed to fetch Polar checkout ${checkout_id}:`, errorBody)
      
      if (polarResponse.status === 404) {
        return NextResponse.json({ error: 'Checkout session not found or expired' }, { status: 404 })
      }
      
      return NextResponse.json({ error: 'Failed to fetch checkout session' }, { status: 500 })
    }

    const checkoutSession = await polarResponse.json()
    console.log('Checkout session data:', JSON.stringify(checkoutSession, null, 2))

    // Extract subscription details - try multiple possible paths
    const subscription_id = checkoutSession?.subscription_id || 
                           checkoutSession?.subscription?.id ||
                           checkoutSession?.data?.subscription_id ||
                           checkoutSession?.data?.subscription?.id

    const customer_id = checkoutSession?.customer_id || 
                       checkoutSession?.customer?.id ||
                       checkoutSession?.data?.customer_id ||
                       checkoutSession?.data?.customer?.id

    const price_id = checkoutSession?.product_price?.id || 
                     checkoutSession?.price?.id || 
                     checkoutSession?.product?.price_id ||
                     checkoutSession?.data?.product_price?.id ||
                     checkoutSession?.data?.price?.id ||
                     checkoutSession?.line_items?.[0]?.price?.id ||
                     'unknown'

    console.log('Extracted data:', { subscription_id, customer_id, price_id })
    console.log('Full checkout session structure:', JSON.stringify(checkoutSession, null, 2))

    if (!subscription_id) {
      // If no subscription_id, check if this is a one-time payment or different structure
      console.warn('No subscription_id found. Checkout session might be for one-time payment or different structure')
      
      // Try to create a manual subscription record if we have enough data
      if (customer_id && price_id !== 'unknown') {
        console.log('Attempting to create manual subscription record...')
        
        const manualSubscriptionId = `manual_${checkout_id}_${Date.now()}`
        const upsertData = {
          polar_subscription_id: manualSubscriptionId,
          polar_customer_id: customer_id,
          user_id: authedUserId,
          price_id: price_id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: manualError } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert(upsertData, { onConflict: 'polar_subscription_id' })

        if (manualError) {
          console.error('Failed to create manual subscription:', manualError)
          return NextResponse.json({ error: 'Failed to create subscription record' }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Manual subscription created successfully',
          subscription_id: manualSubscriptionId,
          user_id: authedUserId,
          price_id: price_id,
          type: 'manual'
        })
      }
      
      return NextResponse.json({ error: 'No subscription found in checkout session' }, { status: 400 })
    }

    // Check if subscription already exists and is linked to a different user
    const { data: existingSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('polar_subscription_id', subscription_id)
      .maybeSingle()

    if (existingSub && existingSub.user_id && existingSub.user_id !== authedUserId) {
      console.warn(`Subscription ${subscription_id} already linked to user ${existingSub.user_id}`)
      return NextResponse.json({ error: 'Subscription already linked to another user' }, { status: 409 })
    }

    // Upsert subscription record with database transaction
    const upsertData = {
      polar_subscription_id: subscription_id,
      polar_customer_id: customer_id,
      user_id: authedUserId,
      price_id: price_id,
      status: 'active',
      updated_at: new Date().toISOString()
    }

    const { data: upsertResult, error: upsertError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(upsertData, { onConflict: 'polar_subscription_id' })
      .select()

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError)
      return NextResponse.json({ error: 'Failed to link subscription' }, { status: 500 })
    }

    console.log(`Successfully linked subscription ${subscription_id} to user ${authedUserId}`)

    // Verify the link worked
    const { data: verification } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('polar_subscription_id', subscription_id)
      .eq('user_id', authedUserId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      message: 'Subscription linked successfully',
      subscription_id: subscription_id,
      user_id: authedUserId,
      price_id: price_id,
      verification: verification ? 'YES' : 'NO'
    })

  } catch (error) {
    console.error('Error in link-subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
