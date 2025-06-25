// app/api/tutor/end-session/route.ts - Enhanced session ending
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';
import { tavusCVIService } from '@/lib/tavus-cvi';

export async function POST(request: Request) {
  try {
    const { sessionId, conversationId } = await request.json();
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Ending session:', { sessionId, conversationId });

    // Update session status in database
    if (sessionId) {
      const { error: updateError } = await supabase
        .from('tutoring_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('student_id', user.id);

      if (updateError) {
        console.error('Error updating session status:', updateError);
      } else {
        console.log('Session status updated successfully');
      }
    }

    // End the conversation with Tavus CVI
    if (conversationId) {
      try {
        await tavusCVIService.endSession(conversationId);
        console.log('CVI conversation ended successfully');
      } catch (cviError) {
        console.error('Error ending CVI session:', cviError);
        // Don't fail the request if CVI end fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error: any) {
    console.error('Error ending session:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to end session' 
    }, { status: 500 });
  }
}