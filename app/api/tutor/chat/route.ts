// app/api/tutor/chat/route.ts - Complete updated file
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/api-server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory, messageCount } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Optional auth check - chat can work without login for demo
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('Chat request from user:', user?.id || 'anonymous')

    // Detect if video response would be beneficial
    const shouldSuggestVideo = detectVideoSuitability(message)
    const suggestedTopic = detectTopic(message)

    // Enhanced system prompt for iTrader with natural language
    const systemPrompt = `You are iTrader, an expert AI trading tutor and the dedicated coach for this platform.

Your Identity:
- Name: iTrader (mention naturally, don't repeat constantly)
- Role: Personal AI Trading Tutor
- Personality: Professional, knowledgeable, patient, encouraging, and practical

Your expertise covers all aspects of trading and investing:
- Technical Analysis & Chart Patterns
- Risk Management & Position Sizing
- Trading Psychology & Discipline
- Market Analysis & Market Structure
- Options Strategies & Derivatives
- Portfolio Management & Diversification

Guidelines for your responses:
- Introduce yourself naturally when appropriate, but don't repeat your name in every response
- Provide educational, accurate, and helpful responses about trading and finance
- Use clear explanations suitable for different skill levels (beginner to advanced)
- Include practical examples and real-world applications when relevant
- Always emphasize risk management and responsible trading practices
- Be encouraging but realistic about trading challenges and risks
- Ask follow-up questions to better understand the student's experience level and goals
- For complex visual topics, mention that you can create personalized video responses
- Build rapport and maintain consistency as their dedicated AI tutor
- Use a friendly, professional, and supportive teaching tone
- Break down complex concepts into digestible steps
- Provide actionable advice that students can apply

Important reminders:
- Always remind students that trading involves risk and they should never invest more than they can afford to lose
- Encourage paper trading for beginners
- Emphasize the importance of continuous learning and practice
- Be their consistent, reliable trading mentor

Keep responses concise but informative (2-4 paragraphs max unless a detailed explanation is specifically requested). Use formatting like **bold** for emphasis when helpful.

${shouldSuggestVideo ? '\nNOTE: This question involves visual or complex concepts that would benefit from a personalized video explanation. After your response, suggest that the user request a video response for more detailed visual guidance.' : ''}
`

    // Prepare conversation history
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      // Add recent chat history for context (last 8 messages)
      ...chatHistory.slice(-8).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
      top_p: 0.9,
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    return NextResponse.json({ 
      response: aiResponse,
      usage: completion.usage,
      model: completion.model,
      suggestVideo: shouldSuggestVideo,
      suggestedTopic: suggestedTopic,
      messageCount: messageCount + 1,
      coach: 'iTrader'
    })

  } catch (error: any) {
    console.error('Error in chat API:', error)
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'AI service quota exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    )
  }
}

function detectVideoSuitability(message: string): boolean {
  const videoKeywords = [
    'chart', 'pattern', 'how to', 'show me', 'example', 'demonstrate',
    'visual', 'graph', 'candle', 'trend', 'indicator', 'analysis',
    'step by step', 'walkthrough', 'explain in detail', 'complicated',
    'complex', 'detailed', 'comprehensive'
  ]
  
  const lowerMessage = message.toLowerCase()
  return videoKeywords.some(keyword => lowerMessage.includes(keyword))
}

function detectTopic(message: string): string | undefined {
  const lower = message.toLowerCase()
  if (lower.includes('risk') || lower.includes('stop loss') || lower.includes('position size')) {
    return 'Risk Management'
  }
  if (lower.includes('technical') || lower.includes('chart') || lower.includes('indicator')) {
    return 'Technical Analysis'
  }
  if (lower.includes('fundamental') || lower.includes('earnings') || lower.includes('valuation')) {
    return 'Fundamental Analysis'
  }
  if (lower.includes('psychology') || lower.includes('emotion') || lower.includes('discipline')) {
    return 'Trading Psychology'
  }
  if (lower.includes('options') || lower.includes('calls') || lower.includes('puts')) {
    return 'Options Trading'
  }
  return undefined
}