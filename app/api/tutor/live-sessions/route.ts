// app/api/tutor/live-sessions/route.ts - Get live session history
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/api-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in GET live sessions:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching live sessions for user:', user.id);

    const { data: sessions, error } = await supabase
      .from('tutoring_sessions')
      .select(`
        id,
        coach_id,
        session_type,
        status,
        topic,
        started_at,
        ended_at,
        duration_minutes,
        context_metadata
      `)
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching live sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch live sessions' }, { status: 500 });
    }

    console.log('Found live sessions:', sessions?.length || 0);
    return NextResponse.json({ sessions: sessions || [] });
  } catch (error: any) {
    console.error('Error in live sessions GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}