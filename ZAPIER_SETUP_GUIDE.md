# Zapier Integration Setup Guide

## Step 1: Supabase Setup

1. **Run the SQL Schema**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the content from `zapier-subscriptions-schema.sql`
   - Click "Run" to create the `subscriptions` table

2. **Get API Credentials**
   - Go to Supabase Dashboard → Settings → API
   - Copy your **Project URL** and **Service Role Key**
   - Keep these safe for Zapier configuration

## Step 2: Polar Setup

1. **Create Subscription Plans**
   - Go to Polar Dashboard → Products → Subscriptions
   - Create your plans (e.g., "monthly", "annual", "pro")
   - Note the plan names - these will be used in Zapier

2. **Get Checkout Links**
   - Create checkout links for each plan
   - Test with a sample user to ensure webhooks fire

## Step 3: Zapier Configuration

### Create the Zap

1. **Trigger Setup**
   - Create new Zap → Trigger: "Webhooks by Zapier"
   - Choose "Catch Hook"
   - Copy the webhook URL Zapier provides

2. **Configure Polar Webhook**
   - Go to Polar → Developers → Webhooks
   - Add new webhook with Zapier URL
   - Select events: `subscription.created`, `subscription.updated`, `subscription.canceled`, `invoice.paid`

3. **Test the Trigger**
   - Subscribe a test user in Polar
   - Verify Zapier receives the webhook data

### Action Setup

1. **Add Action: Custom Request**
   - Action: "Webhooks by Zapier" → "Custom Request"
   - Method: `POST`
   - URL: `https://YOUR_PROJECT.supabase.co/rest/v1/subscriptions`

2. **Headers**
   ```
   apikey: YOUR_SERVICE_ROLE_KEY
   Authorization: Bearer YOUR_SERVICE_ROLE_KEY
   Content-Type: application/json
   Prefer: return=representation
   ```

3. **Body (JSON)**
   ```json
   {
     "email": "{{customer_email}}",
     "polar_customer_id": "{{customer_id}}",
     "plan": "{{plan_name}}",
     "status": "active",
     "start_date": "{{created_at}}",
     "price_id": "{{price_id}}"
   }
   ```

### Field Mapping

Map these Polar webhook fields to Supabase columns:
- `customer.email` → `email`
- `customer.id` → `polar_customer_id`  
- `product.name` or custom field → `plan` (use: "monthly", "annual", "pro")
- `status` → `status`
- `created_at` → `start_date`
- `product.price.id` → `price_id`

## Step 4: Handle Updates (Optional)

### Subscription Cancellation Zap

1. **Trigger**: Polar webhook for `subscription.canceled`
2. **Action**: Custom Request
   - Method: `PATCH`
   - URL: `https://YOUR_PROJECT.supabase.co/rest/v1/subscriptions?polar_customer_id=eq.{{customer_id}}`
   - Body:
   ```json
   {
     "status": "canceled",
     "end_date": "{{canceled_at}}"
   }
   ```

## Step 5: Test the Integration

1. **Test Subscription Creation**
   - Create a test subscription in Polar
   - Verify record appears in Supabase `subscriptions` table
   - Check that `user_id` gets auto-linked if user exists

2. **Test App Integration**
   - Log into your app with the same email
   - Check `/api/get-subscription` returns correct data
   - Verify `/api/campaigns/usage` shows correct limits

## Plan Name Mapping

Your app expects these plan names in the `plan` column:
- `"monthly"` → 3 AR experiences
- `"annual"` → 36 AR experiences  
- `"pro"` → 10 AR experiences

Make sure Zapier maps your Polar plan names to these values.

## Troubleshooting

### Common Issues

1. **User not linked**: Ensure email matches exactly between Polar and your app
2. **Wrong plan limits**: Check plan name mapping in Zapier
3. **Webhook not firing**: Verify webhook URL and selected events in Polar
4. **Permission errors**: Ensure Service Role Key is used in Zapier headers

### Testing Commands

Test your APIs directly:
```bash
# Test subscription fetch
curl -H "Authorization: Bearer YOUR_JWT" https://yourapp.com/api/get-subscription

# Test usage limits  
curl -H "Authorization: Bearer YOUR_JWT" https://yourapp.com/api/campaigns/usage
```

## Environment Variables

No additional environment variables needed - the app now uses the Zapier-managed `subscriptions` table instead of direct Polar integration.

## Migration Notes

- Old `user_subscriptions` table is no longer used
- Polar webhook endpoints (`/api/polar/webhook`, `/api/polar/link-subscription`) can be removed
- Direct Polar API calls are replaced by Zapier automation
