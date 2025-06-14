// lib/tavus.ts
interface TavusReplicaResponse {
  replica_id: string;
  status: 'training' | 'completed' | 'error';
  created_at: string;
}

interface TavusVideoResponse {
  video_id: string;
  status: 'processing' | 'completed' | 'error';
  hosted_url?: string;
  created_at: string;
}

class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor() {
    this.apiKey = process.env.TAVUS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('TAVUS_API_KEY is required');
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tavus API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async createReplica(params: {
    train_video_url: string;
    replica_name: string;
    callback_url?: string;
  }): Promise<TavusReplicaResponse> {
    return this.makeRequest('/replicas', {
      method: 'POST',
      body: JSON.stringify({
        train_video_url: params.train_video_url,
        replica_name: params.replica_name,
        callback_url: params.callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/tavus`,
      }),
    });
  }

  async generateVideo(params: {
    replica_id: string;
    script: string;
    video_name?: string;
    background_url?: string;
  }): Promise<TavusVideoResponse> {
    return this.makeRequest('/videos', {
      method: 'POST',
      body: JSON.stringify({
        replica_id: params.replica_id,
        script: params.script,
        video_name: params.video_name,
        background_url: params.background_url,
      }),
    });
  }

  async getVideoStatus(videoId: string) {
    return this.makeRequest(`/videos/${videoId}`);
  }

  async getReplicaStatus(replicaId: string) {
    return this.makeRequest(`/replicas/${replicaId}`);
  }
}

export const tavusService = new TavusService();