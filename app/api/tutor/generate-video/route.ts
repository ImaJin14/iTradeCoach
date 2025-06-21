// // app/api/tutor/generate-video/route.ts - Final working version
// import { NextRequest, NextResponse } from 'next/server';
// import { tavusService } from '@/lib/tavus';
// import { createServerSupabaseClient } from '@/lib/supabase/api-server';

// export async function POST(request: NextRequest) {
//   try {
//     const { question, coachId, topicHint } = await request.json();
    
//     const supabase = await createServerSupabaseClient();
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
    
//     if (userError || !user) {
//       console.error('Auth error:', userError);
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     console.log('Generating video for user:', user.id);
//     console.log('Question:', question);

//     // Get available replicas
//     let replicaId = '';
//     let selectedReplica = null;
    
//     try {
//       console.log('Fetching suitable replicas...');
//       const stockReplicas = await tavusService.getStockReplicas();
//       console.log(`Found ${stockReplicas.length} suitable replicas`);
      
//       if (stockReplicas.length === 0) {
//         throw new Error('No suitable replicas available');
//       }
      
//       // Select a good replica for trading content
//       // Prefer professional-looking names for trading tutor
//       const professionalReplicas = stockReplicas.filter(replica => {
//         const name = replica.replica_name.toLowerCase();
//         return name.includes('office') || 
//                name.includes('professional') || 
//                !name.includes('selfie') && 
//                !name.includes('vertical') &&
//                !name.includes('greenscreen');
//       });
      
//       selectedReplica = professionalReplicas.length > 0 
//         ? professionalReplicas[0] 
//         : stockReplicas[0];
        
//       replicaId = selectedReplica.replica_id;
//       console.log(`Selected replica: ${selectedReplica.replica_name} (${selectedReplica.model_name})`);
      
//     } catch (replicaError) {
//       console.error('Error getting replicas:', replicaError);
//       return NextResponse.json({ 
//         error: 'Unable to access video generation service. Please try again later.',
//         details: replicaError instanceof Error ? replicaError.message : 'Unknown error'
//       }, { status: 503 });
//     }

//     // Generate enhanced script
//     const script = tavusService.generateTradingScript(question, topicHint, 'beginner');
//     console.log('Generated script length:', script.length);

//     // Generate video with Tavus
//     let videoResponse;
//     try {
//       console.log('Starting video generation...');
//       videoResponse = await tavusService.generateVideo({
//         replica_id: replicaId,
//         script: script,
//         video_name: `iTrader Response - ${Date.now()}`,
//       });
//       console.log('Video generation started:', videoResponse.video_id);
//     } catch (videoError) {
//       console.error('Video generation error:', videoError);
//       return NextResponse.json({ 
//         error: 'Failed to start video generation. Please try again.',
//         details: videoError instanceof Error ? videoError.message : 'Unknown error'
//       }, { status: 500 });
//     }

//     // Save video response record
//     try {
//       const { data: videoRecord, error: recordError } = await supabase
//         .from('video_responses')
//         .insert({
//           coach_id: coachId || 'stock',
//           student_id: user.id,
//           tavus_video_id: videoResponse.video_id,
//           status: 'processing',
//         })
//         .select()
//         .single();

//       if (recordError) {
//         console.error('Database error:', recordError);
//         // Continue anyway - the video will still be generated
//       }

//       return NextResponse.json({
//         success: true,
//         videoId: videoRecord?.id || videoResponse.video_id,
//         tavusVideoId: videoResponse.video_id,
//         status: 'processing',
//         message: 'Video generation started successfully',
//         replica: {
//           name: selectedReplica?.replica_name,
//           model: selectedReplica?.model_name
//         }
//       });

//     } catch (dbError) {
//       console.error('Database save error:', dbError);
      
//       // Return success anyway since video generation started
//       return NextResponse.json({
//         success: true,
//         videoId: videoResponse.video_id,
//         tavusVideoId: videoResponse.video_id,
//         status: 'processing',
//         message: 'Video generation started (database save had issues but video is processing)',
//         replica: {
//           name: selectedReplica?.replica_name,
//           model: selectedReplica?.model_name
//         }
//       });
//     }

//   } catch (error: any) {
//     console.error('Unexpected error in video generation:', error);
//     return NextResponse.json({ 
//       error: 'An unexpected error occurred. Please try again.',
//       details: error.message 
//     }, { status: 500 });
//   }
// }


// app/api/tutor/generate-video/route.ts - Enhanced error logging version
import { NextRequest, NextResponse } from 'next/server';
import { tavusService } from '@/lib/tavus';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';

export async function POST(request: NextRequest) {
  try {
    const { question, coachId, topicHint } = await request.json();
    
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== VIDEO GENERATION START ===');
    console.log('User ID:', user.id);
    console.log('Question:', question);
    console.log('Topic Hint:', topicHint);

    // Get available replicas
    let replicaId = '';
    let selectedReplica = null;
    
    try {
      console.log('Step 1: Fetching suitable replicas...');
      const stockReplicas = await tavusService.getStockReplicas();
      console.log(`Found ${stockReplicas.length} suitable replicas`);
      
      if (stockReplicas.length === 0) {
        console.error('No suitable replicas available');
        throw new Error('No suitable replicas available');
      }
      
      // Select a good replica for trading content
      const professionalReplicas = stockReplicas.filter(replica => {
        const name = replica.replica_name.toLowerCase();
        return name.includes('office') || 
               name.includes('professional') || 
               (!name.includes('selfie') && 
                !name.includes('vertical') &&
                !name.includes('greenscreen'));
      });
      
      selectedReplica = professionalReplicas.length > 0 
        ? professionalReplicas[0] 
        : stockReplicas[0];
        
      replicaId = selectedReplica.replica_id;
      console.log(`Selected replica: ${selectedReplica.replica_name} (${selectedReplica.model_name}) - ID: ${replicaId}`);
      
    } catch (replicaError) {
      console.error('Error getting replicas:', replicaError);
      return NextResponse.json({ 
        error: 'Unable to access video generation service. Please try again later.',
        details: replicaError instanceof Error ? replicaError.message : 'Unknown error'
      }, { status: 503 });
    }

    // Generate enhanced script
    let script;
    try {
      console.log('Step 2: Generating script...');
      script = tavusService.generateTradingScript(question, topicHint, 'beginner');
      console.log(`Generated script length: ${script.length} characters`);
      console.log(`Script preview: ${script.substring(0, 150)}...`);
    } catch (scriptError) {
      console.error('Error generating script:', scriptError);
      return NextResponse.json({ 
        error: 'Failed to generate script for video',
        details: scriptError instanceof Error ? scriptError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Generate video with Tavus
    let videoResponse;
    try {
      console.log('Step 3: Starting video generation with Tavus...');
      
      // Make direct API call with detailed logging
      const requestBody = {
        replica_id: replicaId,
        script: script,
        video_name: `iTrader Response - ${Date.now()}`,
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('https://tavusapi.com/v2/videos', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.TAVUS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Tavus API response status:', response.status);
      const responseText = await response.text();
      console.log('Tavus API response body:', responseText);

      if (!response.ok) {
        console.error('Tavus API error:', response.status, responseText);
        throw new Error(`Tavus API error: ${response.status} - ${responseText}`);
      }

      videoResponse = JSON.parse(responseText);
      console.log('Video generation started successfully:', videoResponse.video_id);
      
    } catch (videoError) {
      console.error('Video generation error details:', videoError);
      return NextResponse.json({ 
        error: 'Failed to start video generation. Please try again.',
        details: videoError instanceof Error ? videoError.message : 'Unknown error',
        debugInfo: {
          replicaId,
          scriptLength: script?.length,
          apiKeyPresent: !!process.env.TAVUS_API_KEY
        }
      }, { status: 500 });
    }

    // Save video response record
    try {
      console.log('Step 4: Saving to database...');
      const { data: videoRecord, error: recordError } = await supabase
        .from('video_responses')
        .insert({
          coach_id: coachId || 'stock',
          student_id: user.id,
          tavus_video_id: videoResponse.video_id,
          status: 'processing',
        })
        .select()
        .single();

      if (recordError) {
        console.error('Database error:', recordError);
        // Continue anyway - the video will still be generated
      } else {
        console.log('Saved to database with ID:', videoRecord.id);
      }

      console.log('=== VIDEO GENERATION SUCCESS ===');

      return NextResponse.json({
        success: true,
        videoId: videoRecord?.id || videoResponse.video_id,
        tavusVideoId: videoResponse.video_id,
        status: 'processing',
        message: 'Video generation started successfully! It will be ready in 2-3 minutes.',
        replica: {
          name: selectedReplica?.replica_name,
          model: selectedReplica?.model_name
        }
      });

    } catch (dbError) {
      console.error('Database save error:', dbError);
      
      // Return success anyway since video generation started
      return NextResponse.json({
        success: true,
        videoId: videoResponse.video_id,
        tavusVideoId: videoResponse.video_id,
        status: 'processing',
        message: 'Video generation started successfully! It will be ready in 2-3 minutes.',
        replica: {
          name: selectedReplica?.replica_name,
          model: selectedReplica?.model_name
        }
      });
    }

  } catch (error: any) {
    console.error('=== VIDEO GENERATION FAILED ===');
    console.error('Unexpected error:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.',
      details: error.message 
    }, { status: 500 });
  }
}