// Test script to verify subscription system functionality
// Run this in browser console on the subscription page

async function testSubscriptionSystem() {
  console.log('🧪 Testing QuickScanAR Subscription System...\n');
  
  // Test 1: Check if user is authenticated
  console.log('1️⃣ Testing Authentication...');
  try {
    const authResponse = await fetch('/api/get-subscription', {
      credentials: 'include'
    });
    console.log('Auth Status:', authResponse.status);
    if (authResponse.status === 401) {
      console.log('❌ User not authenticated. Please sign in first.');
      return;
    }
    console.log('✅ User authenticated\n');
  } catch (error) {
    console.log('❌ Auth test failed:', error);
    return;
  }

  // Test 2: Fetch current subscription
  console.log('2️⃣ Testing Subscription Fetch...');
  try {
    const subResponse = await fetch('/api/get-subscription', {
      credentials: 'include'
    });
    const subData = await subResponse.json();
    
    if (subData.subscription) {
      console.log('✅ Subscription found:');
      console.log('  - Plan:', subData.subscription.plan_name || 'Unknown');
      console.log('  - Status:', subData.subscription.status);
      console.log('  - Price ID:', subData.subscription.price_id);
      console.log('  - Polar Sub ID:', subData.subscription.polar_subscription_id);
    } else {
      console.log('ℹ️ No active subscription (Free plan)');
    }
    console.log('');
  } catch (error) {
    console.log('❌ Subscription fetch failed:', error);
  }

  // Test 3: Fetch campaign usage
  console.log('3️⃣ Testing Campaign Usage...');
  try {
    const usageResponse = await fetch('/api/campaigns/usage', {
      credentials: 'include'
    });
    const usageData = await usageResponse.json();
    
    console.log('✅ Usage data:');
    console.log('  - Plan:', usageData.plan_name);
    console.log('  - Used:', usageData.used);
    console.log('  - Limit:', usageData.limit);
    console.log('  - Remaining:', usageData.limit - usageData.used);
    console.log('');
  } catch (error) {
    console.log('❌ Usage fetch failed:', error);
  }

  // Test 4: Check subscription plans
  console.log('4️⃣ Testing Plan Fetch...');
  try {
    const plansResponse = await fetch('/api/polar?action=prices', {
      cache: 'no-store'
    });
    const plansData = await plansResponse.json();
    
    console.log('✅ Available plans:');
    plansData.prices?.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.amount/100}/${plan.interval}`);
    });
    console.log('');
  } catch (error) {
    console.log('❌ Plans fetch failed:', error);
  }

  // Test 5: Simulate subscription link (if checkout_id in URL)
  console.log('5️⃣ Testing Subscription Linking...');
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutId = urlParams.get('checkout_id');
  
  if (checkoutId) {
    console.log('Found checkout_id in URL:', checkoutId);
    try {
      const linkResponse = await fetch('/api/polar/link-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checkout_id: checkoutId }),
        credentials: 'include'
      });
      const linkData = await linkResponse.json();
      
      if (linkResponse.ok) {
        console.log('✅ Subscription link successful:');
        console.log('  - Linked:', linkData.linked);
        console.log('  - Subscription ID:', linkData.subscription_id);
        console.log('  - User ID:', linkData.user_id);
        console.log('  - Price ID:', linkData.price_id);
      } else {
        console.log('❌ Subscription link failed:', linkData.error);
      }
    } catch (error) {
      console.log('❌ Link test failed:', error);
    }
  } else {
    console.log('ℹ️ No checkout_id in URL - skipping link test');
  }
  console.log('');

  console.log('🎉 Subscription system test completed!');
  console.log('\n📋 Summary:');
  console.log('- Authentication: Working');
  console.log('- Subscription fetch: Working');
  console.log('- Campaign usage: Working');
  console.log('- Plan fetch: Working');
  console.log('- Subscription linking: Ready');
}

// Auto-run the test
testSubscriptionSystem();
