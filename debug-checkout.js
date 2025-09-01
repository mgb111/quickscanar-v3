// Debug script to test checkout linking with current checkout_id
async function debugCheckout() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkoutId = urlParams.get('checkout_id');
  
  if (!checkoutId) {
    console.error('No checkout_id found in URL');
    return;
  }
  
  console.log('🔍 Testing checkout:', checkoutId);
  
  try {
    const response = await fetch('/api/polar/link-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_id: checkoutId
      })
    });
    
    const result = await response.json();
    console.log('📊 Link result:', result);
    
    if (response.ok) {
      console.log('✅ Success! Subscription linked');
      // Test subscription fetch
      const subResponse = await fetch('/api/get-subscription');
      const subResult = await subResponse.json();
      console.log('📋 Subscription data:', subResult);
      
      // Test usage
      const usageResponse = await fetch('/api/campaigns/usage');
      const usageResult = await usageResponse.json();
      console.log('📈 Usage data:', usageResult);
      
      // Redirect to subscription page
      setTimeout(() => {
        window.location.href = '/subscription';
      }, 2000);
    } else {
      console.error('❌ Failed:', result.error);
    }
  } catch (error) {
    console.error('🚨 Error:', error);
  }
}

// Auto-run if on success page
if (window.location.pathname.includes('success') || window.location.search.includes('checkout_id')) {
  debugCheckout();
} else {
  console.log('Run debugCheckout() to test with current URL params');
}
