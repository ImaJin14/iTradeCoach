// app/api/tutor/start-contextual-session/route.ts - Fixed with valid properties only
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';
import { tavusCVIService } from '@/lib/tavus-cvi';
import { iTraderService } from '@/lib/itrader-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const context = body.context || body; // Handle both formats
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for additional context
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('trading_experience, interests')
      .eq('id', user.id)
      .single();

    // Always use iTrader configuration
    const iTraderConfig = await iTraderService.getITraderConfig();
    
    console.log(`Starting session with iTrader using replica: ${iTraderConfig.replicaId}`);
    console.log('Session context:', JSON.stringify(context, null, 2));

    // Ensure sessionType has a default value
    const sessionType = context?.sessionType || 'initial';
    const topic = context?.topic || 'General Trading';
    const topicLevel = context?.topicLevel || 'general';

    // Try to start contextual session with CVI using iTrader
    try {
      console.log('Starting iTrader CVI session...');
      
      // Create iTrader persona with context (no custom_greeting here)
      const personaId = await iTraderService.createITraderPersona({
        ...context,
        sessionType,
        topic,
        topicLevel
      });
      
      // Create custom greeting for conversation (this IS valid here)
      let customGreeting = "Hi there! I'm iTrader, your AI trading tutor. Great to meet you!";
      
      if (topic && topic !== 'General Trading') {
        if (sessionType === 'follow_up') {
          customGreeting = `Hi! Welcome back. I see you just watched my video about "${context.previousQuestion}". I'm ready to dive deeper into ${topic} and answer any follow-up questions you might have. What specific part would you like to explore further?`;
        } else {
          customGreeting = `Hi there! I'm iTrader, your AI trading tutor. I see you want to learn about ${topic} - excellent choice! This is ${topicLevel === 'beginner' ? 'a beginner' : topicLevel === 'intermediate' ? 'an intermediate' : topicLevel === 'advanced' ? 'an advanced' : 'an important'} level topic that can really improve your trading. Let me start by asking: what's your current experience with ${topic}? Are you completely new to this, or do you have some background? This will help me tailor our discussion to your level.`;
        }
      }
      
      // Create conversation with iTrader and custom greeting - FIXED properties
      const conversation = await tavusCVIService.makeRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          replica_id: iTraderConfig.replicaId,
          persona_id: personaId,
          conversation_name: `iTrader ${sessionType} Session - ${topic} - ${new Date().toISOString()}`,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/tavus`,
          // Custom greeting IS valid for conversations endpoint
          custom_greeting: customGreeting,
          // Additional conversational context
          conversational_context: `This is a ${sessionType} tutoring session about ${topic} with iTrader, the AI trading tutor. The student is seeking ${topicLevel} level guidance. Be proactive, educational, and start the conversation immediately.`,
          // FIXED: Only use valid properties according to Tavus documentation
          properties: {
            max_call_duration: 3600,
            participant_left_timeout: 60,
            participant_absent_timeout: 300,
            enable_recording: false,
            enable_closed_captions: true,
            language: "english"
            // REMOVED: enable_interruptions and participant_pause_sensitivity - these are not valid
          }
        }),
      });

      // Save session record with iTrader as coach
      const { data: sessionRecord } = await supabase
        .from('tutoring_sessions')
        .insert({
          student_id: user.id,
          coach_id: 'itrader',
          conversation_id: conversation.conversation_id,
          session_type: sessionType,
          status: 'active',
          daily_room_url: conversation.conversation_url,
          context_metadata: {
            ...context,
            sessionType,
            topic,
            topicLevel,
            coach_name: 'iTrader',
            coach_type: 'ai_tutor',
            custom_greeting: customGreeting,
            persona_id: personaId
          }
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        sessionId: sessionRecord.id,
        conversationId: conversation.conversation_id,
        roomUrl: conversation.conversation_url,
        sessionType: sessionType,
        topic: topic,
        coach: {
          name: iTraderConfig.name,
          description: iTraderConfig.description,
          avatar_url: iTraderConfig.avatar_url
        },
        provider: 'tavus_cvi',
        message: sessionType === 'follow_up' 
          ? 'Follow-up session with iTrader started! Your AI tutor knows what video you just watched and will start the conversation.'
          : `Live session with iTrader started! Your AI tutor will immediately begin discussing ${topic}.`
      });

    } catch (cviError: any) {
      console.error('iTrader CVI Error:', cviError.message);
      
      // Return iTrader-specific error messages
      const isAccessError = cviError.message.includes('permissions') || 
                           cviError.message.includes('plan') ||
                           cviError.message.includes('Invalid API key');
      
      const isNetworkError = cviError.message.includes('timeout') ||
                            cviError.message.includes('network') ||
                            cviError.message.includes('connect');

      const isBadRequestError = cviError.message.includes('Bad Request') ||
                               cviError.message.includes('400');

      if (isAccessError) {
        return NextResponse.json({ 
          error: 'Live video sessions with iTrader require CVI access. Please contact support to unlock this feature.',
          errorType: 'access_required',
          coach: 'iTrader',
          alternatives: [
            'Continue chatting with iTrader via text',
            'Request a personalized video response from iTrader',
            'Contact support for CVI access'
          ]
        }, { status: 403 });
      }

      if (isBadRequestError) {
        return NextResponse.json({ 
          error: 'There was an issue with the session request. This might be due to API limitations.',
          errorType: 'bad_request',
          coach: 'iTrader',
          details: cviError.message,
          alternatives: [
            'Try starting the session again',
            'Chat with iTrader via text instead',
            'Request a personalized video response instead'
          ]
        }, { status: 400 });
      }

      if (isNetworkError) {
        return NextResponse.json({ 
          error: 'Unable to connect to iTrader live video service. Please try again in a few moments.',
          errorType: 'network_error',
          coach: 'iTrader',
          alternatives: [
            'Try again in a few minutes',
            'Chat with iTrader via text instead',
            'Request a personalized video response from iTrader'
          ]
        }, { status: 503 });
      }

      return NextResponse.json({ 
        error: 'iTrader live video sessions are temporarily unavailable.',
        errorType: 'service_unavailable',
        coach: 'iTrader',
        details: cviError.message,
        alternatives: [
          'Chat with iTrader via text for instant help',
          'Request a personalized video response from iTrader',
          'Try again in a few minutes'
        ]
      }, { status: 503 });
    }

  } catch (error: any) {
    console.error('Error starting iTrader session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to start session with iTrader',
      errorType: 'general_error'
    }, { status: 500 });
  }
}