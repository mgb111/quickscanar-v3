# QuickScanAR Analytics Setup Guide

This guide will help you set up analytics tracking for your AR experiences. Analytics will track user engagement, performance metrics, and provide insights into how your AR campaigns are performing.

## Prerequisites

- Supabase project set up and running
- Database access to run SQL commands
- QuickScanAR application deployed

## Step 1: Set Up Analytics Database Tables

1. **Go to your Supabase Dashboard**
   - Navigate to the SQL Editor
   - Create a new query

2. **Run the Analytics Schema**
   - Copy the contents of `analytics-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify Setup**
   - You should see success messages indicating:
     - ✅ Analytics tables created
     - ✅ RLS policies configured
     - ✅ Triggers and functions created
     - ✅ Sample data inserted

## Step 2: Verify Database Tables

After running the schema, you should have these new tables:

- `ar_analytics_events` - Tracks all analytics events
- `ar_analytics_sessions` - Tracks user sessions
- `ar_analytics_daily_aggregates` - Daily aggregated metrics
- `ar_analytics_conversions` - Conversion tracking
- `ar_analytics_performance` - Performance metrics
- `ar_analytics_geographic` - Geographic data
- `user_subscriptions` - User subscription status

## Step 3: Test Analytics Tracking

1. **Create an AR Experience**
   - Go to your QuickScanAR dashboard
   - Create a new AR experience
   - Upload a marker image and video

2. **View the Experience**
   - Open the experience page
   - Check the browser console for analytics events
   - You should see "Analytics event tracked" messages

3. **Launch AR Experience**
   - Click "Launch AR Experience"
   - Allow camera permissions
   - Point camera at the marker
   - Analytics will track:
     - Session start/end
     - Target recognition
     - Target lost events
     - Device information
     - Geographic location

## Step 4: View Analytics Dashboard

1. **Navigate to Analytics**
   - Go to `/analytics` in your app
   - You should see your analytics data

2. **What You'll See**
   - **Overview**: Total views, unique viewers, session duration, conversion rate
   - **Engagement**: Interaction rates, completion rates, drop-off rates
   - **Performance**: Target recognition success, loading times, error rates
   - **Geographic**: Top countries and cities
   - **Devices**: Mobile/tablet/desktop breakdown
   - **Campaigns**: Performance by experience

## Step 5: Understanding Analytics Data

### Event Types Tracked

- **`view`** - When someone views the experience page
- **`session_start`** - When AR session begins
- **`session_end`** - When AR session ends
- **`target_recognition`** - When marker is successfully recognized
- **`target_lost`** - When marker tracking is lost
- **`interaction`** - User interactions with AR content
- **`completion`** - When AR experience is completed
- **`conversion`** - Business conversions (if configured)
- **`error`** - Any errors that occur

### Metrics Explained

- **Total Views**: Number of times experiences were viewed
- **Unique Viewers**: Number of different people who viewed
- **Session Duration**: Average time spent in AR
- **Target Recognition Rate**: Success rate of marker detection
- **Interaction Rate**: How engaged users are with content
- **Completion Rate**: How many users finish the experience

## Step 6: Custom Analytics Events

You can track custom events in your AR experiences:

```javascript
// Track custom interaction
window.trackAREvent('interaction', {
  interactionType: 'button_click',
  buttonId: 'cta_button',
  page: 'product_showcase'
});

// Track conversion
window.trackAREvent('conversion', {
  conversionType: 'purchase',
  conversionValue: 99.99,
  productId: 'product_123'
});

// Track completion
window.trackAREvent('completion', {
  completionRate: 85,
  totalSteps: 10,
  completedSteps: 8
});
```

## Step 7: Subscription Tiers

### Free Tier
- Basic analytics dashboard
- Limited data (1000 views, 500 unique viewers)
- Basic metrics only
- Geographic data limited to top 3 countries/cities
- Campaign data limited to 2 campaigns

### Premium Tier
- Unlimited analytics data
- Advanced insights and metrics
- Full geographic breakdown
- All campaign performance data
- Real-time analytics
- Export capabilities

## Troubleshooting

### No Analytics Data Showing

1. **Check Database Tables**
   ```sql
   SELECT COUNT(*) FROM ar_analytics_events;
   SELECT COUNT(*) FROM ar_analytics_sessions;
   ```

2. **Verify RLS Policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'ar_analytics_events';
   ```

3. **Check Browser Console**
   - Look for "Analytics event tracked" messages
   - Check for any error messages

4. **Verify API Endpoint**
   - Test `/api/analytics` endpoint
   - Check network tab for failed requests

### Analytics Events Not Tracking

1. **Check User Authentication**
   - Ensure user is logged in
   - Verify user ID is being passed correctly

2. **Check Experience ID**
   - Ensure experience ID matches database
   - Verify experience exists and is accessible

3. **Check Network Requests**
   - Look for failed POST requests to `/api/analytics`
   - Check for CORS or authentication errors

### Performance Issues

1. **Database Indexes**
   - Ensure indexes are created on analytics tables
   - Monitor query performance

2. **Data Cleanup**
   - Consider archiving old analytics data
   - Implement data retention policies

## Advanced Configuration

### Custom Analytics Providers

You can integrate with external analytics providers:

```javascript
// Google Analytics
window.trackAREvent('custom', {
  provider: 'google_analytics',
  event: 'ar_experience_view',
  category: 'AR',
  action: 'view',
  label: experienceId
});

// Facebook Pixel
window.trackAREvent('custom', {
  provider: 'facebook_pixel',
  event: 'ViewContent',
  content_type: 'ar_experience',
  content_id: experienceId
});
```

### Real-time Analytics

For real-time analytics, consider:

1. **WebSocket Integration**
   - Real-time event streaming
   - Live dashboard updates

2. **Server-Sent Events**
   - Push analytics updates to dashboard
   - Real-time performance monitoring

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify database tables and policies
3. Test API endpoints manually
4. Check Supabase logs for database errors
5. Ensure environment variables are set correctly

## Next Steps

Once analytics are working:

1. **Monitor Performance**: Watch for trends in user engagement
2. **Optimize Content**: Use insights to improve AR experiences
3. **A/B Testing**: Test different markers, videos, and content
4. **User Segmentation**: Analyze behavior by device, location, etc.
5. **ROI Tracking**: Connect analytics to business outcomes

Your analytics are now set up and ready to provide valuable insights into your AR campaign performance!
