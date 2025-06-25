// app/api/tutor/chat/conversations/[id]/route.ts - Fixed with awaited cookies
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Create a proper server-side supabase client
async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in GET conversation:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching conversation:', params.id, 'for user:', user.id);

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id, title')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select(`
        id,
        content,
        sender,
        timestamp,
        topic,
        model
      `)
      .eq('conversation_id', params.id)
      .order('timestamp', { ascending: true });

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    console.log('Found messages:', messages?.length || 0);
    return NextResponse.json({ 
      conversation,
      messages: messages || [] 
    });
  } catch (error: any) {
    console.error('Error in conversation GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in DELETE conversation:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Deleting conversation:', params.id, 'for user:', user.id);

    // Delete conversation (messages will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }

    console.log('Conversation deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in conversation DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}