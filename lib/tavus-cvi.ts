// lib/tavus-cvi.ts - Complete updated file with enhanced error handling
interface CVIPersona {
  persona_id: string;
  persona_name: string;
  system_prompt: string;
  default_replica_id?: string;
  context?: string;
}

interface CVIConversation {
  conversation_id: string;
  conversation_url: string;
  status: 'active' | 'ended';
  created_at: string;
}

interface SessionContext {
  previousQuestion?: string;
  previousTopic?: string;
  videoWatched?: boolean;
  sessionType: 'initial' | 'follow_up';
  context?: string;
}

class TavusCVIService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor() {
    this.apiKey = process.env.TAVUS_API_KEY!;
    if (!this.apiKey) {
      throw new Error('TAVUS_API_KEY is required');
    }
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Tavus CVI API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += ` - ${errorJson.message || errorJson.error || errorText}`;
          
          // Enhanced logging for debugging
          console.error('Tavus API Error Details:', {
            status: response.status,
            endpoint,
            error: errorJson,
            requestBody: options.body ? JSON.parse(options.body as string) : null,
            headers: options.headers
          });
        } catch {
          errorMessage += ` - ${errorText}`;
          console.error('Tavus API Error (non-JSON):', {
            status: response.status,
            endpoint,
            error: errorText,
            requestBody: options.body,
            headers: options.headers
          });
        }

        // Special handling for common errors
        if (response.status === 401) {
          throw new Error('Invalid API key or insufficient permissions for CVI features');
        }
        if (response.status === 403) {
          throw new Error('CVI features not available on your current plan');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later');
        }
        if (response.status === 400) {
          // Enhanced 400 error handling
          if (errorText.includes('custom_greeting') && endpoint.includes('personas')) {
            throw new Error('Bad Request - custom_greeting is not valid for personas endpoint. Use it in conversations instead.');
          }
          throw new Error(`Bad Request - ${errorMessage}. Please check your request parameters.`);
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - CVI service may be temporarily unavailable');
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to CVI service - please check your network connection');
      }
      
      throw error;
    }
  }

  async endSession(conversationId: string) {
    return this.makeRequest(`/conversations/${conversationId}/end`, {
      method: 'POST'
    });
  }

  async getSessionStatus(conversationId: string) {
    return this.makeRequest(`/conversations/${conversationId}`);
  }
}

export const tavusCVIService = new TavusCVIService();