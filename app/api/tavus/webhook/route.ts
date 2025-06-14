// app/api/tavus/webhook/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fix: Await the headers() call before using .get()
    const headersList = await headers();
    const signature = headersList.get('x-tavus-signature');
    
    // Optional: Verify webhook signature
    if (process.env.TAVUS_WEBHOOK_SECRET && signature) {
      // Add signature verification logic here if needed
      // const isValid = verifyTavusSignature(body, signature, process.env.TAVUS_WEBHOOK_SECRET);
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
    }

    console.log('Tavus webhook received:', body);

    switch (body.event) {
      case 'replica.training_complete':
        await handleReplicaComplete(supabase, body.data);
        break;
        
      case 'replica.training_failed':
        await handleReplicaFailed(supabase, body.data);
        break;
        
      case 'video.ready':
        await handleVideoReady(supabase, body.data);
        break;

      case 'video.failed':
        await handleVideoFailed(supabase, body.data);
        break;
        
      default:
        console.log('Unhandled Tavus event:', body.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleReplicaComplete(supabase: any, data: any) {
  console.log('Replica training completed:', data);
  
  const { error } = await supabase
    .from('coach_profiles')
    .update({
      tavus_replica_status: 'completed'
    })
    .eq('tavus_replica_id', data.replica_id);

  if (error) {
    console.error('Error updating replica status:', error);
  } else {
    console.log('Successfully updated replica status to completed');
  }
}

async function handleReplicaFailed(supabase: any, data: any) {
  console.log('Replica training failed:', data);
  
  const { error } = await supabase
    .from('coach_profiles')
    .update({
      tavus_replica_status: 'failed'
    })
    .eq('tavus_replica_id', data.replica_id);

  if (error) {
    console.error('Error updating failed replica:', error);
  } else {
    console.log('Successfully updated replica status to failed');
  }
}

async function handleVideoReady(supabase: any, data: any) {
  console.log('Video generation completed:', data);
  
  const { error } = await supabase
    .from('video_responses')
    .update({
      status: 'ready',
      url: data.hosted_url || data.url,
      processing_duration: data.processing_duration || null
    })
    .eq('tavus_video_id', data.video_id);

  if (error) {
    console.error('Error updating video status:', error);
  } else {
    console.log('Successfully updated video status to ready');
  }
}

async function handleVideoFailed(supabase: any, data: any) {
  console.log('Video generation failed:', data);
  
  const { error } = await supabase
    .from('video_responses')
    .update({
      status: 'failed',
      error_message: data.error_message || 'Video generation failed'
    })
    .eq('tavus_video_id', data.video_id);

  if (error) {
    console.error('Error updating failed video:', error);
  } else {
    console.log('Successfully updated video status to failed');
  }
}

// Optional: Signature verification function
function verifyTavusSignature(payload: any, signature: string, secret: string): boolean {
  // Implement HMAC signature verification if Tavus provides webhook secrets
  // This is a placeholder - check Tavus documentation for their specific signature format
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    const expectedSignature = hmac.digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}