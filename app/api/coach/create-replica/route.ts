// app/api/coach/create-replica/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { tavusService } from '@/lib/tavus';

export async function POST(request: Request) {
  try {
    const { trainingVideoUrl, replicaName } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a coach
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can create replicas' }, { status: 403 });
    }

    // Create replica with Tavus
    const replicaResponse = await tavusService.createReplica({
      train_video_url: trainingVideoUrl,
      replica_name: replicaName || `${user.id}-replica`,
    });

    // Update coach profile
    const { error: updateError } = await supabase
      .from('coach_profiles')
      .update({
        tavus_replica_id: replicaResponse.replica_id,
        tavus_replica_status: 'training',
        tavus_training_video_url: trainingVideoUrl,
        replica_created_at: new Date().toISOString()
      })
      .eq('coach_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      replicaId: replicaResponse.replica_id,
      status: 'training'
    });

  } catch (error: any) {
    console.error('Replica creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create replica' 
    }, { status: 500 });
  }
}