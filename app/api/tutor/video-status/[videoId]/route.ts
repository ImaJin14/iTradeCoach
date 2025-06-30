// app/api/tutor/video-status/[videoId]/route.ts - Fixed with awaited params
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    // Await the params before using them
    const { videoId } = await params;
    
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking video status for:', videoId);

    // Get video status from database
    const { data: video, error } = await supabase
      .from('video_responses')
      .select(`
        id,
        status,
        url,
        hosted_url,
        stream_url,
        download_url,
        tavus_video_id,
        question,
        topic,
        created_at,
        updated_at,
        error_message,
        generation_progress,
        status_details
      `)
      .eq('id', videoId)
      .eq('student_id', user.id)
      .single();

    if (error || !video) {
      console.error('Video not found:', error);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // If video is still processing, check Tavus API for latest status
    if ((video.status === 'queued' || video.status === 'processing' || video.status === 'generating') && video.tavus_video_id) {
      try {
        console.log('Checking Tavus API for video:', video.tavus_video_id);
        
        const tavusResponse = await fetch(`https://tavusapi.com/v2/videos/${video.tavus_video_id}`, {
          headers: {
            'x-api-key': process.env.TAVUS_API_KEY!
          }
        });

        if (tavusResponse.ok) {
          const tavusData = await tavusResponse.json();
          console.log('Tavus API response:', tavusData);
          
          // Update database if status has changed
          if (tavusData.status !== video.status || (tavusData.status === 'ready' && !video.url)) {
            const updateData: any = {
              status: tavusData.status,
              updated_at: new Date().toISOString()
            };

            // Handle different URL types from Tavus
            if (tavusData.hosted_url) {
              updateData.hosted_url = tavusData.hosted_url;
              if (!video.url) updateData.url = tavusData.hosted_url;
            }
            if (tavusData.stream_url) {
              updateData.stream_url = tavusData.stream_url;
              if (!video.url && !updateData.url) updateData.url = tavusData.stream_url;
            }
            if (tavusData.download_url) {
              updateData.download_url = tavusData.download_url;
              if (!video.url && !updateData.url) updateData.url = tavusData.download_url;
            }
            if (tavusData.status_details) updateData.status_details = tavusData.status_details;

            console.log('Updating video record with:', updateData);

            const { error: updateError } = await supabase
              .from('video_responses')
              .update(updateData)
              .eq('id', videoId);

            if (updateError) {
              console.error('Error updating video:', updateError);
            } else {
              console.log('Successfully updated video status');
            }

            // Return updated data
            return NextResponse.json({
              ...video,
              ...updateData
            });
          }
        } else {
          console.error('Tavus API error:', tavusResponse.status, await tavusResponse.text());
        }
      } catch (tavusError) {
        console.error('Error checking Tavus status:', tavusError);
        // Continue with database data
      }
    }

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('Error checking video status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}