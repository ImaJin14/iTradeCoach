// app/api/tutor/start-contextual-session/route.ts - Fixed version
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';
import { tavusCVIService } from '@/lib/tavus-cvi';
import { tavusService } from '@/lib/tavus';

export async function POST(request: Request) {
  try {
    const { context, coachId } = await request.json();
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

    // Get replica ID
    let replicaId = '';
    if (coachId && coachId !== 'stock') {
      const { data: coach } = await supabase
        .from('coach_profiles')
        .select('tavus_replica_id, tavus_replica_status')
        .eq('coach_id', coachId)
        .single();
      
      if (coach?.tavus_replica_id && coach.tavus_replica_status === 'completed') {
        replicaId = coach.tavus_replica_id;
      }
    }
    
    if (!replicaId) {
      try {
        const stockReplicas = await tavusService.getStockReplicas();
        if (stockReplicas.length === 0) {
          throw new Error('No suitable replicas available');
        }
        
        // Select a professional replica for conversational sessions
        const professionalReplicas = stockReplicas.filter(replica => {
          const name = replica.replica_name.toLowerCase();
          return name.includes('office') || 
                 (!name.includes('selfie') && 
                  !name.includes('vertical') &&
                  !name.includes('greenscreen'));
        });
        
        const selectedReplica = professionalReplicas.length > 0 
          ? professionalReplicas[0] 
          : stockReplicas[0];
          
        replicaId = selectedReplica.replica_id;
        console.log(`Selected replica for conversation: ${selectedReplica.replica_name} (${selectedReplica.model_name})`);
        
      } catch (error) {
        console.error('Error getting stock replicas:', error);
        return NextResponse.json({ 
          error: 'Unable to start live session. Video service temporarily unavailable.' 
        }, { status: 503 });
      }
    }

    // Start contextual session
    const conversation = await tavusCVIService.startContextualTutoringSession(
      replicaId,
      context,
      userProfile
    );

    // Save session record with context
    const { data: sessionRecord } = await supabase
      .from('tutoring_sessions')
      .insert({
        student_id: user.id,
        coach_id: coachId || 'stock',
        conversation_id: conversation.conversation_id,
        session_type: context.sessionType,
        status: 'active',
        daily_room_url: conversation.daily_room_url,
        context_metadata: context
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      sessionId: sessionRecord.id,
      conversationId: conversation.conversation_id,
      roomUrl: conversation.daily_room_url,
      sessionType: context.sessionType,
      message: context.sessionType === 'follow_up' 
        ? 'Follow-up session started! Your AI tutor knows what video you just watched.'
        : 'Live tutoring session started!'
    });

  } catch (error: any) {
    console.error('Error starting contextual session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to start tutoring session' 
    }, { status: 500 });
  }
}