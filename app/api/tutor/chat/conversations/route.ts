// app/api/tutor/chat/conversations/route.ts - Fixed with awaited cookies
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
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in GET conversations:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching conversations for user:', user.id);

    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        message_count,
        last_message_at
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    console.log('Found conversations:', conversations?.length || 0);
    return NextResponse.json({ conversations: conversations || [] });
  } catch (error: any) {
    console.error('Error in conversations GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, firstMessage } = await request.json();
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error in POST conversations:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Creating conversation for user:', user.id, 'with title:', title);

    // Create new conversation
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: title || 'New Chat with iTrader',
        message_count: 1
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json({ 
        error: 'Failed to create conversation', 
        details: convError.message 
      }, { status: 500 });
    }

    console.log('Conversation created successfully:', conversation.id);

    // If there's a first message, save it
    if (firstMessage && conversation) {
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          content: firstMessage,
          sender: 'user',
          timestamp: new Date().toISOString()
        });

      if (msgError) {
        console.error('Error saving first message:', msgError);
        // Don't fail the conversation creation if message save fails
      } else {
        console.log('First message saved successfully');
      }
    }

    return NextResponse.json({ conversation });
  } catch (error: any) {
    console.error('Error in conversations POST API:', error);
    return NextResponse.json({ 
      error: 'Failed to create conversation',
      details: error.message 
    }, { status: 500 });
  }
}