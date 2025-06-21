// components/tutor/TutorTopics.tsx - Complete enhanced version
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, ArrowRight, Video, PlayCircle } from "lucide-react";
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
  }
];

interface TutorTopicsProps {
  onRequestVideo?: (question: string, topic: string) => void;
}

export function TutorTopics({ onRequestVideo }: TutorTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleRequestTopicVideo = (topic: Topic) => {
    const question = `Can you provide a comprehensive overview of ${topic.title}? I'd like to understand the key concepts and how to apply them in my trading.`;
    if (onRequestVideo) {
      onRequestVideo(question, topic.title);
    }
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Learning Topics</h2>
        <p className="text-muted-foreground">
          Master trading concepts through structured learning paths and personalized video explanations
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {topics.map((topic) => {
          const progress = calculateProgress(topic);
          const isCompleted = progress === 100;
          
          return (
            <Card key={topic.id} className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(topic.level)}>
                        {topic.level}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {topic.estimated_duration} min
                      </div>
                      {topic.video_available && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="h-3 w-3 mr-1" />
                          Video Available
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3">
                  {topic.description}
                </CardDescription>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{topic.completed_lessons} of {topic.total_lessons} lessons</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="space-y-2 pt-2">
                  {topic.video_available && onRequestVideo && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => handleRequestTopicVideo(topic)}
                    >
                      <PlayCircle className="h-3 w-3" />
                      Get Video Overview
                    </Button>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {progress}% complete
                    </div>
                    <Button size="sm" variant="ghost" disabled>
                      <BookOpen className="h-3 w-3 mr-1" />
                      Interactive Lessons
                      <span className="ml-1 text-xs text-muted-foreground">(Coming Soon)</span>
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
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-blue-900">Recommended Learning Path</h3>
            <p className="text-blue-700 text-sm">
              Start with Risk Management → Technical Analysis → Trading Psychology → Options Strategies
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                <BookOpen className="h-3 w-3 mr-1" />
                View Full Curriculum
              </Button>
              {onRequestVideo && (
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => onRequestVideo("What learning path do you recommend for a beginner trader?", "Learning Path")}
                >
                  <Video className="h-3 w-3 mr-1" />
                  Get Personalized Path
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}