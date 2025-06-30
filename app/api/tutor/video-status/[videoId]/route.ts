// app/api/tutor/video-status/[videoId]/route.ts - Enhanced video status management
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Checking video status for:', params.videoId);

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
        status_details,
        processing_duration
      `)
      .eq('id', params.videoId)
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
            'x-api-key': process.env.TAVUS_API_KEY!,
            'Content-Type': 'application/json'
          }
        });

        if (tavusResponse.ok) {
          const tavusData = await tavusResponse.json();
          console.log('Tavus API response:', {
            status: tavusData.status,
            video_id: tavusData.video_id,
            has_hosted_url: !!tavusData.hosted_url,
            has_stream_url: !!tavusData.stream_url,
            has_download_url: !!tavusData.download_url
          });
          
          // Update database if status has changed
          if (tavusData.status !== video.status || (tavusData.status === 'ready' && !video.url)) {
            const updateData: any = {
              status: tavusData.status,
              updated_at: new Date().toISOString()
            };

            // Store all available URLs
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
            if (tavusData.error_message) updateData.error_message = tavusData.error_message;

            // Calculate processing duration
            if (tavusData.status === 'ready' || tavusData.status === 'failed') {
              const processingTime = Math.round((new Date().getTime() - new Date(video.created_at).getTime()) / 1000);
              updateData.processing_duration = processingTime;
            }

            console.log('Updating video record with:', updateData);

            const { error: updateError } = await supabase
              .from('video_responses')
              .update(updateData)
              .eq('id', params.videoId);

            if (updateError) {
              console.error('Error updating video:', updateError);
            } else {
              console.log('Successfully updated video status');
            }

            // Return updated data
            return NextResponse.json({
              ...video,
              ...updateData,
              tavus_data: tavusData // Include raw Tavus data for debugging
            });
          }
        } else {
          const errorText = await tavusResponse.text();
          console.error('Tavus API error:', tavusResponse.status, errorText);
          
          // If Tavus returns 404, the video might have been deleted or never existed
          if (tavusResponse.status === 404) {
            const { error: updateError } = await supabase
              .from('video_responses')
              .update({
                status: 'failed',
                error_message: 'Video not found in Tavus system',
                updated_at: new Date().toISOString()
              })
              .eq('id', params.videoId);

            if (!updateError) {
              return NextResponse.json({
                ...video,
                status: 'failed',
                error_message: 'Video not found in Tavus system'
              });
            }
          }
        }
      } catch (tavusError: any) {
        console.error('Error checking Tavus status:', tavusError);
        // Continue with database data if Tavus check fails
      }
    }

    return NextResponse.json(video);
  } catch (error: any) {
    console.error('Error checking video status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// Update video status manually (for admin or debugging)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { status, url, error_message, status_details } = await request.json();
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns this video
    const { data: video, error: videoError } = await supabase
      .from('video_responses')
      .select('id, student_id')
      .eq('id', params.videoId)
      .eq('student_id', user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Update video status
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (url) updateData.url = url;
    if (error_message) updateData.error_message = error_message;
    if (status_details) updateData.status_details = status_details;

    const { data: updatedVideo, error: updateError } = await supabase
      .from('video_responses')
      .update(updateData)
      .eq('id', params.videoId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating video:', updateError);
      return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      video: updatedVideo
    });

  } catch (error: any) {
    console.error('Error updating video status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}