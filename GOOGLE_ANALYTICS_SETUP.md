# Google Analytics Setup Guide for QuickScanAR

This guide will walk you through setting up Google Analytics 4 (GA4) for your Next.js application.

## Prerequisites

- A Google account
- Access to Google Analytics
- Your Next.js application running

## Step 1: Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring" or sign in to your existing account
3. Click "Create Property"
4. Enter your property details:
   - Property name: `QuickScanAR`
   - Reporting time zone: Choose your timezone
   - Currency: Choose your preferred currency
5. Click "Next"
6. Choose your business objectives (select all that apply):
   - Generate leads
   - Drive online sales
   - Provide customer support
   - Build brand awareness
7. Click "Next"
8. Choose your business size and category
9. Click "Create"

## Step 2: Set Up Data Stream

1. After creating the property, click "Web" under "Data streams"
2. Enter your website details:
   - Website URL: `https://yourdomain.com` (or your actual domain)
   - Stream name: `QuickScanAR Website`
3. Click "Create stream"

## Step 3: Get Your Measurement ID

1. After creating the stream, you'll see your Measurement ID
2. It will look like: `G-XXXXXXXXXX`
3. Copy this ID - you'll need it for the next step

## Step 4: Configure Environment Variables

1. Create or update your `.env.local` file in your project root
2. Add the following line:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
3. Replace `G-XXXXXXXXXX` with your actual Measurement ID

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Open your website in a browser
3. Open Developer Tools (F12)
4. Go to the Network tab
5. Look for requests to `googletagmanager.com`
6. You should see analytics data being sent

## Step 6: Verify in Google Analytics

1. Go back to your Google Analytics dashboard
2. Navigate to "Reports" → "Realtime" → "Overview"
3. Visit your website
4. You should see your visit appear in real-time data

## What's Being Tracked

### Automatic Tracking
- **Page Views**: Every page navigation is automatically tracked
- **User Sessions**: Session duration and user engagement
- **Device Information**: Browser, device type, operating system
- **Geographic Data**: Country, city of visitors
- **Traffic Sources**: How users found your site

### Custom Events (Already Implemented)
- **CTA Clicks**: Hero section, pricing plans, final CTA
- **Pricing Interactions**: Plan selection and checkout initiation
- **User Engagement**: Content interactions and user behavior

## Custom Event Tracking

You can add more custom events using the `useAnalytics` hook:

```tsx
import { useAnalytics } from '@/lib/useAnalytics'

function MyComponent() {
  const { trackEvent, trackUserEngagement } = useAnalytics()

  const handleButtonClick = () => {
    trackEvent('click', 'feature', 'custom_button')
    trackUserEngagement('feature_use', 'custom_feature', 'button')
  }

  return (
    <button onClick={handleButtonClick}>
      Click Me
    </button>
  )
}
```

## Available Tracking Functions

- `trackEvent(action, category, label?, value?)` - Track custom events
- `trackPageView(url)` - Track specific page views
- `trackConversion(conversionId, value?)` - Track conversions
- `trackUserEngagement(action, contentId?, contentType?)` - Track user engagement

## Privacy and GDPR Compliance

### Cookie Consent
- Google Analytics uses cookies to track user behavior
- Consider implementing a cookie consent banner for GDPR compliance
- Users can opt-out of analytics tracking

### Data Retention
- Google Analytics data is retained according to your account settings
- You can configure data retention periods in your GA4 property settings

## Troubleshooting

### Analytics Not Working?
1. Check your Measurement ID is correct in `.env.local`
2. Ensure the environment variable starts with `NEXT_PUBLIC_`
3. Check browser console for JavaScript errors
4. Verify the Google Analytics script is loading in Network tab

### No Data in GA4?
1. Wait 24-48 hours for data to appear (GA4 has processing delays)
2. Check if you have any ad blockers enabled
3. Verify your Measurement ID is correct
4. Check if your website is accessible from the internet

### Development vs Production
- Analytics work in both development and production
- Use different GA4 properties for dev/staging/production if needed
- Set environment-specific Measurement IDs

## Advanced Configuration

### Enhanced Ecommerce Tracking
For better ecommerce insights, you can add product tracking:

```tsx
// Track product views
trackEvent('view_item', 'ecommerce', 'product_name', productPrice)

// Track purchases
trackEvent('purchase', 'ecommerce', 'order_id', orderValue)
```

### User Properties
Track user-specific information:

```tsx
// Set user properties
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    user_properties: {
      user_type: user?.subscriptionType || 'free',
      user_id: user?.id || 'anonymous'
    }
  })
}
```

## Performance Considerations

- Google Analytics script loads asynchronously
- No impact on page load performance
- Analytics data is sent in the background
- Consider implementing consent management for better user experience

## Support

If you encounter issues:
1. Check the [Google Analytics Help Center](https://support.google.com/analytics/)
2. Verify your implementation in the [GA4 Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
3. Use the [Google Analytics Real-Time reports](https://analytics.google.com/analytics/web/#/realtime) to verify data flow

## Next Steps

1. **Set up Goals**: Configure conversion goals in GA4
2. **Create Audiences**: Build custom audiences for remarketing
3. **Set up Enhanced Measurement**: Enable additional tracking features
4. **Configure Data Streams**: Add more data sources if needed
5. **Set up Reporting**: Create custom reports and dashboards

Your Google Analytics integration is now complete! You'll start seeing data in your GA4 dashboard within 24-48 hours.
