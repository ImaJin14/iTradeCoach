// app/api/daily/get-or-create-room/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, properties } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const dailyApiKey = process.env.DAILY_API_KEY;
    if (!dailyApiKey) {
      return NextResponse.json({ error: 'Daily API key not configured' }, { status: 500 });
    }

    // Try to get existing room first
    const getRoomResponse = await fetch(`https://api.daily.co/v1/rooms/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    let roomData;

    if (getRoomResponse.ok) {
      // Room exists, use it
      roomData = await getRoomResponse.json();
      console.log('Using existing room:', roomData.url);
    } else if (getRoomResponse.status === 404) {
      // Room doesn't exist, create it
      const createRoomResponse = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dailyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionId,
          privacy: 'private',
          properties: {
            ...properties,
            enable_chat: true,
            enable_screenshare: true,
            enable_people_ui: true,
            start_audio_off: true,
            start_video_off: true,
          }
        }),
      });

      if (!createRoomResponse.ok) {
        const errorData = await createRoomResponse.json();
        console.error('Failed to create Daily room:', errorData);
        return NextResponse.json(
          { error: 'Failed to create room', details: errorData },
          { status: createRoomResponse.status }
        );
      }

      roomData = await createRoomResponse.json();
      console.log('Created new room:', roomData.url);
    } else {
      const errorData = await getRoomResponse.json();
      console.error('Failed to get room:', errorData);
      return NextResponse.json(
        { error: 'Failed to get room', details: errorData },
        { status: getRoomResponse.status }
      );
    }

    // Generate a meeting token
    const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          room_name: roomData.name,
          exp: Math.round(Date.now() / 1000) + (4 * 60 * 60), // 4 hours
        }
      }),
    });

    let token;
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      token = tokenData.token;
    }

    return NextResponse.json({
      url: roomData.url,
      name: roomData.name,
      token: token,
      isNewRoom: getRoomResponse.status === 404
    });

  } catch (error) {
    console.error('Error in get-or-create-room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}