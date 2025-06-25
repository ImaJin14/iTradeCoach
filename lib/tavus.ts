// lib/tavus.ts - Complete corrected file
interface TavusReplicaResponse {
  replica_id: string;
  status: 'training' | 'completed' | 'error';
  created_at: string;
  model_name?: 'phoenix-1' | 'phoenix-2' | 'phoenix-3';
  callback_url?: string;
}

interface TavusVideoResponse {
  video_id: string;
  video_name: string;
  status: string;
  hosted_url?: string;
  created_at: string;
}

interface TavusReplica {
  replica_id: string;
  replica_name: string;
  status: string;
  model_name: string;
  created_at: string;
  updated_at: string;
  thumbnail_video_url?: string;
  training_progress?: string;
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

  // Get all replicas from the main endpoint
  async getAllReplicas(): Promise<TavusReplica[]> {
    const response = await this.makeRequest('/replicas');
    return response.data || response;
  }

  // Get suitable replicas for our trading tutor
  async getStockReplicas(): Promise<TavusReplica[]> {
    try {
      console.log('Fetching all replicas from Tavus...');
      const allReplicas = await this.getAllReplicas();
      console.log(`Found ${allReplicas.length} total replicas`);
      
      // Filter for high-quality, suitable replicas
      const suitableReplicas = allReplicas.filter(replica => {
        // Must be completed
        if (replica.status !== 'completed') return false;
        
        // Skip deprecated replicas
        if (replica.replica_name.toLowerCase().includes('deprecated')) return false;
        
        // Prefer Phoenix-2 and Phoenix-3 models over Phoenix-1
        if (replica.model_name === 'phoenix-1') return false;
        
        // Skip obvious test replicas with gibberish names
        const name = replica.replica_name.toLowerCase();
        if (name.length < 4 || /^[a-z]{4,8}$/.test(name)) return false;
        
        return true;
      });

      console.log(`Filtered to ${suitableReplicas.length} suitable replicas`);
      
      // Sort by model version (prefer Phoenix-3) and creation date
      const sortedReplicas = suitableReplicas.sort((a, b) => {
        // Prefer Phoenix-3 over Phoenix-2
        if (a.model_name === 'phoenix-3' && b.model_name === 'phoenix-2') return -1;
        if (a.model_name === 'phoenix-2' && b.model_name === 'phoenix-3') return 1;
        
        // Then sort by creation date (newer first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Return top 20 replicas for variety
      const selectedReplicas = sortedReplicas.slice(0, 20);
      
      console.log('Selected replicas:', selectedReplicas.map(r => `${r.replica_name} (${r.model_name})`));
      
      return selectedReplicas;
      
    } catch (error) {
      console.error('Error fetching replicas:', error);
      throw new Error(`Failed to fetch replicas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create personal replica with Phoenix-3
  async createPersonalReplica(params: {
    train_video_url: string;
    replica_name: string;
    callback_url?: string;
    model_name?: 'phoenix-2' | 'phoenix-3';
  }): Promise<TavusReplicaResponse> {
    return this.makeRequest('/replicas', {
      method: 'POST',
      body: JSON.stringify({
        train_video_url: params.train_video_url,
        replica_name: params.replica_name,
        model_name: params.model_name || 'phoenix-3',
        callback_url: params.callback_url,
      }),
    });
  }

  // Generate video
  async generateVideo(params: {
    replica_id: string;
    script: string;
    video_name?: string;
    background_url?: string;
  }): Promise<TavusVideoResponse> {
    // Only include supported parameters according to API docs
    const requestBody: any = {
      replica_id: params.replica_id,
      script: params.script,
    };

    // Optional parameters
    if (params.video_name) {
      requestBody.video_name = params.video_name;
    }

    if (params.background_url) {
      requestBody.background_url = params.background_url;
    }

    console.log('Generating video with request body:', JSON.stringify(requestBody, null, 2));

    return this.makeRequest('/videos', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async getVideoStatus(videoId: string) {
    return this.makeRequest(`/videos/${videoId}`);
  }

  async getReplicaStatus(replicaId: string) {
    return this.makeRequest(`/replicas/${replicaId}`);
  }

  async listReplicas() {
    return this.makeRequest('/replicas');
  }
}

export const tavusService = new TavusService();