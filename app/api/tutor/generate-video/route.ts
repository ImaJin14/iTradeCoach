// app/api/tutor/generate-video/route.ts - Updated to use your existing iTrader data
import { NextRequest, NextResponse } from 'next/server';
import { iTraderService, ITRADER_COACH_ID, ITRADER_TEMPLATE_ID } from '@/lib/itrader-config';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';

export async function POST(request: NextRequest) {
  try {
    const { question, topicHint, userLevel } = await request.json();
    
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== iTrader VIDEO GENERATION START ===');
    console.log('User ID:', user.id);
    console.log('Question:', question);
    console.log('Topic Hint:', topicHint);
    console.log('Using existing iTrader Coach ID:', ITRADER_COACH_ID);
    console.log('Using existing Template ID:', ITRADER_TEMPLATE_ID);

    // Get user profile for personalization
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('trading_experience')
      .eq('id', user.id)
      .single();

    // Always use iTrader configuration
    const iTraderConfig = await iTraderService.getITraderConfig();
    
    console.log(`Using iTrader replica: ${iTraderConfig.replicaId}`);

    // Generate iTrader script with full context
    const script = iTraderService.generateITraderScript(
      question, 
      topicHint, 
      userProfile?.trading_experience || userLevel || 'beginner'
    );
    
    console.log(`Generated iTrader script length: ${script.length} characters`);

    // First, create a placeholder record in the database with your existing UUIDs
    const { data: placeholderRecord, error: placeholderError } = await supabase
      .from('video_responses')
      .insert({
        coach_id: ITRADER_COACH_ID, // Use your existing coach UUID
        student_id: user.id,
        tavus_video_id: 'pending', // Temporary value
        status: 'queued',
        question: question,
        topic: topicHint,
        user_level: userProfile?.trading_experience || userLevel || 'beginner',
        script_used: script,
        template_id: ITRADER_TEMPLATE_ID, // Use your existing template ID
        metadata: {
          question,
          topic_hint: topicHint,
          coach_name: 'iTrader',
          coach_type: 'ai_tutor',
          user_level: userProfile?.trading_experience || userLevel || 'beginner'
        }
      })
      .select()
      .single();

    if (placeholderError) {
      console.error('Database placeholder error:', placeholderError);
      throw new Error('Failed to create video record');
    }

    console.log('Created placeholder record with ID:', placeholderRecord.id);

    // Now generate video with Tavus using iTrader
    try {
      const videoResponse = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.TAVUS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replica_id: iTraderConfig.replicaId,
          script: script,
          video_name: `iTrader Response - ${topicHint || 'General'} - ${Date.now()}`,
        }),
      });

      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        console.error('Tavus API error:', videoResponse.status, errorText);
        
        // Update record with error status
        await supabase
          .from('video_responses')
          .update({
            status: 'failed',
            error_message: `Tavus API error: ${videoResponse.status} - ${errorText}`
          })
          .eq('id', placeholderRecord.id);
        
        throw new Error(`Tavus API error: ${videoResponse.status} - ${errorText}`);
      }

      const videoData = await videoResponse.json();
      console.log('iTrader video generation started:', videoData.video_id);

      // Update the record with the actual Tavus video ID and processing status
      const { error: updateError } = await supabase
        .from('video_responses')
        .update({
          tavus_video_id: videoData.video_id,
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', placeholderRecord.id);

      if (updateError) {
        console.error('Database update error:', updateError);
      }

      console.log('=== iTrader VIDEO GENERATION SUCCESS ===');
      console.log('Database record ID:', placeholderRecord.id);
      console.log('Tavus video ID:', videoData.video_id);

      return NextResponse.json({
        success: true,
        // Return the database record ID for polling (NOT the Tavus video ID)
        videoId: placeholderRecord.id,
        tavusVideoId: videoData.video_id,
        status: 'processing',
        message: 'Creating your personalized video response! It will be ready in 2-3 minutes.',
        question: question,
        topic: topicHint,
        coach: {
          name: iTraderConfig.name,
          description: iTraderConfig.description,
          avatar_url: iTraderConfig.avatar_url
        }
      });

    } catch (tavusError: any) {
      console.error('Tavus generation error:', tavusError);
      
      // Update record with error status
      await supabase
        .from('video_responses')
        .update({
          status: 'failed',
          error_message: tavusError.message
        })
        .eq('id', placeholderRecord.id);
      
      throw tavusError;
    }

  } catch (error: any) {
    console.error('=== iTrader VIDEO GENERATION FAILED ===');
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'iTrader encountered an issue creating your video. Please try again.',
      details: error.message 
    }, { status: 500 });
  }
}