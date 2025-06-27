import { NextRequest, NextResponse } from 'next/server';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export async function POST(request: NextRequest) {
  try {
    if (!DAILY_API_KEY) {
      return NextResponse.json(
        { error: 'Daily API key not configured' },
        { status: 500 }
      );
    }

    const { sessionId, properties } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Create room
    const roomResponse = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `session-${sessionId}`,
        properties: {
          start_audio_off: true,
          start_video_off: true,
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          enable_prejoin_ui: false,
          max_participants: 10,
          ...properties
        },
      }),
    });

    if (!roomResponse.ok) {
      const errorData = await roomResponse.text();
      console.error('Daily API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: roomResponse.status }
      );
    }

    const roomData = await roomResponse.json();

    // Create meeting token (optional but recommended)
    const tokenResponse = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomData.name,
          is_owner: false,
          exp: Math.round(Date.now() / 1000) + (4 * 60 * 60), // 4 hours
        },
      }),
    });

    let token = null;
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      token = tokenData.token;
    }

    return NextResponse.json({
      url: roomData.url,
      name: roomData.name,
      token: token,
    });

  } catch (error) {
    console.error('Error creating Daily room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}