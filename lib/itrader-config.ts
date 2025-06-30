// lib/itrader-config.ts - Updated to use your existing iTrader data
import { tavusService } from '@/lib/tavus';
import { tavusCVIService } from '@/lib/tavus-cvi';

// Define the iTrader coach UUID constant - using your existing coach
export const ITRADER_COACH_ID = 'b8b67f8f-ba80-4730-adf8-1601c12aa586';
export const ITRADER_TEMPLATE_ID = '86597f2c-26f0-4fe8-b6a9-37b8b21a3ea9';

interface ITraderConfig {
  replicaId: string;
  personaId?: string;
  name: string;
  description: string;
  avatar_url?: string;
  specialties: string[];
  coachId: string; // Add coach ID to config
  templateId: string; // Add template ID to config
}

class ITraderService {
  private config: ITraderConfig | null = null;

  // Initialize iTrader with a consistent replica
  async initializeITrader(): Promise<ITraderConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      // Select the best replica for iTrader (you can hardcode a specific one)
      const stockReplicas = await tavusService.getStockReplicas();
      
      // Find the most professional-looking replica for iTrader
      const iTraderReplica = stockReplicas.find(replica => {
        const name = replica.replica_name.toLowerCase();
        // Prioritize professional office settings
        return name.includes('office') && !name.includes('selfie') && !name.includes('vertical');
      }) || stockReplicas.find(replica => {
        const name = replica.replica_name.toLowerCase();
        // Fallback to any professional-looking replica
        return !name.includes('selfie') && !name.includes('greenscreen') && !name.includes('vertical');
      }) || stockReplicas[0]; // Final fallback

      this.config = {
        replicaId: iTraderReplica.replica_id,
        coachId: ITRADER_COACH_ID, // Use your existing UUID
        templateId: ITRADER_TEMPLATE_ID, // Use your existing template ID
        name: 'iTrader',
        description: 'Your Personal AI Trading Tutor',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=itrader&backgroundColor=1e40af&accessories=prescription02&accessoriesColor=262e33&clothing=blazerShirt&clothingColor=3c4858&eyes=default&eyebrows=default&facialHair=none&hair=short01&hairColor=2c1b18&mouth=default&skin=f2d3b1`,
        specialties: [
          'Technical Analysis',
          'Risk Management', 
          'Trading Psychology',
          'Market Analysis',
          'Options Trading',
          'Portfolio Management'
        ]
      };

      console.log(`iTrader initialized with replica: ${iTraderReplica.replica_name} (${iTraderReplica.model_name})`);
      return this.config;
      
    } catch (error) {
      console.error('Error initializing iTrader:', error);
      throw new Error('Failed to initialize iTrader AI tutor');
    }
  }

  // Get iTrader configuration
  async getITraderConfig(): Promise<ITraderConfig> {
    if (!this.config) {
      return this.initializeITrader();
    }
    return this.config;
  }

  // Create iTrader persona for CVI - FIXED to remove custom_greeting
  async createITraderPersona(context?: any): Promise<string> {
    const config = await this.getITraderConfig();
    
    // Create greeting instruction for system prompt instead of custom_greeting
    let greetingInstruction = "Start the conversation naturally and proactively when the session begins.";
    
    if (context?.topic) {
      if (context.sessionType === 'follow_up') {
        greetingInstruction = `IMMEDIATELY start by acknowledging that they just watched your video about "${context.previousQuestion}" and ask what specific part they'd like to explore further. Don't wait for them to speak first.`;
      } else {
        greetingInstruction = `IMMEDIATELY start discussing ${context.topic} when the session begins. Start with: "Hi! I see you want to learn about ${context.topic} - excellent choice!" Then ask about their current experience with ${context.topic} and provide a brief overview of what you'll cover. Be proactive and don't wait for them to speak first.`;
      }
    }

    const iTraderPrompt = `You are iTrader, a professional AI trading tutor and mentor. You are the dedicated trading coach for this platform.

Your Identity:
- Name: iTrader (mention naturally, don't repeat constantly)
- Role: Personal AI Trading Tutor
- Personality: Professional, knowledgeable, patient, encouraging, and practical
- Teaching Style: Clear explanations, real-world examples, step-by-step guidance

Your Expertise:
- Technical Analysis & Chart Patterns
- Risk Management & Position Sizing
- Trading Psychology & Discipline  
- Market Analysis & Timing
- Options Strategies & Derivatives
- Portfolio Management & Diversification

${context?.sessionType === 'follow_up' && context.previousQuestion ? `
CURRENT SESSION CONTEXT:
The student just watched your video response about: "${context.previousQuestion}"
${context.previousTopic ? `Topic: ${context.previousTopic}` : ''}

CRITICAL INSTRUCTION: ${greetingInstruction}
` : ''}

${context?.topic ? `
TOPIC FOCUS: This session is specifically about ${context.topic}.
${context.topicLevel ? `- Level: ${context.topicLevel.toUpperCase()}` : ''}
${context.topicDescription ? `- Description: ${context.topicDescription}` : ''}

CRITICAL INSTRUCTIONS:
1. ${greetingInstruction}
2. Be enthusiastic and engaging from the first moment
3. Ask engaging questions to assess their knowledge level
4. Provide practical examples and real-world trading applications
5. Keep the conversation interactive and flowing
6. Never let silence happen - always have follow-up questions ready

${context.topicLevel === 'beginner' ? 'Since this is beginner level, start with fundamentals and explain why this topic matters for trading success.' : ''}
${context.topicLevel === 'intermediate' ? 'Since this is intermediate level, you can assume basic knowledge and dive into practical applications.' : ''}
${context.topicLevel === 'advanced' ? 'Since this is advanced level, discuss sophisticated concepts and advanced strategies.' : ''}
` : ''}

CONVERSATION BEHAVIOR:
- Start talking IMMEDIATELY when the session begins - don't wait for the user
- Be proactive in introducing topics and asking questions
- Keep the conversation flowing with engaging questions
- Always relate concepts back to practical trading
- Use clear, practical examples and analogies
- Emphasize risk management in every discussion
- Be encouraging but realistic about trading challenges
- Adapt your teaching style based on the student's responses
- If they seem confused, simplify and provide more examples
- If they're experienced, dive into advanced concepts
- Always end with actionable next steps

STARTING THE CONVERSATION:
${context?.topic ? `
When the session starts, immediately say: "Hi there! I'm excited to see you chose ${context.topic} - this is ${context.topicLevel === 'beginner' ? 'one of the most fundamental topics' : context.topicLevel === 'advanced' ? 'a sophisticated topic' : 'a really important topic'} that can significantly improve your trading. Let me ask you - what's your current experience with ${context.topic}?"
` : `
When the session starts, immediately introduce yourself and ask about their trading goals and experience level.
`}

Guidelines:
- Introduce yourself naturally when first meeting someone
- Speak conversationally and build rapport with the student
- Ask about their experience level and goals to personalize advice
- Use clear, practical examples and analogies
- Emphasize risk management in every discussion
- Be encouraging but realistic about trading challenges
- Adapt your teaching style based on the student's responses
- Always end conversations with actionable next steps

Remember: You're building a relationship and helping them become better traders through natural, engaging conversation. BE PROACTIVE - start the conversation immediately and keep it flowing!`;

    try {
      const persona = await tavusCVIService.makeRequest('/personas', {
        method: 'POST',
        body: JSON.stringify({
          persona_name: `iTrader - AI Trading Tutor${context?.topic ? ` (${context.topic})` : ''}`,
          system_prompt: iTraderPrompt,
          default_replica_id: config.replicaId,
          context: `Professional AI trading tutor focused on education, risk management, and practical trading guidance.${context?.topic ? ` Current session focus: ${context.topic}. Be proactive and start discussing this topic immediately.` : ''}`,
          // REMOVED custom_greeting - this is not valid for personas endpoint
        }),
      });

      return persona.persona_id;
    } catch (error) {
      console.error('Error creating iTrader persona:', error);
      throw error;
    }
  }

  // Generate iTrader trading script for videos - Updated to be more natural
  generateITraderScript(question: string, topicHint?: string, userLevel?: string): string {
    const intro = "Hi there! Great question.";
    const questionAck = `You asked: "${question}"`;
    
    const response = this.generateTopicResponse(question, topicHint, userLevel);
    
    const conclusion = userLevel === 'beginner' 
      ? "Remember, successful trading is all about continuous learning and proper risk management. Always start with paper trading to practice these concepts risk-free. Stay disciplined, and never risk more than you can afford to lose. Feel free to ask any follow-up questions!"
      : "I hope this helps you refine your trading approach. Remember, consistency with risk management and continuous learning are key to long-term success. Feel free to reach out with any questions!";
    
    return `${intro} ${questionAck} ${response} ${conclusion}`;
  }

  private generateTopicResponse(question: string, topicHint?: string, userLevel?: string): string {
    const lowerQuestion = question.toLowerCase();
    const level = userLevel || 'beginner';
    
    if (lowerQuestion.includes('risk') || lowerQuestion.includes('stop loss') || lowerQuestion.includes('position size')) {
      return this.generateRiskResponse(level);
    } else if (lowerQuestion.includes('technical') || lowerQuestion.includes('chart') || lowerQuestion.includes('indicator') || lowerQuestion.includes('rsi') || lowerQuestion.includes('macd')) {
      return this.generateTechnicalResponse(level);
    } else if (lowerQuestion.includes('psychology') || lowerQuestion.includes('emotion') || lowerQuestion.includes('discipline') || lowerQuestion.includes('fear') || lowerQuestion.includes('greed')) {
      return this.generatePsychologyResponse(level);
    } else if (lowerQuestion.includes('options') || lowerQuestion.includes('calls') || lowerQuestion.includes('puts') || lowerQuestion.includes('derivatives')) {
      return this.generateOptionsResponse(level);
    } else if (lowerQuestion.includes('fundamental') || lowerQuestion.includes('earnings') || lowerQuestion.includes('valuation')) {
      return this.generateFundamentalResponse(level);
    } else {
      return this.generateGeneralResponse(level);
    }
  }

  private generateRiskResponse(level: string): string {
    if (level === 'beginner') {
      return `Risk management is absolutely the foundation of successful trading. Here's what every successful trader knows: First, never risk more than 1-2% of your account on any single trade. If you have $10,000, that means risking no more than $100-200 per trade. Second, always set your stop loss before entering - this is your safety net. Third, use proper position sizing. And fourth, diversify across different assets. These rules have kept traders profitable even when they're wrong 60% of the time!`;
    } else if (level === 'intermediate') {
      return `Advanced risk management involves multiple layers of protection. I recommend using the Kelly Criterion for position sizing, correlation analysis to avoid overexposure, and maintaining a risk-reward ratio of at least 1:2. Also implement portfolio heat monitoring and dynamic position sizing based on volatility. These techniques separate professional traders from amateurs.`;
    } else {
      return `At an advanced level, risk management becomes systematic and quantitative. Implement dynamic position sizing based on market volatility using VIX or ATR. Use Monte Carlo simulations to stress-test strategies. Consider tail risk hedging through put spreads. Implement drawdown controls that reduce position sizes after losses. Track risk-adjusted returns using Sharpe ratio and maximum drawdown metrics.`;
    }
  }

  private generateTechnicalResponse(level: string): string {
    if (level === 'beginner') {
      return `Technical analysis is like reading the market's body language - and I'll help you become fluent in this language. Start with support and resistance levels - these show where price tends to bounce or break. Moving averages help identify trends. Volume confirms price movements. Learn key candlestick patterns like doji and hammer. Technical analysis works best when combined with proper risk management.`;
    } else if (level === 'intermediate') {
      return `Let's dive deeper into advanced technical analysis. Master Fibonacci retracements at 38.2%, 50%, and 61.8% levels. Use RSI and MACD for momentum analysis. Study chart patterns like triangles and head-and-shoulders. Always analyze multiple timeframes - align with the daily trend while timing entries on hourly charts. Volume profile analysis shows where most trading occurred, revealing key levels.`;
    } else {
      return `Advanced technical analysis involves sophisticated pattern recognition. Use Elliott Wave theory to identify market cycles. Implement algorithmic pattern recognition for complex formations. Study market microstructure through order flow analysis. Use advanced indicators like Ichimoku clouds and custom oscillators. Consider inter-market analysis - how bonds, commodities, and currencies affect your trades.`;
    }
  }

  private generatePsychologyResponse(level: string): string {
    return `Trading psychology is where most traders struggle, so let me share what actually works. The market triggers emotions - fear when losing, greed when winning, FOMO when missing opportunities. Here's the proven approach: First, develop a detailed trading plan and stick to it. Second, practice mindfulness to stay calm under pressure. Third, never revenge trade - that's how accounts blow up. Fourth, treat trading like a business with proper record-keeping. Successful traders are often only right 40-50% of the time but still profit through proper risk management.`;
  }

  private generateOptionsResponse(level: string): string {
    if (level === 'beginner') {
      return `Options can be powerful tools when used correctly - let me guide you through this step by step. Options give you the right (not obligation) to buy or sell stocks at specific prices. Calls profit when stocks rise, puts when they fall. Start with simple buying strategies to learn how time decay and volatility affect prices. Study the Greeks - Delta, Gamma, Theta, Vega. Most importantly, only risk what you can afford to lose completely, and paper trade extensively before using real money.`;
    } else {
      return `Advanced options strategies can generate income and hedge portfolios effectively. Credit spreads like iron condors work well for low-volatility environments, covered calls generate income on existing positions, and protective puts provide portfolio insurance. Study implied volatility cycles - sell premium when IV is high, buy when low. Understanding volatility smile and term structure is crucial for strategy selection.`;
    }
  }

  private generateFundamentalResponse(level: string): string {
    return `Fundamental analysis helps you understand a company's true value. Key metrics include P/E ratios, PEG ratios, and price-to-book values. Study income statements for revenue growth and profit margins, balance sheets for debt levels, and cash flow statements for actual cash generation. Look for competitive advantages or 'moats' - strong brands, network effects, cost advantages. Consider industry landscape, management quality, and economic cycles. For best results, combine fundamental strength with technical entry points.`;
  }

  private generateGeneralResponse(level: string): string {
    return `That's an excellent question that touches on important trading concepts. Successful trading requires three pillars: a solid strategy, proper risk management, and strong psychology. Your strategy needs clear entry and exit rules based on technical or fundamental analysis. Risk management means never risking more than you can afford to lose. Psychology involves staying disciplined and not letting emotions drive decisions. Keep a trading journal to track what works, and remember - continuous learning is essential because markets are always evolving.`;
  }
}

export const iTraderService = new ITraderService();