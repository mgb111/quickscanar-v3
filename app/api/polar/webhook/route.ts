import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('polar-signature')
    
    // Verify webhook signature (you should implement proper signature verification)
    // For now, we'll trust the webhook
    
    const event = JSON.parse(body)
    console.log('Polar.sh webhook received:', event.type)

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data)
        break
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data)
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
        user_id: subscription.customer_id, // This now correctly links to the Supabase user ID
        plan_name: subscription.plan_name || 'Unknown Plan',
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_at: subscription.created,
        updated_at: subscription.updated
      })

    if (error) {
      console.error('Error creating subscription in Supabase:', error)
    } else {
      console.log('Subscription created in Supabase:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan_name: subscription.plan_name || 'Unknown Plan',
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: subscription.updated
      })
      .eq('polar_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription in Supabase:', error)
    } else {
      console.log('Subscription updated in Supabase:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
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
      console.error('Error updating subscription status in Supabase:', error)
    } else {
      console.log('Subscription marked as canceled in Supabase:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    // Update subscription status if needed
    if (invoice.subscription_id) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('polar_subscription_id', invoice.subscription_id)

      if (error) {
        console.error('Error updating subscription status after payment:', error)
      } else {
        console.log('Subscription status updated after successful payment:', invoice.subscription_id)
      }
    }

    // Log payment in payment_history table
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        polar_invoice_id: invoice.id,
        user_id: invoice.customer_id, // This now correctly links to the Supabase user ID
        amount: invoice.amount,
        currency: invoice.currency,
        status: 'succeeded',
        payment_date: new Date().toISOString()
      })

    if (paymentError) {
      console.error('Error logging payment in Supabase:', paymentError)
    } else {
      console.log('Payment logged in Supabase:', invoice.id)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    // Update subscription status if needed
    if (invoice.subscription_id) {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('polar_subscription_id', invoice.subscription_id)

      if (error) {
        console.error('Error updating subscription status after failed payment:', error)
      } else {
        console.log('Subscription status updated after failed payment:', invoice.subscription_id)
      }
    }

    // Log failed payment
    const { error: paymentError } = await supabase
      .from('payment_history')
      .insert({
        polar_invoice_id: invoice.id,
        user_id: invoice.customer_id, // This now correctly links to the Supabase user ID
        amount: invoice.amount,
        currency: invoice.currency,
        status: 'failed',
        payment_date: new Date().toISOString()
      })

    if (paymentError) {
      console.error('Error logging failed payment in Supabase:', paymentError)
    } else {
      console.log('Failed payment logged in Supabase:', invoice.id)
    }
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}
