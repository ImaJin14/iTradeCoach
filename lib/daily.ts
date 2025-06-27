// lib/daily.ts
export interface DailyConfig {
  roomUrl?: string;
  token?: string;
  userName?: string;
  userAvatar?: string;
}

export class DailyManager {
  private config: DailyConfig;

  constructor(config: DailyConfig) {
    this.config = config;
  }

  async getOrCreateRoom(sessionId: string): Promise<{ roomUrl: string; token?: string }> {
    try {
      const response = await fetch('/api/daily/get-or-create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          properties: {
            start_audio_off: true,
            start_video_off: true,
            enable_screenshare: true,
            enable_chat: true,
            enable_people_ui: true,
            max_participants: 20,
            exp: Math.round(Date.now() / 1000) + (4 * 60 * 60), // 4 hours from now
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get or create room');
      }

      const data = await response.json();
      
      return {
        roomUrl: data.url,
        token: data.token
      };
    } catch (error) {
      console.error('Error getting/creating Daily room:', error);
      throw error;
    }
  }
}