import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Handle different webhook events
    switch (body.event) {
      case 'video.ready':
        // Update video status in database
        await supabase
          .from('video_responses')
          .update({
            status: 'ready',
            url: body.data.url
          })
          .eq('tavus_video_id', body.data.id);
        break;

      case 'video.failed':
        // Update video status to failed
        await supabase
          .from('video_responses')
          .update({
            status: 'failed'
          })
          .eq('tavus_video_id', body.data.id);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}