import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const REVENUECAT_SECRET_KEY = process.env.REVENUECAT_SECRET_API_KEY;

export async function POST(request: NextRequest) {
  console.log('🚀 Starting cancellation process...');
  
  try {
    const { userId } = await request.json();

    if (!userId) {
      console.log('❌ No userId provided');
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    if (!REVENUECAT_SECRET_KEY) {
      console.log('❌ No secret key found');
      return NextResponse.json(
        { error: 'Server configuration error: Missing RevenueCat API key' },
        { status: 500 }
      );
    }

    console.log('🔑 Using secret key:', REVENUECAT_SECRET_KEY.substring(0, 10) + '...');
    console.log('👤 Cancelling for user:', userId);

    // Test the API key first
    const testResponse = await fetch('https://api.revenuecat.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('🧪 API key test status:', testResponse.status);

    if (!testResponse.ok) {
      const testError = await testResponse.text();
      console.log('❌ API key test failed:', testError);
      return NextResponse.json(
        { error: 'Invalid RevenueCat API key' },
        { status: 401 }
      );
    }

    // Now try to get the customer
    const customerResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${userId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${REVENUECAT_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('👤 Customer lookup status:', customerResponse.status);

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.log('❌ Customer lookup failed:', errorText);
      
      if (customerResponse.status === 404) {
        // User not found in RevenueCat - this is actually OK, just means no subscription
        console.log('ℹ️ User not found in RevenueCat - no subscription to cancel');
        return NextResponse.json({
          success: false,
          message: 'No subscription found for this user',
          debug: {
            reason: 'user_not_found_in_revenuecat',
            status: 404
          }
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to retrieve subscription information',
          details: `Status: ${customerResponse.status}, Error: ${errorText}`
        },
        { status: customerResponse.status }
      );
    }

    const customerData = await customerResponse.json();
    console.log('✅ Customer data retrieved');

    // For Web Billing subscriptions, try a different approach
    // Instead of trying to cancel via API, mark as cancelled in our database
    // and let RevenueCat's management URL handle the actual cancellation

    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (dbError) {
      console.error('❌ Database update error:', dbError);
    } else {
      console.log('✅ Database updated - marked as cancelled');
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancellation initiated. Please also cancel via your billing portal to ensure complete cancellation.',
      debug: {
        method: 'database_update',
        customerFound: true,
        managementUrl: customerData.subscriber?.management_url
      }
    });

  } catch (error) {
    console.error('💥 Cancellation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}