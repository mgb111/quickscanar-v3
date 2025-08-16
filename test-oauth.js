#!/usr/bin/env node

/**
 * OAuth Configuration Test Script
 * 
 * This script helps diagnose OAuth configuration issues by:
 * 1. Checking environment variables
 * 2. Testing Supabase connection
 * 3. Validating OAuth redirect URLs
 * 
 * Run with: node test-oauth.js
 */

const https = require('https');
const http = require('http');

console.log('🔍 OAuth Configuration Test\n');

// Check environment variables
console.log('📋 Environment Variables:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${varName.includes('KEY') ? value.substring(0, 20) + '...' : value}`);
  } else {
    console.log(`  ❌ ${varName}: Not set`);
  }
});

console.log('');

// Test Supabase connection
async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.log('❌ Cannot test Supabase connection: NEXT_PUBLIC_SUPABASE_URL not set');
    return;
  }

  console.log('🔗 Testing Supabase Connection:');
  
  try {
    const url = new URL(supabaseUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const response = await new Promise((resolve, reject) => {
      const req = protocol.get(url, (res) => {
        resolve(res);
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Connection timeout'));
      });
    });
    
    console.log(`  ✅ Supabase connection successful: ${response.statusCode} ${response.statusMessage}`);
  } catch (error) {
    console.log(`  ❌ Supabase connection failed: ${error.message}`);
  }
}

// Test OAuth redirect URLs
function testOAuthUrls() {
  console.log('\n🎯 OAuth Redirect URL Validation:');
  
  const currentDomain = process.env.NEXT_PUBLIC_SITE_URL || 'https://quickscanar.com';
  const callbackUrl = `${currentDomain}/auth/callback`;
  
  console.log(`  Expected callback URL: ${callbackUrl}`);
  
  try {
    const url = new URL(callbackUrl);
    console.log(`  ✅ URL format is valid`);
    console.log(`  Protocol: ${url.protocol}`);
    console.log(`  Hostname: ${url.hostname}`);
    console.log(`  Path: ${url.pathname}`);
  } catch (error) {
    console.log(`  ❌ URL format is invalid: ${error.message}`);
  }
}

// Test Google OAuth endpoints
async function testGoogleOAuth() {
  console.log('\n🔐 Google OAuth Endpoint Test:');
  
  try {
    const response = await new Promise((resolve, reject) => {
      https.get('https://accounts.google.com/.well-known/openid_configuration', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      }).on('error', reject);
    });
    
    if (response.statusCode === 200) {
      console.log('  ✅ Google OAuth endpoints are accessible');
      try {
        const config = JSON.parse(response.data);
        console.log(`  Authorization endpoint: ${config.authorization_endpoint}`);
        console.log(`  Token endpoint: ${config.token_endpoint}`);
      } catch (parseError) {
        console.log('  ⚠️  Could not parse Google OAuth configuration');
      }
    } else {
      console.log(`  ❌ Google OAuth endpoints returned: ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`  ❌ Google OAuth test failed: ${error.message}`);
  }
}

// Main test function
async function runTests() {
  await testSupabaseConnection();
  testOAuthUrls();
  await testGoogleOAuth();
  
  console.log('\n📝 Summary:');
  console.log('1. Check that all environment variables are set');
  console.log('2. Verify Supabase connection is working');
  console.log('3. Ensure OAuth redirect URL is properly formatted');
  console.log('4. Test Google OAuth endpoints are accessible');
  console.log('\n🔧 If you see errors above, fix them before testing OAuth flow.');
  console.log('   Most common issue: Supabase Site URL not set to https://quickscanar.com');
}

// Run tests
runTests().catch(console.error);
