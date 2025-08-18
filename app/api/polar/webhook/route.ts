import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    // TODO: Implement proper signature verification using POLAR_WEBHOOK_SECRET
    // const signature = request.headers.get('polar-signature')
    
    const event = JSON.parse(body)
    console.log('Polar.sh webhook received:', event.type)

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
      { status: 400 }
    )
  }
}

async function handleSubscriptionCreated(subscription: any) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        polar_subscription_id: subscription.id,
        user_id: subscription.customer_id,
        plan_name: subscription.price.product.name || 'Unknown Plan',
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: subscription.created_at,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating subscription in Supabase:', error)
    } else {
      console.log('Subscription created in Supabase:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription.created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan_name: subscription.price.product.name || 'Unknown Plan',
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('polar_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription in Supabase:', error)
    } else {
      console.log('Subscription updated in Supabase:', subscription.id)
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
    // When an order is paid, the subscription is typically created or renewed.
    // Let's ensure the subscription status is active.
    if (order.subscription_id) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('polar_subscription_id', order.subscription_id)

      if (error) {
        console.error('Error updating subscription status after payment:', error)
      } else {
        console.log('Subscription status updated to active after successful payment:', order.subscription_id)
      }
    }

    // Log the successful payment in the payment_history table
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        polar_order_id: order.id, // Using order ID instead of invoice ID
        user_id: order.customer_id,
        amount: order.amount,
        currency: order.currency,
        status: 'succeeded',
        payment_date: order.created_at || new Date().toISOString()
      })

    if (paymentError) {
      console.error('Error logging payment in Supabase:', paymentError)
    } else {
      console.log('Successful payment logged in Supabase for order:', order.id)
    }
  } catch (error) {
    console.error('Error handling order.paid:', error)
  }
}
