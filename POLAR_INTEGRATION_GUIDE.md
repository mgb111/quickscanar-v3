# 🚀 Polar.sh Integration Guide for QuickScanAR

This guide will walk you through setting up Polar.sh payments and subscriptions in your QuickScanAR application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Polar.sh Setup](#polarsh-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Success URL Configuration](#success-url-configuration)
6. [API Integration](#api-integration)
7. [Webhook Configuration](#webhook-configuration)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

Before starting, ensure you have:

- ✅ QuickScanAR application running
- ✅ Supabase database configured
- ✅ Polar.sh account created
- ✅ Domain with HTTPS enabled (for webhooks)

## 🔧 Polar.sh Setup

### 1. Create Polar.sh Account

1. Go to [polar.sh](https://polar.sh) and sign up
2. Create a new organization for your project
3. Set up your project details

### 2. Configure Subscription Plans

In your Polar.sh dashboard:

1. **Create Products:**
   - Free Plan (0 USD/month)
   - Starter Plan (9.99 USD/month)
   - Professional Plan (49.99 USD/month)
   - Starter Yearly (99.99 USD/year)
   - Professional Yearly (499.99 USD/year)

2. **Set Plan Features:**
   - AR Experience limits
   - Analytics access levels
   - Support tiers
   - Custom branding options

3. **Configure Pricing:**
   - Set amounts in cents (999 = $9.99)
   - Choose billing intervals
   - Set up trial periods if desired

### 3. Get API Credentials

1. Go to **Settings** → **API Keys**
2. Generate a new API key
3. Copy the key and webhook secret
4. Note your organization and project IDs

## 🗄️ Database Setup

### 1. Run Database Schema

Execute the SQL commands from `polar-integration-schema.sql` in your Supabase SQL editor:

```sql
-- Run the entire file in your Supabase SQL editor
-- This creates all necessary tables, policies, and functions
```

### 2. Verify Tables Created

Check that these tables exist:
- `user_subscriptions`
- `subscription_plans`
- `payment_history`
- `usage_tracking`
- `subscription_limits`

### 3. Insert Default Plans

The schema automatically inserts default subscription plans. Verify they exist:

```sql
SELECT * FROM subscription_plans;
```

## ⚙️ Environment Configuration

### 1. Copy Environment Template

```bash
cp env.polar.example .env.local
```

### 2. Fill in Your Values

```env
# Polar.sh API Configuration
POLAR_API_URL=https://api.polar.sh/api/v1
POLAR_API_KEY=your_actual_api_key_here
POLAR_WEBHOOK_SECRET=your_actual_webhook_secret

# Your organization and project IDs
POLAR_ORGANIZATION_ID=your_org_id
POLAR_PROJECT_ID=your_project_id

# Your webhook endpoint
POLAR_WEBHOOK_URL=https://yourdomain.com/api/polar

# Success and Cancel URLs (REQUIRED for Polar.sh)
POLAR_SUCCESS_URL=https://yourdomain.com/subscription/success?checkout_id={CHECKOUT_ID}
POLAR_CANCEL_URL=https://yourdomain.com/subscription/cancel
```

### 3. Restart Your Application

```bash
npm run dev
# or
yarn dev
```

## 🔗 Success URL Configuration

### ⚠️ IMPORTANT: Polar.sh Success URL Requirement

Polar.sh **requires** you to configure a success URL that includes the `{CHECKOUT_ID}` parameter. This allows Polar.sh to pass the checkout ID to your application when a payment is successful.

### 1. Configure in Polar.sh Dashboard

1. Go to your **Polar.sh Dashboard** → **Settings** → **Payment Settings**
2. Set the **Success URL** to: `https://yourdomain.com/subscription/success?checkout_id={CHECKOUT_ID}`
3. Set the **Cancel URL** to: `https://yourdomain.com/subscription/cancel`
4. **Save** your changes

### 2. URL Format Requirements

- **Success URL**: Must include `{CHECKOUT_ID}` exactly as shown
- **Cancel URL**: Can be any URL where users land after cancellation
- **Domain**: Must match your actual domain (no localhost for production)

### 3. Example URLs

```env
# Development (if using ngrok or similar)
POLAR_SUCCESS_URL=https://abc123.ngrok.io/subscription/success?checkout_id={CHECKOUT_ID}
POLAR_CANCEL_URL=https://abc123.ngrok.io/subscription/cancel

# Production
POLAR_SUCCESS_URL=https://quickscanar.com/subscription/success?checkout_id={CHECKOUT_ID}
POLAR_CANCEL_URL=https://quickscanar.com/subscription/cancel
```

### 4. What Happens When Payment Succeeds

1. User completes payment on Polar.sh
2. Polar.sh redirects to: `https://yourdomain.com/subscription/success?checkout_id=ch_1234567890`
3. Your success page receives the `checkout_id` parameter
4. Page displays subscription details and confirmation
5. User can access premium features immediately

## 🔌 API Integration

### 1. API Endpoints Available

The integration provides these endpoints:

- **GET** `/api/polar?action=subscription&userId={id}` - Get user subscription
- **GET** `/api/polar?action=prices` - Get available plans
- **GET** `/api/polar?action=customer&userId={id}` - Get customer info
- **POST** `/api/polar` - Create/update/cancel subscriptions

### 2. Usage Examples

#### Get User Subscription
```typescript
const response = await fetch(`/api/polar?action=subscription&userId=${userId}`)
const { subscription } = await response.json()
```

#### Create Subscription
```typescript
const response = await fetch('/api/polar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_subscription',
    userId: user.id,
    priceId: 'price_pro'
  })
})
```

#### Cancel Subscription
```typescript
const response = await fetch('/api/polar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'cancel_subscription',
    userId: user.id
  })
})
```

## 🔗 Webhook Configuration

### 1. Set Webhook URL in Polar.sh

1. Go to **Settings** → **Webhooks**
2. Add new webhook endpoint: `https://yourdomain.com/api/polar`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Webhook Security

The integration includes webhook signature verification:

```typescript
function verifyWebhookSignature(event: any): boolean {
  // Implement proper signature verification
  // Compare with POLAR_WEBHOOK_SECRET
  return true
}
```

**⚠️ Important:** Implement proper signature verification in production!

## 🧪 Testing

### 1. Test Success URL Configuration

**⚠️ CRITICAL:** Before testing subscriptions, verify your success URL is working:

1. **Check URL Accessibility:**
   ```bash
   # Test if your success page is accessible
   curl https://yourdomain.com/subscription/success?checkout_id=test123
   ```

2. **Verify Parameter Handling:**
   - Visit: `/subscription/success?checkout_id=test123`
   - Ensure the page loads without errors
   - Check that `test123` appears in the checkout ID field

3. **Test Cancel URL:**
   - Visit: `/subscription/cancel`
   - Ensure the page loads properly

### 2. Test Subscription Creation

1. Sign in to your app
2. Go to `/subscription`
3. Try subscribing to a plan
4. Check database for subscription record

### 2. Test Webhooks

1. Use Polar.sh test mode
2. Create test subscriptions
3. Verify webhook events are received
4. Check database updates

### 3. Test Plan Limits

```sql
-- Check if user can create AR experience
SELECT can_create_ar_experience('user-uuid-here');

-- Track feature usage
SELECT track_feature_usage('user-uuid-here', 'ar_experiences', 1);
```

## 🚀 Production Deployment

### 1. Environment Variables

Ensure all production environment variables are set:

```env
POLAR_API_KEY=prod_api_key
POLAR_WEBHOOK_SECRET=prod_webhook_secret
POLAR_WEBHOOK_URL=https://yourdomain.com/api/polar
```

### 2. Webhook Security

Implement proper webhook signature verification:

```typescript
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### 3. Error Handling

Add comprehensive error handling:

```typescript
try {
  // Subscription logic
} catch (error) {
  console.error('Subscription error:', error)
  
  // Log to monitoring service
  // Send alert to team
  // Graceful fallback
  
  return NextResponse.json(
    { error: 'Subscription service temporarily unavailable' },
    { status: 503 }
  )
}
```

### 4. Monitoring

Set up monitoring for:
- Webhook delivery success rates
- API response times
- Error rates
- Subscription creation success rates

## 🔍 Troubleshooting

### Common Issues

#### 1. Success URL Not Working

**Symptoms:**
- Users not redirected after payment
- "Page not found" errors on success
- Checkout ID not received

**Solutions:**
- Verify success URL is set in Polar.sh dashboard
- Ensure `{CHECKOUT_ID}` is included exactly as shown
- Check that your domain is accessible
- Test success page manually with a test checkout ID
- Verify environment variables are set correctly

**Common Mistakes:**
- Missing `{CHECKOUT_ID}` parameter
- Using `localhost` instead of public domain
- Incorrect URL format
- Environment variables not loaded

#### 2. Webhook Not Receiving Events

**Symptoms:**
- No webhook events in logs
- Subscriptions not updating

**Solutions:**
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure HTTPS is enabled
- Test webhook endpoint manually

#### 2. API Key Errors

**Symptoms:**
- 401 Unauthorized errors
- "Invalid API key" messages

**Solutions:**
- Verify API key is correct
- Check API key permissions
- Ensure key is not expired
- Verify organization ID

#### 3. Database Connection Issues

**Symptoms:**
- "Supabase client not available" errors
- Database operation failures

**Solutions:**
- Check Supabase configuration
- Verify database URL and keys
- Check RLS policies
- Test database connection

#### 4. Subscription Not Creating

**Symptoms:**
- Subscription creation fails
- User remains on free plan

**Solutions:**
- Check Polar.sh API response
- Verify price ID exists
- Check customer creation
- Review error logs

### Debug Commands

#### Check Subscription Status
```sql
SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
```

#### Check Plan Limits
```sql
SELECT * FROM subscription_limits WHERE plan_id = (
  SELECT id FROM subscription_plans WHERE polar_price_id = 'price_pro'
);
```

#### Verify Webhook Events
```sql
-- Check if webhooks are being processed
SELECT * FROM user_subscriptions ORDER BY updated_at DESC LIMIT 10;
```

## 📚 Additional Resources

### Documentation
- [Polar.sh API Documentation](https://docs.polar.sh/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Support
- Polar.sh Support: [support@polar.sh](mailto:support@polar.sh)
- QuickScanAR Issues: GitHub repository
- Community: Discord/Forum links

### Monitoring Tools
- [Sentry](https://sentry.io/) - Error tracking
- [LogRocket](https://logrocket.com/) - Session replay
- [DataDog](https://www.datadoghq.com/) - APM monitoring

## 🎉 Success Checklist

- [ ] Polar.sh account created and configured
- [ ] Subscription plans set up with correct pricing
- [ ] API key and webhook secret configured
- [ ] **Success URL configured with {CHECKOUT_ID} parameter**
- [ ] **Cancel URL configured**
- [ ] **Success and cancel pages accessible**
- [ ] Database schema executed successfully
- [ ] Environment variables set correctly
- [ ] Webhook endpoint accessible and secure
- [ ] **Success URL tested with test checkout ID**
- [ ] Test subscriptions working
- [ ] Plan limits enforced correctly
- [ ] Payment processing working
- [ ] Error handling implemented
- [ ] Monitoring configured
- [ ] Production deployment tested

## 🚀 Next Steps

After successful integration:

1. **Customize Plans:** Adjust features and pricing
2. **Add Analytics:** Track subscription metrics
3. **Implement Billing:** Add invoice management
4. **Team Features:** Add collaboration tools
5. **API Access:** Expose subscription APIs
6. **White-label:** Custom branding options

---

**Need Help?** Check the troubleshooting section or reach out to the QuickScanAR community!
