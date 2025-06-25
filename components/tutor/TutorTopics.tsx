// components/tutor/TutorTopics.tsx - Fixed overflow issues
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, ArrowRight, Video, PlayCircle, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Topic {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  total_lessons: number;
  estimated_duration: number;
  completed_lessons: number;
  video_available: boolean;
}

// Enhanced mock topics with video availability
const ENHANCED_TOPICS: Topic[] = [
  {
    id: 'risk-management',
    title: 'Risk Management Fundamentals',
    description: 'Master the art of protecting your capital and managing trading risk effectively',
    level: 'beginner',
    total_lessons: 8,
    estimated_duration: 120,
    completed_lessons: 0,
    video_available: true
  },
  {
    id: 'technical-analysis',
    title: 'Technical Analysis Mastery',
    description: 'Learn to read charts, identify patterns, and use technical indicators for better trading decisions',
    level: 'intermediate',
    total_lessons: 12,
    estimated_duration: 180,
    completed_lessons: 0,
    video_available: true
  },
  {
    id: 'candlestick-patterns',
    title: 'Candlestick Pattern Recognition',
    description: 'Understand Japanese candlestick patterns and their significance in market analysis',
    level: 'beginner',
    total_lessons: 6,
    estimated_duration: 90,
    completed_lessons: 0,
    video_available: true
  },
  {
    id: 'options-strategies',
    title: 'Options Trading Strategies',
    description: 'Advanced options strategies for income generation, hedging, and speculation',
    level: 'advanced',
    total_lessons: 15,
    estimated_duration: 240,
    completed_lessons: 0,
    video_available: true
  },
  {
    id: 'market-psychology',
    title: 'Trading Psychology & Discipline',
    description: 'Develop the mental framework needed for consistent trading success',
    level: 'intermediate',
    total_lessons: 10,
    estimated_duration: 150,
    completed_lessons: 0,
    video_available: true
  },
  {
    id: 'portfolio-management',
    title: 'Portfolio Management',
    description: 'Learn to build and manage diversified investment portfolios',
    level: 'intermediate',
    total_lessons: 8,
    estimated_duration: 120,
    completed_lessons: 0,
    video_available: false
  },
  {
    id: 'forex-trading',
    title: 'Forex Trading Fundamentals',
    description: 'Master currency trading with proper risk management and analysis techniques',
    level: 'intermediate',
    total_lessons: 10,
    estimated_duration: 160,
    completed_lessons: 0,
    video_available: true
  },
  {
    id: 'day-trading',
    title: 'Day Trading Strategies',
    description: 'Learn effective intraday trading techniques and scalping methods',
    level: 'advanced',
    total_lessons: 12,
    estimated_duration: 200,
    completed_lessons: 0,
    video_available: true
  }
];

interface TutorTopicsProps {
  onRequestVideo?: (question: string, topic: string) => void;
  onStartLiveSession?: (context: any) => void;
}

export function TutorTopics({ onRequestVideo, onStartLiveSession }: TutorTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState<string | null>(null);

  useEffect(() => {
    // Use enhanced mock data
    setTimeout(() => {
      setTopics(ENHANCED_TOPICS);
      setLoading(false);
    }, 500);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateProgress = (topic: Topic) => {
    if (topic.total_lessons === 0) return 0;
    return Math.round((topic.completed_lessons / topic.total_lessons) * 100);
  };

  const handleRequestTopicVideo = async (topic: Topic) => {
    if (!onRequestVideo) return;
    
    setVideoLoading(topic.id);
    try {
      const question = `Can you provide a comprehensive overview of ${topic.title}? I'd like to understand the key concepts and how to apply them in my trading. Please focus on ${topic.level} level explanations and include practical examples.`;
      await onRequestVideo(question, topic.title);
    } finally {
      setVideoLoading(null);
    }
  };

  // components/tutor/TutorTopics.tsx - Fix the context structure for handleStartLiveSession
const handleStartLiveSession = async (topic: Topic) => {
  if (!onStartLiveSession) return;

  setLiveLoading(topic.id);
  try {
    // Enhanced context for proactive AI behavior - FIXED structure
    const context = {
      topic: topic.title,
      sessionType: 'initial', // Make sure this is defined
      topicLevel: topic.level,
      topicDescription: topic.description,
      estimatedDuration: topic.estimated_duration,
      totalLessons: topic.total_lessons,
      // Enhanced context for proactive AI behavior
      context: `LIVE TUTORING SESSION - ${topic.title.toUpperCase()}

STUDENT REQUEST: The student specifically clicked to start a live session about ${topic.title}. They want immediate, interactive learning about this topic.

TOPIC DETAILS:
- Level: ${topic.level} (${topic.level === 'beginner' ? 'Start with basics and fundamentals' : topic.level === 'advanced' ? 'Use sophisticated concepts and advanced strategies' : 'Build on fundamentals with practical applications'})
- Description: ${topic.description}
- Estimated Learning Time: ${topic.estimated_duration} minutes
- Available Lessons: ${topic.total_lessons}
- Current Progress: ${topic.completed_lessons}/${topic.total_lessons} lessons completed

YOUR INSTRUCTIONS:
1. IMMEDIATELY start talking about ${topic.title} when the session begins - don't wait for the student
2. Be enthusiastic and engaging from the first moment
3. Start with: "Hi! I see you want to learn about ${topic.title} - excellent choice!"
4. Ask about their current experience with this specific topic
5. Provide a brief overview of what you'll cover in this session
6. Keep the conversation interactive with engaging questions
7. Use practical examples and real-world trading applications
8. Connect concepts directly to their trading goals and success
9. Be proactive throughout - don't let silence happen

CONVERSATION APPROACH:
${topic.level === 'beginner' ? `
- Start with "What's your current experience with ${topic.title}? Are you completely new to this?"
- Explain why this topic is crucial for trading success
- Use simple, clear examples and analogies
- Build confidence while teaching fundamentals
- Focus on practical application they can use immediately
` : topic.level === 'advanced' ? `
- Ask "What's your current experience with advanced ${topic.title} concepts?"
- Dive into sophisticated strategies and techniques
- Discuss edge cases and professional-level applications
- Challenge them with complex scenarios
- Focus on optimization and advanced implementation
` : `
- Ask "How familiar are you with ${topic.title} concepts?"
- Build on basic knowledge with practical applications
- Introduce intermediate strategies and techniques
- Focus on real-world implementation
- Bridge theory with practical trading scenarios
`}

CONVERSATION STARTER: "Hi there! I'm excited to see you chose ${topic.title} - this is ${topic.level === 'beginner' ? 'one of the most fundamental topics' : topic.level === 'advanced' ? 'a sophisticated topic' : 'a really important topic'} that can significantly improve your trading. Let me ask you - what's your current experience with ${topic.title}?"

Remember: BE PROACTIVE, START IMMEDIATELY, KEEP ENGAGING!`,
      coachId: 'itrader'
    };
    
    await onStartLiveSession(context);
  } finally {
    setLiveLoading(null);
  }
};

  const getTopicInsights = (topic: Topic) => {
    const insights = {
      'risk-management': {
        keyPoints: ['Position sizing', 'Stop losses', 'Portfolio protection'],
        whoShouldLearn: 'Essential for all traders - this protects your capital'
      },
      'technical-analysis': {
        keyPoints: ['Chart patterns', 'Technical indicators', 'Support/resistance'],
        whoShouldLearn: 'Perfect for traders who want to time entries and exits'
      },
      'candlestick-patterns': {
        keyPoints: ['Doji patterns', 'Hammer formations', 'Engulfing patterns'],
        whoShouldLearn: 'Great for understanding market psychology through price action'
      },
      'options-strategies': {
        keyPoints: ['Credit spreads', 'Protective puts', 'Covered calls'],
        whoShouldLearn: 'Advanced traders looking for income and hedging strategies'
      },
      'market-psychology': {
        keyPoints: ['Emotional control', 'Discipline', 'FOMO management'],
        whoShouldLearn: 'Critical for anyone struggling with trading emotions'
      },
      'portfolio-management': {
        keyPoints: ['Diversification', 'Asset allocation', 'Rebalancing'],
        whoShouldLearn: 'Important for long-term wealth building and risk management'
      },
      'forex-trading': {
        keyPoints: ['Currency pairs', 'Pip calculations', 'Economic indicators'],
        whoShouldLearn: 'Perfect for those interested in 24/7 currency markets'
      },
      'day-trading': {
        keyPoints: ['Scalping techniques', 'Intraday patterns', 'Volume analysis'],
        whoShouldLearn: 'For experienced traders seeking active trading strategies'
      }
    };
    return insights[topic.id as keyof typeof insights] || { keyPoints: [], whoShouldLearn: '' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Learning Topics</h2>
        <p className="text-muted-foreground text-sm px-4">
          Master trading concepts through structured learning paths, personalized video explanations, and live tutoring sessions
        </p>
      </div>

      {/* Topics Grid - Fixed overflow */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full">
        {topics.map((topic) => {
          const progress = calculateProgress(topic);
          const isCompleted = progress === 100;
          const insights = getTopicInsights(topic);
          const isVideoLoading = videoLoading === topic.id;
          const isLiveLoading = liveLoading === topic.id;
          
          return (
            <Card key={topic.id} className="flex flex-col h-full hover:shadow-md transition-shadow group min-w-0">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {topic.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getLevelColor(topic.level)} text-xs`}>
                        {topic.level}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span>{topic.estimated_duration} min</span>
                      </div>
                      {topic.video_available && (
                        <Badge variant="outline" className="text-xs hidden sm:flex">
                          <Video className="h-3 w-3 mr-1" />
                          Video Available
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <CardDescription className="line-clamp-2 text-sm">
                  {topic.description}
                </CardDescription>

                {/* Topic Insights */}
                {insights.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Key Topics:</h4>
                    <div className="flex flex-wrap gap-1">
                      {insights.keyPoints.map((point, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{topic.completed_lessons} of {topic.total_lessons} lessons</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Action Buttons - Always at bottom */}
                <div className="space-y-2 mt-auto pt-2">
                  {/* Video and Live Session buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    {topic.video_available && onRequestVideo && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 text-xs h-8"
                        onClick={() => handleRequestTopicVideo(topic)}
                        disabled={isVideoLoading || isLiveLoading}
                      >
                        {isVideoLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <PlayCircle className="h-3 w-3" />
                        )}
                        <span className="truncate">
                          {isVideoLoading ? 'Creating...' : 'Get Video Overview'}
                        </span>
                      </Button>
                    )}
                    
                    {onStartLiveSession && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 text-xs h-8"
                        onClick={() => handleStartLiveSession(topic)}
                        disabled={isVideoLoading || isLiveLoading}
                      >
                        {isLiveLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <MessageCircle className="h-3 w-3" />
                        )}
                        <span className="truncate">
                          {isLiveLoading ? 'Starting...' : 'Start Live Session'}
                        </span>
                      </Button>
                    )}
                  </div>

                  {/* Who should learn this */}
                  {insights.whoShouldLearn && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Who should learn:</strong> {insights.whoShouldLearn}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {progress}% complete
                    </span>
                    <Button size="sm" variant="ghost" disabled className="h-6 text-xs p-1">
                      <BookOpen className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Interactive Lessons</span>
                      <span className="sm:hidden">Lessons</span>
                      <span className="ml-1 text-xs text-muted-foreground">(Soon)</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Learning Path Suggestion */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4 sm:p-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-blue-900">Recommended Learning Path</h3>
            <p className="text-blue-700 text-xs sm:text-sm">
              Start with Risk Management → Technical Analysis → Trading Psychology → Options Strategies
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                View Full Curriculum
              </Button>
              {onRequestVideo && (
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                  onClick={() => onRequestVideo("What learning path do you recommend for a beginner trader? Please create a personalized roadmap based on my goals.", "Learning Path")}
                >
                  <Video className="h-3 w-3 mr-1" />
                  Get Personalized Path
                </Button>
              )}
              {onStartLiveSession && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 text-xs"
                  onClick={() => onStartLiveSession({
                    topic: "Learning Path Consultation",
                    sessionType: 'initial',
                    context: `LEARNING PATH CONSULTATION SESSION

STUDENT REQUEST: The student wants personalized guidance on creating a learning path for trading education.

YOUR INSTRUCTIONS:
1. IMMEDIATELY start by asking about their trading goals and current experience
2. Assess their knowledge level across different areas (technical analysis, risk management, psychology, etc.)
3. Recommend a customized learning sequence based on their goals
4. Explain why each topic should be learned in that order
5. Provide specific action steps they can take
6. Be encouraging and supportive about their learning journey

CONVERSATION STARTER: "Hi! I'm excited to help you create a personalized learning path for trading. Let me start by asking - what are your main trading goals? Are you looking to day trade, swing trade, or invest long-term? And what's your current experience level with trading?"

Focus on creating a practical, actionable roadmap that matches their specific goals and timeline.`,
                    coachId: 'itrader'
                  })}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Live Consultation
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-3 sm:pt-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{topics.length}</div>
              <p className="text-xs text-muted-foreground">Total Topics</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {topics.filter(t => t.video_available).length}
              </div>
              <p className="text-xs text-muted-foreground">Video Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {topics.reduce((sum, t) => sum + t.total_lessons, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total Lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {Math.round(topics.reduce((sum, t) => sum + t.estimated_duration, 0) / 60)}h
              </div>
              <p className="text-xs text-muted-foreground">Learning Time</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}