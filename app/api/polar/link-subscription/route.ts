import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const POLAR_API_URL = process.env.POLAR_API_URL || 'https://api.polar.sh/v1'
const POLAR_API_KEY = process.env.POLAR_API_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const { checkout_id } = await request.json();

    // 1. Get user from auth token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: "Authorization token is required" }, { status: 401 });
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Get checkout data from Polar
    if (!POLAR_API_KEY) {
        console.error('Polar API key is not configured');
        return NextResponse.json({ error: 'Polar integration not configured' }, { status: 500 });
    }

    const polarResponse = await fetch(`${POLAR_API_URL}/checkouts/${checkout_id}`, {
        headers: {
            'Authorization': `Bearer ${POLAR_API_KEY}`
        }
    });

    if (!polarResponse.ok) {
        const errorBody = await polarResponse.text();
        console.error(`Failed to fetch Polar checkout ${checkout_id}:`, errorBody);
        return NextResponse.json({ error: 'Failed to fetch checkout from Polar' }, { status: polarResponse.status });
    }

    const checkout = await polarResponse.json();
    console.log("Full checkout data:", JSON.stringify(checkout, null, 2));
    
    // 3. Extract all the needed data
    const subscriptionData = {
      user_id: user.id,
      email: user.email,
      polar_customer_id: checkout.customer_id,
      plan: checkout.product?.name || '',
      price_id: checkout.product_price?.id,
      status: 'active',
      start_date: new Date().toISOString(),
    };

    console.log("Subscription data to save:", subscriptionData);

    // 4. Update your database insert/update logic to use this data
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });

  } catch (error) {
    console.error("Error linking subscription:", error);
    return NextResponse.json({ error: "Failed to link subscription" }, { status: 500 });
  }
}
