# 📊 Analytics System Setup Guide

## 🎯 Overview

Your analytics system has been completely updated to use real data instead of placeholder data. It now integrates with your Polar.sh subscription system to provide subscription-based analytics limits and real-time tracking.

## 🚀 What's New

### ✅ **Real Data Integration**
- **No more placeholder data** - All metrics come from your actual database
- **Real-time tracking** - Events are stored as they happen
- **Subscription-based limits** - Free users see limited analytics, premium users get full access

### ✅ **Subscription Integration**
- **Free Plan**: Limited to 1,000 views, 500 unique viewers, 3 countries, 3 cities, 2 campaigns
- **Premium Plans**: Unlimited analytics with full geographic data, all campaigns, and advanced metrics
- **Upgrade prompts** throughout the interface

### ✅ **Comprehensive Tracking**
- **Session tracking** - Start/end times, duration
- **Performance metrics** - Loading times, AR initialization, device compatibility
- **Geographic data** - Country, city, region detection
- **Device analytics** - Mobile, tablet, desktop breakdown
- **Engagement metrics** - Interactions, completions, conversions

## 🗄️ Database Setup

### 1. Run Analytics Schema

Execute the analytics schema in your Supabase SQL editor:

```sql
-- Copy and paste the contents of analytics-schema.sql
-- This creates all necessary tables and functions
```

### 2. Verify Tables Created

You should see these tables:
- `ar_analytics_events` - Individual analytics events
- `ar_analytics_sessions` - Session tracking
- `ar_analytics_daily_aggregates` - Daily aggregated data
- `ar_analytics_conversions` - Conversion tracking
- `ar_analytics_performance` - Performance metrics
- `ar_analytics_geographic` - Geographic data

## 🔧 Implementation

### 1. Add Analytics Tracker to AR Experiences

```tsx
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker'

function MyARExperience() {
  const { user } = useAuth()
  
  return (
    <div>
      {/* Your AR experience content */}
      
      {/* Analytics tracker - invisible component */}
      <AnalyticsTracker
        experienceId="exp_123"
        userId={user?.id}
        sessionId={`session_${Date.now()}`}
        onEventTracked={(event, data) => {
          console.log('Event tracked:', event, data)
        }}
      />
    </div>
  )
}
```

### 2. Track Custom Events

```tsx
import { useAnalyticsTracker } from '@/components/analytics/AnalyticsTracker'

function MyComponent() {
  const { trackInteraction, trackCompletion, trackConversion } = useAnalyticsTracker('exp_123', 'user_456')
  
  const handleButtonClick = () => {
    trackInteraction('button_click', { 
      buttonId: 'cta_button', 
      page: 'home' 
    })
  }
  
  const handlePurchase = () => {
    trackConversion('purchase', { 
      amount: 99.99, 
      product: 'premium_plan' 
    })
  }
  
  return (
    <div>
      <button onClick={handleButtonClick}>Click Me</button>
      <button onClick={handlePurchase}>Buy Now</button>
    </div>
  )
}
```

### 3. Track AR-Specific Events

```tsx
// Track target recognition
trackTargetRecognition(1500, { 
  targetType: 'image', 
  confidence: 0.95 
})

// Track AR initialization
trackEvent('ar_init', { 
  initTime: 2000, 
  deviceType: 'mobile' 
})

// Track errors
trackError('target_not_found', 'Image target could not be recognized', {
  targetId: 'logo_123',
  attempts: 3
})
```

## 📱 Analytics Dashboard

### **Free Users See:**
- Basic metrics (limited views, viewers)
- 3 countries and 3 cities max
- 2 campaigns max
- Upgrade prompts throughout

### **Premium Users See:**
- Unlimited analytics data
- All geographic locations
- All campaigns and detailed metrics
- Advanced performance insights

### **Key Metrics:**
- **Total Views** - Page loads and AR experience views
- **Unique Viewers** - Distinct users
- **Session Duration** - Average time spent
- **Conversion Rate** - Goal completions
- **Engagement** - Interactions, completions, drop-offs
- **Performance** - Loading times, error rates, device compatibility

## 🔍 Tracking Events

### **Automatic Events:**
- `session_start` - When user starts AR experience
- `view` - Page/experience view
- `session_end` - When user leaves (with duration)
- `performance` - Device and loading metrics

### **Manual Events:**
- `interaction` - User interactions (clicks, taps, gestures)
- `completion` - Experience completion rates
- `conversion` - Business goals (purchases, signups)
- `error` - Error tracking and debugging
- `target_recognition` - AR target detection

## 🎨 Customization

### **Styling Analytics Dashboard:**
```tsx
// Custom colors and themes
const customTheme = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B'
}

// Custom metrics display
const customMetrics = {
  showRealTime: true,
  refreshInterval: 30000,
  chartType: 'line'
}
```

### **Custom Event Types:**
```tsx
// Track custom business events
trackEvent('product_view', {
  productId: 'prod_123',
  category: 'electronics',
  price: 299.99
})

trackEvent('social_share', {
  platform: 'facebook',
  content: 'ar_experience',
  reach: 1500
})
```

## 🧪 Testing

### **1. Test Analytics API:**
```bash
# Test event tracking
curl -X POST http://localhost:3000/api/analytics \
  -H "Content-Type: application/json" \
  -d '{
    "experienceId": "test_exp",
    "event": "view",
    "userId": "test_user",
    "sessionId": "test_session"
  }'
```

### **2. Test Analytics Page:**
- Visit `/analytics` page
- Check browser console for tracking logs
- Verify data appears in dashboard
- Test different time ranges

### **3. Test Subscription Limits:**
- Create test events to exceed free limits
- Verify upgrade prompts appear
- Check that premium users see full data

## 🚨 Troubleshooting

### **Common Issues:**

1. **No data showing:**
   - Check database tables exist
   - Verify RLS policies are correct
   - Check API endpoint is working

2. **Events not tracking:**
   - Verify AnalyticsTracker component is mounted
   - Check browser console for errors
   - Ensure API endpoint is accessible

3. **Subscription limits not working:**
   - Verify user_subscriptions table has data
   - Check subscription status API
   - Ensure user authentication is working

### **Debug Commands:**
```bash
# Check database tables
psql -d your_db -c "\dt ar_analytics_*"

# Check recent events
psql -d your_db -c "SELECT * FROM ar_analytics_events ORDER BY created_at DESC LIMIT 10;"

# Check subscription status
psql -d your_db -c "SELECT * FROM user_subscriptions WHERE user_id = 'your_user_id';"
```

## 📈 Next Steps

### **Immediate:**
1. ✅ Run analytics schema in Supabase
2. ✅ Add AnalyticsTracker to your AR experiences
3. ✅ Test basic event tracking
4. ✅ Verify dashboard shows real data

### **Short-term:**
1. Customize tracking for your specific use cases
2. Add conversion tracking for business goals
3. Set up automated reporting
4. Integrate with external analytics tools

### **Long-term:**
1. Advanced segmentation and cohort analysis
2. A/B testing for AR experiences
3. Predictive analytics and insights
4. Real-time dashboards and alerts

## 🔗 Related Files

- `app/analytics/page.tsx` - Main analytics dashboard
- `app/api/analytics/route.ts` - Analytics API endpoints
- `components/analytics/AnalyticsTracker.tsx` - Event tracking component
- `analytics-schema.sql` - Database schema
- `polar-integration-schema.sql` - Subscription integration

---

**🎉 Your analytics system is now live with real data! No more placeholders, just actionable insights for your AR experiences.**
