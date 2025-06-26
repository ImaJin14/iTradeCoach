// app/api/webhooks/tavus/route.ts
import { createServerSupabaseClient } from '@/lib/supabase/api-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabaseClient();
    
    // Optional: Verify webhook signature
    const signature = request.headers.get('x-tavus-signature');
    
    if (process.env.TAVUS_WEBHOOK_SECRET && signature) {
      // Add signature verification logic here if needed
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

      case 'conversation.ended':
        await handleConversationEnded(supabase, body.data);
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

// app/api/webhooks/tavus/route.ts - Update the handleVideoReady function
async function handleVideoReady(supabase: any, data: any) {
  console.log('Video generation completed:', data);
  
  const updateData: any = {
    status: 'ready',
    updated_at: new Date().toISOString()
  };

  // Store all available URLs from Tavus response
  if (data.hosted_url) {
    updateData.url = data.hosted_url;
  }
  if (data.stream_url) {
    updateData.stream_url = data.stream_url;
  }
  if (data.download_url) {
    updateData.download_url = data.download_url;
  }

  const { error } = await supabase
    .from('video_responses')
    .update(updateData)
    .eq('tavus_video_id', data.video_id);

  if (error) {
    console.error('Error updating video status:', error);
  } else {
    console.log('Successfully updated video status to ready with URLs:', updateData);
  }
}

async function handleVideoFailed(supabase: any, data: any) {
  console.log('Video generation failed:', data);
  
  const { error } = await supabase
    .from('video_responses')
    .update({
      status: 'failed',
      // error_message: data.error_message || 'Video generation failed'
    })
    .eq('tavus_video_id', data.video_id);

  if (error) {
    console.error('Error updating failed video:', error);
  } else {
    console.log('Successfully updated video status to failed');
  }
}

async function handleReplicaComplete(supabase: any, data: any) {
  console.log('Replica training completed:', data);
  // Add replica handling logic if needed
}

async function handleReplicaFailed(supabase: any, data: any) {
  console.log('Replica training failed:', data);
  // Add replica handling logic if needed
}

async function handleConversationEnded(supabase: any, data: any) {
  console.log('Conversation ended:', data);
  // Add conversation handling logic if needed
}