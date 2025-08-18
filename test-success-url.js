#!/usr/bin/env node

/**
 * Test script to verify Polar.sh success URL configuration
 * Run this script to test if your success and cancel pages are accessible
 */

const https = require('https');
const http = require('http');

// Configuration - UPDATE THESE VALUES
const config = {
  domain: 'quickscanar.com', // Updated to your actual domain
  protocol: 'https', // Updated to https for production
  successPath: '/subscription/success',
  cancelPath: '/subscription/cancel',
  testCheckoutId: 'test_checkout_12345'
};

function testUrl(url, description) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      console.log(`✅ ${description}: ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        console.log(`   ⚠️  Unexpected status code: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`❌ ${description}: ${err.message}`);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🧪 Testing Polar.sh Success URL Configuration\n');
  
  const baseUrl = `${config.protocol}://${config.domain}`;
  
  // Test 1: Success page with checkout ID
  const successUrl = `${baseUrl}${config.successPath}?checkout_id=${config.testCheckoutId}`;
  await testUrl(successUrl, 'Success page with checkout ID');
  
  // Test 2: Success page without checkout ID (should redirect)
  const successUrlNoId = `${baseUrl}${config.successPath}`;
  await testUrl(successUrlNoId, 'Success page without checkout ID');
  
  // Test 3: Cancel page
  const cancelUrl = `${baseUrl}${config.cancelPath}`;
  await testUrl(cancelUrl, 'Cancel page');
  
  // Test 4: Base subscription page
  const subscriptionUrl = `${baseUrl}/subscription`;
  await testUrl(subscriptionUrl, 'Subscription page');
  
  console.log('\n📋 Configuration Summary:');
  console.log(`   Domain: ${config.domain}`);
  console.log(`   Protocol: ${config.protocol}`);
  console.log(`   Success URL: ${baseUrl}${config.successPath}?checkout_id={CHECKOUT_ID}`);
  console.log(`   Cancel URL: ${baseUrl}${config.cancelPath}`);
  
  console.log('\n🔧 Next Steps:');
  console.log('1. ✅ Domain already updated to quickscanar.com');
  console.log('2. Set these URLs in your Polar.sh dashboard:');
  console.log(`   Success: ${baseUrl}${config.successPath}?checkout_id={CHECKOUT_ID}`);
  console.log(`   Cancel: ${baseUrl}${config.cancelPath}`);
  console.log('3. Test with a real subscription to verify the flow');
  
  console.log('\n⚠️  Important Notes:');
  console.log('- The {CHECKOUT_ID} parameter is REQUIRED by Polar.sh');
  console.log('- ✅ Using production domain: quickscanar.com');
  console.log('- ✅ HTTPS is enabled for production');
  console.log('- Test both success and cancel flows');
  
  console.log('\n🎯 Polar.sh Checkout URL:');
  console.log('   https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d');
}

// Run the tests
runTests().catch(console.error);
