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

const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

async function verifyWebhook(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const isValid = authHeader === `Bearer ${WEBHOOK_SECRET}`;
  
  if (!isValid) {
    console.log('❌ Webhook verification failed:', {
      hasAuthHeader: !!authHeader,
      hasSecret: !!WEBHOOK_SECRET,
      authHeaderPrefix: authHeader?.substring(0, 10) + '...',
      expectedPrefix: `Bearer ${WEBHOOK_SECRET?.substring(0, 10)}...`
    });
  }
  
  return isValid;
}

export async function POST(request: NextRequest) {
  console.log('📥 Webhook received at:', new Date().toISOString());
  
  try {
    // Verify webhook authenticity
    if (!await verifyWebhook(request)) {
      console.log('❌ Webhook verification failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await request.json();
    
    console.log('✅ RevenueCat webhook received:', {
      type: event.event?.type,
      userId: event.event?.app_user_id,
      environment: event.event?.environment,
      productId: event.event?.product_id,
      timestamp: new Date().toISOString()
    });

    // Validate event structure
    if (!event.event || !event.event.type || !event.event.app_user_id) {
      console.error('❌ Invalid event structure:', event);
      return NextResponse.json({ 
        error: 'Invalid event structure',
        received: true 
      }, { status: 400 });
    }

    let result;

    // Handle different event types
    try {
      switch (event.event.type) {
        case 'TEST':
          result = await handleTestEvent(event);
          break;
          
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'SUBSCRIPTION_EXTENDED':
          result = await handleSubscriptionActive(event);
          break;
          
        case 'CANCELLATION':
        case 'SUBSCRIPTION_PAUSED':
          result = await handleSubscriptionCanceled(event);
          break;
          
        case 'BILLING_ISSUE':
          result = await handleBillingIssue(event);
          break;
          
        case 'EXPIRATION':
          result = await handleSubscriptionExpired(event);
          break;

        case 'NON_RENEWING_PURCHASE':
          result = await handleNonRenewingPurchase(event);
          break;
          
        default:
          console.log(`ℹ️ Unhandled event type: ${event.event.type}`);
          result = { 
            success: true, 
            message: `Event type ${event.event.type} acknowledged but not processed` 
          };
      }
    } catch (handlerError) {
      console.error(`❌ Error handling ${event.event.type}:`, handlerError);
      result = { 
        success: false, 
        error: handlerError instanceof Error ? handlerError.message : 'Handler error',
        retryable: true
      };
    }

    console.log(`✅ Event ${event.event.type} processed:`, result);

    return NextResponse.json({ 
      received: true, 
      processed: result.success,
      eventType: event.event.type,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      received: true,
      processed: false,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function handleTestEvent(event: any) {
  console.log('🧪 Processing TEST event:', {
    userId: event.event.app_user_id,
    productId: event.event.product_id,
    email: event.event.subscriber_attributes?.$email?.value,
    environment: event.event.environment
  });
  
  return { success: true, message: 'Test event processed successfully' };
}

async function handleSubscriptionActive(event: any) {
  const { app_user_id, product_id, entitlement_ids, expiration_at_ms } = event.event;
  
  console.log(`🎉 Subscription activated:`, {
    userId: app_user_id,
    productId: product_id,
    entitlements: entitlement_ids,
    expiresAt: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null
  });
  
  try {
    // Update user subscription status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', app_user_id);

    if (profileError) {
      console.error('❌ Profile update error:', profileError);
      throw new Error(`Profile update failed: ${profileError.message}`);
    }

    // Create/update subscription record
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        prof_id: app_user_id,
        plan_id: product_id,
        status: 'active',
        current_period_end: expiration_at_ms 
          ? new Date(expiration_at_ms).toISOString()
          : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'prof_id'
      });

    if (subscriptionError) {
      console.error('❌ Subscription update error:', subscriptionError);
      throw new Error(`Subscription update failed: ${subscriptionError.message}`);
    }

    console.log('✅ Database updated successfully for subscription activation');
    return { success: true, message: 'Subscription activated successfully' };
    
  } catch (error) {
    console.error('❌ Database error in handleSubscriptionActive:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(event: any) {
  const { app_user_id } = event.event;
  
  console.log(`❌ Subscription canceled for user: ${app_user_id}`);
  
  try {
    const [profileResult, subscriptionResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', app_user_id),
      
      supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('prof_id', app_user_id)
    ]);

    if (profileResult.error) {
      console.error('❌ Profile update error:', profileResult.error);
    }
    
    if (subscriptionResult.error) {
      console.error('❌ Subscription update error:', subscriptionResult.error);
    }

    console.log('✅ Subscription cancellation processed');
    return { success: true, message: 'Subscription canceled successfully' };
    
  } catch (error) {
    console.error('❌ Error processing subscription cancellation:', error);
    throw error;
  }
}

async function handleBillingIssue(event: any) {
  const { app_user_id } = event.event;
  
  console.log(`⚠️ Billing issue for user: ${app_user_id}`);
  
  try {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', app_user_id);

    if (error) {
      console.error('❌ Error updating billing issue status:', error);
      throw new Error(`Billing status update failed: ${error.message}`);
    }

    console.log('✅ Billing issue status updated');
    return { success: true, message: 'Billing issue processed successfully' };
    
  } catch (error) {
    console.error('❌ Error processing billing issue:', error);
    throw error;
  }
}

async function handleSubscriptionExpired(event: any) {
  const { app_user_id } = event.event;
  
  console.log(`⏰ Subscription expired for user: ${app_user_id}`);
  
  try {
    const [profileResult, subscriptionResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'none',
          updated_at: new Date().toISOString()
        })
        .eq('id', app_user_id),
      
      supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('prof_id', app_user_id)
    ]);

    if (profileResult.error) {
      console.error('❌ Profile update error:', profileResult.error);
    }
    
    if (subscriptionResult.error) {
      console.error('❌ Subscription update error:', subscriptionResult.error);
    }

    console.log('✅ Subscription expiration processed');
    return { success: true, message: 'Subscription expiration processed successfully' };
    
  } catch (error) {
    console.error('❌ Error processing subscription expiration:', error);
    throw error;
  }
}

async function handleNonRenewingPurchase(event: any) {
  const { app_user_id, product_id } = event.event;
  
  console.log(`💰 Non-renewing purchase for user: ${app_user_id}, product: ${product_id}`);
  
  try {
    // For one-time purchases, you might want to grant temporary access or specific features
    // This depends on your business logic
    
    console.log('✅ Non-renewing purchase processed');
    return { success: true, message: 'Non-renewing purchase processed successfully' };
    
  } catch (error) {
    console.error('❌ Error processing non-renewing purchase:', error);
    throw error;
  }
}