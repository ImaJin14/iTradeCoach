// lib/daily.ts
import DailyIframe from '@daily-co/daily-js';

export interface DailyConfig {
  roomUrl?: string;
  token?: string;
  userName?: string;
  userAvatar?: string;
}

export class DailyManager {
  private daily: any = null;
  private roomUrl: string;
  private config: DailyConfig;

  constructor(config: DailyConfig) {
    this.config = config;
    this.roomUrl = config.roomUrl || '';
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
            exp: Math.round(Date.now() / 1000) + (4 * 60 * 60),
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get or create room');
      }

      const data = await response.json();
      this.roomUrl = data.url;
      
      return {
        roomUrl: data.url,
        token: data.token
      };
    } catch (error) {
      console.error('Error getting/creating Daily room:', error);
      throw error;
    }
  }

  async joinRoom(roomUrl: string, config?: DailyConfig): Promise<any> {
    try {
      // Create iframe with Daily's prebuilt UI
      this.daily = DailyIframe.createFrame({
        iframeStyle: {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: 'none',
          zIndex: '9999'
        },
        showLeaveButton: true,
        showFullscreenButton: true,
        showParticipantsBar: true,
      });

      const joinConfig = {
        url: roomUrl,
        userName: config?.userName || this.config.userName || 'Participant',
        startAudioOff: true,
        startVideoOff: true,
        token: config?.token
      };

      await this.daily.join(joinConfig);
      return this.daily;
    } catch (error) {
      console.error('Error joining Daily room:', error);
      throw error;
    }
  }

  async leaveRoom(): Promise<void> {
    if (this.daily) {
      await this.daily.leave();
      this.daily.destroy();
      this.daily = null;
    }
  }

  onParticipantJoined(callback: (participant: any) => void) {
    if (this.daily) {
      this.daily.on('participant-joined', callback);
    }
  }

  onParticipantLeft(callback: (participant: any) => void) {
    if (this.daily) {
      this.daily.on('participant-left', callback);
    }
  }

  onCallStateChanged(callback: (state: any) => void) {
    if (this.daily) {
      this.daily.on('call-state-changed', callback);
    }
  }

  getParticipants() {
    return this.daily ? this.daily.participants() : {};
  }

  getCallState() {
    return this.daily ? this.daily.callState() : null;
  }
}