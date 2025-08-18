# Polar.sh + Supabase Integration Guide

This guide explains how to integrate Polar.sh subscription management with your Supabase database for QuickScanAR.

## Overview

The integration consists of:
1. **Frontend**: Polar.sh checkout buttons with embedded checkout
2. **Backend**: Webhook handler for subscription events
3. **Database**: Supabase tables for storing subscription data
4. **Real-time updates**: Subscription status synchronization

## Setup Steps

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Polar.sh Configuration
POLAR_API_KEY=your_polar_api_key_here
POLAR_API_URL=https://api.polar.sh/api/v1
POLAR_WEBHOOK_SECRET=your_webhook_secret_here

# Polar.sh Checkout URLs
POLAR_MONTHLY_CHECKOUT_URL=https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d
POLAR_YEARLY_CHECKOUT_URL=https://buy.polar.sh/polar_cl_uJCvGJRiHoQ9Y1fNO8c8aSlVofV5iTlzVtlaQ3hUriO

# Success and Cancel URLs
POLAR_SUCCESS_URL=https://quickscanar.com/subscription/success?checkout_id={CHECKOUT_ID}
POLAR_CANCEL_URL=https://quickscanar.com/subscription/cancel

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 2. Database Schema

Run the `polar-integration-schema.sql` file in your Supabase SQL editor to create the necessary tables:

- `user_subscriptions` - Stores subscription information
- `subscription_plans` - Available subscription plans
- `payment_history` - Payment transaction logs
- `usage_tracking` - Feature usage tracking
- `subscription_limits` - Plan-specific limits

### 3. Webhook Configuration

In your Polar.sh dashboard:

1. Go to **Settings** → **Webhooks**
2. Add a new webhook endpoint: `https://quickscanar.com/api/polar/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

### 4. Frontend Integration

The checkout buttons are already integrated in:
- **Main page** (`/`): Monthly and yearly plan buttons
- **Subscription page** (`/subscription`): All plan options
- **PricingCard component**: Individual plan cards

Each paid plan button includes:
```html
<a href="[POLAR_CHECKOUT_URL]" 
   data-polar-checkout 
   data-polar-checkout-theme="dark">
  Subscribe Now
</a>
```

### 5. Backend Webhook Handler

The webhook handler (`/api/polar/webhook`) automatically:
- Creates/updates subscription records in Supabase
- Logs payment transactions
- Updates subscription statuses
- Handles failed payments

## How It Works

### 1. User Flow
1. User clicks a subscription button
2. Polar.sh checkout opens in a new window
3. User completes payment
4. Polar.sh redirects to success page with `checkout_id`
5. Webhook updates Supabase database
6. User's subscription is immediately active

### 2. Webhook Flow
1. Polar.sh sends webhook to `/api/polar/webhook`
2. Webhook handler processes the event
3. Supabase database is updated accordingly
4. User's subscription status is synchronized

### 3. Database Updates
- **Subscription Created**: New record in `user_subscriptions`
- **Payment Success**: Status updated to 'active'
- **Payment Failed**: Status updated to 'past_due'
- **Subscription Cancelled**: Status updated to 'canceled'

## Testing the Integration

### 1. Test Webhook
```bash
curl -X POST https://quickscanar.com/api/polar/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{"id":"test"}}'
```

### 2. Test Checkout
1. Visit the subscription page
2. Click on a paid plan
3. Verify Polar.sh checkout opens
4. Check webhook logs in your server

### 3. Monitor Database
Check Supabase tables for:
- New subscription records
- Payment history entries
- Status updates

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret matches
   - Check server logs for errors

2. **Checkout not opening**
   - Ensure Polar.sh script is loaded
   - Check checkout URLs are correct
   - Verify `data-polar-checkout` attributes

3. **Database not updating**
   - Check Supabase service role key
   - Verify table permissions
   - Check webhook handler logs

### Debug Steps

1. **Check webhook logs**:
   ```bash
   # In your server logs
   grep "Polar.sh webhook" your_logs.log
   ```

2. **Verify database connection**:
   ```bash
   # Test Supabase connection
   curl "https://your-project.supabase.co/rest/v1/user_subscriptions" \
     -H "apikey: YOUR_ANON_KEY"
   ```

3. **Test individual components**:
   - Test webhook endpoint separately
   - Verify Polar.sh checkout URLs
   - Check environment variables

## Security Considerations

1. **Webhook Verification**: Implement proper signature verification
2. **Service Role Key**: Keep Supabase service role key secure
3. **Rate Limiting**: Add rate limiting to webhook endpoint
4. **Input Validation**: Validate all webhook data before processing

## Monitoring

Set up monitoring for:
- Webhook delivery success/failure rates
- Database update success rates
- Payment processing errors
- Subscription status changes

## Support

For issues with:
- **Polar.sh**: Check their documentation and support
- **Supabase**: Check their documentation and community
- **Integration**: Review this guide and check server logs

## Next Steps

After successful integration:
1. Set up subscription analytics
2. Implement usage tracking
3. Add subscription management UI
4. Set up automated billing reminders
5. Implement subscription upgrades/downgrades
