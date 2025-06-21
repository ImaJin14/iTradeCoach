// lib/tavus.ts - Fixed generateVideo method
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

  // Generate video - FIXED to remove webhook_url
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

  // Enhanced script generation for trading topics
  generateTradingScript(question: string, topicHint?: string, userLevel?: string): string {
    const intro = "Hi! I'm your AI trading tutor. Thanks for your excellent question.";
    const questionAck = `You asked: "${question}"`
    
    let response = '';
    const lowerQuestion = question.toLowerCase();
    const level = userLevel || 'beginner';
    
    if (lowerQuestion.includes('risk') || lowerQuestion.includes('stop loss') || lowerQuestion.includes('position size')) {
      response = this.generateRiskManagementResponse(question, level);
    } else if (lowerQuestion.includes('technical') || lowerQuestion.includes('chart') || lowerQuestion.includes('indicator') || lowerQuestion.includes('rsi') || lowerQuestion.includes('macd')) {
      response = this.generateTechnicalAnalysisResponse(question, level);
    } else if (lowerQuestion.includes('fundamental') || lowerQuestion.includes('earnings') || lowerQuestion.includes('valuation')) {
      response = this.generateFundamentalAnalysisResponse(question, level);
    } else if (lowerQuestion.includes('psychology') || lowerQuestion.includes('emotion') || lowerQuestion.includes('discipline') || lowerQuestion.includes('fear') || lowerQuestion.includes('greed')) {
      response = this.generatePsychologyResponse(question, level);
    } else if (lowerQuestion.includes('options') || lowerQuestion.includes('calls') || lowerQuestion.includes('puts') || lowerQuestion.includes('derivatives')) {
      response = this.generateOptionsResponse(question, level);
    } else {
      response = this.generateGeneralTradingResponse(question, level);
    }
    
    const conclusion = level === 'beginner' 
      ? "Remember, always start with paper trading to practice these concepts risk-free. Keep learning, stay disciplined, and never risk more than you can afford to lose!"
      : "I hope this provides the insights you need for your trading strategy. Keep refining your approach and stay consistent with your risk management!";
    
    return `${intro} ${questionAck} ${response} ${conclusion}`;
  }

  private generateRiskManagementResponse(question: string, level: string): string {
    if (level === 'beginner') {
      return `Risk management is the foundation of successful trading. Here are the key principles: First, never risk more than 1-2% of your account on any single trade. This means if you have $10,000, don't risk more than $100-200 per trade. Second, always set a stop loss before entering any position - this is your safety net. Third, use position sizing to control risk - smaller positions for uncertain trades, larger for high-confidence setups. Finally, diversify across different assets and time frames to spread your risk.`;
    } else if (level === 'intermediate') {
      return `Advanced risk management involves several layers of protection. Use the Kelly Criterion to optimize position sizes based on your win rate and average win/loss ratio. Implement correlation analysis to avoid overexposure to similar assets. Consider using options strategies like protective puts for downside protection. Also, maintain a risk-reward ratio of at least 1:2 - this means if you risk $100, aim to make $200. Don't forget about portfolio heat - your total exposure across all positions.`;
    } else {
      return `At an advanced level, risk management becomes systematic and quantitative. Implement dynamic position sizing based on market volatility using the VIX or Average True Range. Use Monte Carlo simulations to stress-test your strategies. Consider tail risk hedging through put spreads or VIX calls. Implement drawdown controls that reduce position sizes after losses. Track your risk-adjusted returns using metrics like Sharpe ratio and maximum drawdown to continuously improve your approach.`;
    }
  }

  private generateTechnicalAnalysisResponse(question: string, level: string): string {
    if (level === 'beginner') {
      return `Technical analysis helps you read market sentiment through price charts. Start with these basics: Support and resistance levels show where price tends to bounce or break. Moving averages (like the 20 and 50-day) help identify trends - when price is above them, it's usually bullish. Volume confirms price movements - strong moves should have high volume. Learn candlestick patterns like doji, hammer, and engulfing patterns. Remember, technical analysis works best when combined with proper risk management.`;
    } else if (level === 'intermediate') {
      return `Let's dive deeper into technical analysis. Fibonacci retracements help identify potential reversal levels at 38.2%, 50%, and 61.8%. RSI and MACD are momentum indicators that help spot overbought/oversold conditions and trend changes. Chart patterns like triangles, flags, and head-and-shoulders provide entry and exit signals. Pay attention to multiple timeframe analysis - align your trades with the daily trend while timing entries on hourly charts. Volume profile shows where most trading occurred, indicating key support/resistance levels.`;
    } else {
      return `Advanced technical analysis involves sophisticated pattern recognition and statistical methods. Use Elliott Wave theory to identify market cycles and predict future price movements. Implement algorithmic pattern recognition for head-and-shoulders, cup-and-handle, and complex corrections. Study market microstructure through order flow analysis and level 2 data. Use advanced indicators like Ichimoku clouds, Bollinger Bands with multiple standard deviations, and custom oscillators. Consider inter-market analysis - how bonds, commodities, and currencies affect your trades.`;
    }
  }

  private generatePsychologyResponse(question: string, level: string): string {
    return `Trading psychology is often what separates successful traders from those who struggle. The market is designed to trigger emotional responses - fear when we're losing, greed when we're winning, and FOMO when we miss opportunities. Here's how to master your mindset: First, develop a detailed trading plan before the market opens and stick to it regardless of emotions. Second, practice mindfulness or meditation to stay calm under pressure. Third, never revenge trade after a loss - that's when most traders blow up their accounts. Fourth, treat trading like a business with proper record-keeping and performance analysis. Remember, the goal isn't to be right all the time, but to be profitable over time. Many professional traders are only right 40-50% of the time but still make money through proper risk management.`;
  }

  private generateOptionsResponse(question: string, level: string): string {
    if (level === 'beginner') {
      return `Options are contracts that give you the right (but not obligation) to buy or sell stocks at specific prices. Calls increase in value when stocks go up, puts when stocks go down. Start with buying simple calls and puts to learn how time decay and volatility affect prices. The Greeks - Delta, Gamma, Theta, and Vega - measure how options respond to different factors. Only risk money you can afford to lose completely, as options can expire worthless. Paper trade extensively before using real money.`;
    } else {
      return `Advanced options strategies can generate income, hedge positions, and profit in sideways markets. Credit spreads like iron condors work well in low-volatility environments. Covered calls generate income on existing stock positions. Protective puts act as insurance for your portfolio. Study implied volatility cycles - sell premium when IV is high, buy when it's low. Understanding the volatility smile and term structure helps with strategy selection. Consider using options for portfolio hedging during uncertain market conditions.`;
    }
  }

  private generateFundamentalAnalysisResponse(question: string, level: string): string {
    return `Fundamental analysis focuses on a company's intrinsic value through financial metrics and business quality. Key ratios include P/E (price-to-earnings), PEG (price-to-earnings growth), and price-to-book value. Study the income statement for revenue growth and profit margins, the balance sheet for debt levels and assets, and cash flow statements for actual cash generation. Look for competitive advantages or 'moats' - strong brands, network effects, or cost advantages that protect the business. Consider the industry landscape, management quality, and economic cycles. For swing and position trading, combine fundamental strength with technical entry points for better results.`;
  }

  private generateGeneralTradingResponse(question: string, level: string): string {
    return `This is a great question that touches on important trading concepts. Successful trading requires three key elements: a solid strategy, proper risk management, and strong psychology. Your strategy should have clear entry and exit rules based on technical or fundamental analysis. Risk management means never risking more than you can afford to lose and using stop losses consistently. Psychology involves staying disciplined and not letting emotions drive your decisions. Remember to keep a trading journal to track what works and what doesn't. Most importantly, continuous learning and practice are essential - the markets are always evolving, and so should your skills.`;
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