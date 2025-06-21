// lib/tavus-cvi.ts - New file for real-time conversations
interface CVIPersona {
  persona_id: string;
  persona_name: string;
  system_prompt: string;
  voice_id?: string;
  replica_id?: string;
}

interface CVIConversation {
  conversation_id: string;
  daily_room_url: string;
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
      throw new Error(`Tavus CVI API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Create contextual AI Trading Tutor persona
  async createContextualTradingTutorPersona(
    replicaId: string, 
    context?: SessionContext
  ): Promise<CVIPersona> {
    const basePrompt = `You are an expert AI trading tutor with years of experience in financial markets.`;
    
    let contextualPrompt = basePrompt;
    
    if (context?.sessionType === 'follow_up' && context.previousQuestion) {
      contextualPrompt += `

IMPORTANT CONTEXT: The student just watched a video response where you explained: "${context.previousQuestion}"
${context.previousTopic ? `Topic: ${context.previousTopic}` : ''}

The student is now coming to you with follow-up questions or needs clarification about this topic. 
- Reference the previous explanation appropriately
- Ask what specific part they'd like clarified
- Be ready to dive deeper or explain differently
- You can say things like "In the video I just created for you, I mentioned..." or "Let's expand on what we covered..."
`;
    }

    contextualPrompt += `

You provide personalized guidance on:
- Technical analysis and chart patterns
- Risk management and position sizing  
- Trading psychology and discipline
- Market analysis and timing
- Options strategies and derivatives
- Portfolio management

Guidelines:
- Speak naturally and conversationally as if tutoring face-to-face
- Ask follow-up questions to understand the student's level and goals
- Use visual examples when possible (you can see their screen)
- Emphasize risk management and responsible trading
- Be encouraging but realistic about trading challenges
- Adapt your teaching style based on the student's reactions and engagement
- If they show confusion, simplify and provide more examples
- If they seem experienced, dive deeper into advanced concepts

Always maintain a supportive, professional teaching demeanor while being engaging and personable.`;

    return this.makeRequest('/personas', {
      method: 'POST',
      body: JSON.stringify({
        persona_name: `AI Trading Tutor - ${context?.sessionType || 'general'}`,
        replica_id: replicaId,
        system_prompt: contextualPrompt,
        properties: {
          vision_enabled: true,
          interruptions_enabled: true,
          emotion_detection: true,
          voice_speed: 1.0,
          voice_emotion: 'engaging_teacher',
          context_metadata: context
        }
      }),
    });
  }

  async startContextualTutoringSession(
    replicaId: string,
    context: SessionContext,
    studentInfo?: any
  ): Promise<CVIConversation> {
    // Create persona with context
    const persona = await this.createContextualTradingTutorPersona(replicaId, context);

    return this.makeRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify({
        persona_id: persona.persona_id,
        conversation_name: `Trading ${context.sessionType} Session - ${new Date().toISOString()}`,
        properties: {
          student_context: {
            ...studentInfo,
            session_context: context
          },
          screen_sharing_enabled: true,
          recording_enabled: false,
          max_duration: 3600,
          real_time_transcription: true,
          sentiment_analysis: true
        }
      }),
    });
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