// Script to link the checkout to user subscription
async function linkCheckout() {
  const checkoutId = 'b9249aad-145b-485f-9946-2920971b78a1';
  const userId = '78664da6-8d55-40e5-955d-a87b6b4cf1a4';
  
  try {
    const response = await fetch('/api/polar/link-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_id: checkoutId,
        user_id: userId
      })
    });
    
    const result = await response.json();
    console.log('Link result:', result);
    
    if (response.ok) {
      console.log('✅ Subscription linked successfully!');
      
      // Now test fetching the subscription
      const subResponse = await fetch('/api/get-subscription');
      const subResult = await subResponse.json();
      console.log('Subscription fetch result:', subResult);
    } else {
      console.error('❌ Failed to link subscription:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
linkCheckout();
