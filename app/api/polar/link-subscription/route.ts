import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const POLAR_API_URL = process.env.POLAR_API_URL || 'https://api.polar.sh/v1'
const POLAR_API_KEY = process.env.POLAR_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  console.log('🚀 Link subscription endpoint called at:', new Date().toISOString());
  
  try {
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body, null, 2));
    
    const { checkout_id } = body;

    if (!checkout_id) {
      console.error('❌ No checkout_id provided');
      return NextResponse.json({ error: "checkout_id is required" }, { status: 400 });
    }

    // 1. Get user from auth token
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.error('❌ No authorization token');
      return NextResponse.json({ error: "Authorization token is required" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // 2. Get checkout data from Polar
    if (!POLAR_API_KEY) {
        console.error('❌ Polar API key is not configured');
        return NextResponse.json({ error: 'Polar integration not configured' }, { status: 500 });
    }

    console.log('🌐 Fetching from Polar API:', `${POLAR_API_URL}/checkouts/${checkout_id}`);
    
    const polarResponse = await fetch(`${POLAR_API_URL}/checkouts/${checkout_id}`, {
        headers: {
            'Authorization': `Bearer ${POLAR_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    console.log('📡 Polar response status:', polarResponse.status);

    if (!polarResponse.ok) {
        const errorBody = await polarResponse.text();
        console.error(`❌ Failed to fetch Polar checkout ${checkout_id}:`, errorBody);
        return NextResponse.json({ 
          error: 'Failed to fetch checkout from Polar', 
          details: errorBody,
          status: polarResponse.status 
        }, { status: 500 });
    }

    const checkout = await polarResponse.json();
    console.log("📦 Full checkout data:", JSON.stringify(checkout, null, 2));
    
    // 3. Extract all the needed data with multiple fallback paths
    const extractedData = {
      customer_id: checkout.customer_id || checkout.customer?.id || null,
      product_name: checkout.product?.name || checkout.product_name || '',
      price_id: checkout.product_price?.id || checkout.price?.id || checkout.price_id || null
    };
    
    console.log("🔍 Extracted from checkout:", extractedData);
    
    const subscriptionData = {
      user_id: user.id,
      email: user.email || '',
      polar_customer_id: extractedData.customer_id,
      plan: extractedData.product_name,
      price_id: extractedData.price_id,
      status: 'active',
      start_date: new Date().toISOString(),
    };

    console.log("💾 Subscription data to save:", JSON.stringify(subscriptionData, null, 2));

    // 4. Check if any critical data is missing
    if (!subscriptionData.polar_customer_id) {
      console.warn('⚠️ Missing polar_customer_id - checkout might be incomplete');
    }
    if (!subscriptionData.plan) {
      console.warn('⚠️ Missing plan name - using default');
      subscriptionData.plan = 'premium';
    }

    // 5. Save to database - first check if user already has a subscription
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let data, error;
    
    if (existingSubscription) {
      // Update existing subscription
      console.log('📝 Updating existing subscription for user:', user.id);
      const result = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('user_id', user.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new subscription
      console.log('➕ Creating new subscription for user:', user.id);
      const result = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("❌ Database error:", error);
      return NextResponse.json({ 
        error: "Failed to save subscription", 
        details: error.message 
      }, { status: 500 });
    }

    console.log("✅ Subscription saved successfully:", data);
    return NextResponse.json({ success: true, subscription: data });

  } catch (error) {
    console.error("💥 Unexpected error in link-subscription:", error);
    return NextResponse.json({ 
      error: "Failed to link subscription", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
