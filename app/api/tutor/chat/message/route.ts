// app/api/tutor/chat/messages/route.ts - Fixed with awaited cookies
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

export async function POST(request: NextRequest) {
  try {
    const { conversationId, content, sender, topic, model } = await request.json();
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in POST message:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Saving message for user:', user.id, 'conversation:', conversationId);

    // Verify user owns this conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found for message save:', convError);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save message
    const { data: message, error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        content,
        sender,
        topic: topic || null,
        model: model || null,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error saving message:', msgError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    console.log('Message saved successfully:', message.id);
    return NextResponse.json({ message });
  } catch (error: any) {
    console.error('Error in messages POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}