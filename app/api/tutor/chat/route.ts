import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Prepare conversation history for ChatGPT
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert AI trading tutor and mentor. Your role is to help students learn about trading, market analysis, risk management, and investment strategies.

Guidelines for your responses:
- Provide educational, accurate, and helpful responses about trading and finance
- Use clear explanations suitable for different skill levels (beginner to advanced)
- Include practical examples and real-world applications when relevant
- Always emphasize risk management and responsible trading practices
- Be encouraging but realistic about trading challenges and risks
- Ask follow-up questions to better understand the student's experience level and goals
- Suggest when a personalized video response might be more helpful for complex visual topics
- Cover topics like: technical analysis, fundamental analysis, chart patterns, indicators, market psychology, position sizing, portfolio management, options trading, forex, cryptocurrencies, and more
- Use a friendly, professional, and supportive teaching tone
- Break down complex concepts into digestible steps
- Provide actionable advice that students can apply

Important: Always remind students that trading involves risk and they should never invest more than they can afford to lose. Encourage paper trading for beginners.

Keep responses concise but informative (2-4 paragraphs max unless a detailed explanation is specifically requested). Use formatting like bullet points or numbered lists when helpful for clarity.`
      },
      // Add recent chat history for context (last 10 messages)
      ...chatHistory.slice(-10).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model, upgrade to 'gpt-4o' for more advanced responses
      messages,
      max_tokens: 800,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      top_p: 0.9,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({ 
      response: aiResponse,
      usage: completion.usage,
      model: completion.model
    });

  } catch (error: any) {
    console.error('Error in chat API:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'AI service quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    if (error.code === 'model_not_found') {
      return NextResponse.json(
        { error: 'AI model not available. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}