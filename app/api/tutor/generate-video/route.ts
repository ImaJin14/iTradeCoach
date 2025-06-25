// app/api/tutor/generate-video/route.ts - Enhanced to store question and topic
import { NextRequest, NextResponse } from 'next/server';
import { iTraderService } from '@/lib/itrader-config';
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

    // Generate video with Tavus using iTrader
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
      throw new Error(`Tavus API error: ${videoResponse.status} - ${errorText}`);
    }

    const videoData = await videoResponse.json();
    console.log('iTrader video generation started:', videoData.video_id);

    // Save video response record with full context - ENHANCED
    const { data: videoRecord, error: recordError } = await supabase
      .from('video_responses')
      .insert({
        coach_id: 'itrader',
        student_id: user.id,
        tavus_video_id: videoData.video_id,
        status: 'processing',
        // Store the question and topic for reference
        question: question,
        topic: topicHint,
        user_level: userProfile?.trading_experience || userLevel || 'beginner',
        script_used: script, // Optional: store the script for reference
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

    if (recordError) {
      console.error('Database error:', recordError);
    }

    console.log('=== iTrader VIDEO GENERATION SUCCESS ===');

    return NextResponse.json({
      success: true,
      videoId: videoRecord?.id || videoData.video_id,
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

  } catch (error: any) {
    console.error('=== iTrader VIDEO GENERATION FAILED ===');
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'iTrader encountered an issue creating your video. Please try again.',
      details: error.message 
    }, { status: 500 });
  }
}