// app/api/tutor/generate-video/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { tavusService } from '@/lib/tavus';

export async function POST(request: Request) {
  try {
    const { question, coachId, topicHint } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get coach's Tavus replica ID
    const { data: coach, error: coachError } = await supabase
      .from('coach_profiles')
      .select('tavus_replica_id, tavus_replica_status')
      .eq('coach_id', coachId)
      .single();

    if (coachError || !coach?.tavus_replica_id) {
      return NextResponse.json({ 
        error: 'Coach replica not available' 
      }, { status: 400 });
    }

    if (coach.tavus_replica_status !== 'completed') {
      return NextResponse.json({ 
        error: 'Coach replica is still training' 
      }, { status: 400 });
    }

    // Create enhanced script with coaching context
    const script = generateCoachingScript(question, topicHint);

    // Generate video with Tavus
    const videoResponse = await tavusService.generateVideo({
      replica_id: coach.tavus_replica_id,
      script: script,
      video_name: `Trading Question Response - ${Date.now()}`,
    });

    // Find or create video template
    let templateId;
    const { data: existingTemplate } = await supabase
      .from('video_templates')
      .select('id')
      .eq('coach_id', coachId)
      .eq('name', 'Default AI Tutor Template')
      .single();

    if (existingTemplate) {
      templateId = existingTemplate.id;
    } else {
      const { data: newTemplate, error: templateError } = await supabase
        .from('video_templates')
        .insert({
          coach_id: coachId,
          tavus_template_id: coach.tavus_replica_id,
          name: 'Default AI Tutor Template',
          description: 'AI-generated responses to student questions',
          script: 'Default script for AI tutor responses'
        })
        .select('id')
        .single();

      if (templateError) throw templateError;
      templateId = newTemplate.id;
    }

    // Save video response record
    const { data: videoRecord, error: recordError } = await supabase
      .from('video_responses')
      .insert({
        template_id: templateId,
        coach_id: coachId,
        student_id: user.id,
        tavus_video_id: videoResponse.video_id,
        status: 'processing',
        question: question,
        topic: topicHint || 'General Trading Question'
      })
      .select()
      .single();

    if (recordError) throw recordError;

    return NextResponse.json({
      success: true,
      videoId: videoRecord.id,
      tavusVideoId: videoResponse.video_id,
      status: 'processing'
    });

  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate video' 
    }, { status: 500 });
  }
}

function generateCoachingScript(question: string, topicHint?: string): string {
  const intro = "Hello! Thank you for your excellent trading question.";
  const topicContext = topicHint ? `I see you're asking about ${topicHint}.` : '';
  const questionAck = `Your question was: "${question}"`;
  
  // Generate contextual response based on common trading topics
  let response = '';
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('risk') || lowerQuestion.includes('loss')) {
    response = `Risk management is absolutely crucial in trading. The key principle is never to risk more than you can afford to lose. I recommend using position sizing rules - typically no more than 1-2% of your account per trade. Always set stop losses before entering a position, and stick to them. Remember, preserving capital is more important than making profits.`;
  } else if (lowerQuestion.includes('technical') || lowerQuestion.includes('chart') || lowerQuestion.includes('indicator')) {
    response = `Technical analysis is a powerful tool for traders. Start with understanding support and resistance levels - these are price points where stocks historically bounce. Learn about trend lines and moving averages. The key is not to overwhelm yourself with too many indicators. Master 2-3 indicators rather than using dozens. Price action and volume are often the most reliable signals.`;
  } else if (lowerQuestion.includes('strategy') || lowerQuestion.includes('trading plan')) {
    response = `Having a solid trading strategy is essential for success. Your plan should include: entry and exit criteria, risk management rules, position sizing, and what markets you'll trade. Backtest your strategy on historical data first. Keep a trading journal to track what works and what doesn't. Remember, the best strategy is one you can follow consistently.`;
  } else if (lowerQuestion.includes('psychology') || lowerQuestion.includes('emotion') || lowerQuestion.includes('discipline')) {
    response = `Trading psychology is often the biggest challenge. Fear and greed are the enemy of good trading decisions. Develop rules and stick to them regardless of emotions. Practice meditation or mindfulness to stay calm under pressure. Never revenge trade after a loss. Take breaks when you're feeling emotional. Success in trading is more about discipline than being right all the time.`;
  } else {
    response = `This is a great question that many traders struggle with. The key to successful trading lies in education, practice, and discipline. Always do your own research, never risk more than you can afford to lose, and remember that trading is a marathon, not a sprint. Consider paper trading first to practice your strategies without real money at risk.`;
  }
  
  const conclusion = `I hope this helps answer your question. Remember, continuous learning and practice are the keys to trading success. Keep asking great questions and stay disciplined in your approach!`;
  
  return `${intro} ${topicContext} ${questionAck} ${response} ${conclusion}`;
}