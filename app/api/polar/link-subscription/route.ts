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
    const { checkout_id } = await request.json();
    
    if (!checkout_id) {
      return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 });
    }

    console.log("🔗 Starting subscription linking for checkout:", checkout_id);

    // Check if this checkout_id has already been processed by looking for price_id match
    // We'll do a more comprehensive check after fetching the checkout data

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
    
    // Validate required data before proceeding
    if (!extractedData.customer_id || !extractedData.price_id || !extractedData.product_name) {
      console.error("❌ Missing required checkout data:", extractedData);
      return NextResponse.json({ 
        error: 'Invalid checkout data - missing customer_id, price_id, or product_name',
        details: extractedData 
      }, { status: 400 });
    }
    
    // Check for duplicate subscription before processing
    if (extractedData.customer_id && extractedData.price_id) {
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status')
        .eq('polar_customer_id', extractedData.customer_id)
        .eq('price_id', extractedData.price_id)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        console.log("✅ Duplicate subscription detected, returning existing");
        return NextResponse.json({ 
          success: true, 
          message: 'Subscription already exists',
          subscription: existingSubscription 
        });
      }
    }
    
    // Calculate end_date based on plan interval
    // 4. Determine plan limits and interval
    const rawPlanName = (extractedData.product_name || '').toLowerCase();
    const interval = checkout.product?.recurring_interval || checkout.product_price?.recurring_interval || 'month';
    
    // Normalize plan name for consistent storage
    let planName = rawPlanName;
    if (rawPlanName.includes('annual') || rawPlanName.includes('yearly') || rawPlanName.includes('year') || interval === 'year') {
      planName = 'annual';
    } else if (rawPlanName.includes('monthly') || rawPlanName.includes('month') || interval === 'month') {
      planName = 'monthly';
    } else if (rawPlanName.includes('pro')) {
      planName = 'pro';
    }
    
    console.log('🔄 Plan name normalization:', rawPlanName, '->', planName, 'Interval:', interval);

    const getPlanLimit = (plan: string) => {
      if (plan.includes('annual')) return 36;
      if (plan.includes('monthly')) return 3;
      return 1; // Default for free or unknown plans
    };
    const newCampaignLimit = getPlanLimit(planName);

    console.log(`Plan: "${planName}", Interval: "${interval}", New Campaigns: ${newCampaignLimit}`);

    // Clean up any empty/invalid subscription records for this user first
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', user.id)
      .or('plan.is.null,plan.eq.,email.is.null,email.eq.');

    console.log('🧹 Cleaned up empty subscription records');

    // 5. Save to database - check for existing subscription to stack benefits
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    let data, error;

    // Check if the new purchase is for the same plan to stack them
    if (existingSubscription && existingSubscription.plan.toLowerCase() === planName) {
      console.log('🔄 Stacking subscription for user:', user.id);

      const existingEndDate = new Date(existingSubscription.end_date);
      const newEndDate = new Date(existingEndDate);

      if (interval === 'month') {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (interval === 'year') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1); // Default
      }

      const updatedSubscription = {
        end_date: newEndDate.toISOString(),
        campaign_limit: (existingSubscription.campaign_limit || 1) + newCampaignLimit,
        status: 'active', // Ensure status is active
        price_id: extractedData.price_id, // Update price_id in case it changed
      };

      console.log('📈 New stacked values:', updatedSubscription);

      const result = await supabaseAdmin
        .from('subscriptions')
        .update(updatedSubscription)
        .eq('id', existingSubscription.id)
        .select()
        .single();
      data = result.data;
      error = result.error;

    } else {
      // This handles both new subscriptions and plan changes (upgrades/downgrades)
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscriptionData = {
        user_id: user.id,
        email: user.email || '',
        polar_customer_id: extractedData.customer_id,
        plan: extractedData.product_name,
        price_id: extractedData.price_id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        campaign_limit: newCampaignLimit,
      };

      if (existingSubscription) {
        console.log('📝 Overwriting existing subscription for user (plan change):', user.id);
        const result = await supabaseAdmin
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', existingSubscription.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        console.log('➕ Creating new subscription for user:', user.id);
        const result = await supabaseAdmin
          .from('subscriptions')
          .insert(subscriptionData)
          .select()
          .single();
        data = result.data;
        error = result.error;
      }
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
