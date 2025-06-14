"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Topic {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  total_lessons: number;
  estimated_duration: number;
  completed_lessons: number;
}

// Mock topics since learning_topics table doesn't exist yet
const MOCK_TOPICS: Topic[] = [
  {
    id: 'basics',
    title: 'Trading Basics',
    description: 'Learn the fundamental concepts of trading and market structure',
    level: 'beginner',
    total_lessons: 8,
    estimated_duration: 120,
    completed_lessons: 0
  },
  {
    id: 'technical-analysis',
    title: 'Technical Analysis',
    description: 'Master chart patterns, indicators, and price action analysis',
    level: 'intermediate',
    total_lessons: 12,
    estimated_duration: 180,
    completed_lessons: 0
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    description: 'Advanced strategies for managing trading risk and capital preservation',
    level: 'intermediate',
    total_lessons: 6,
    estimated_duration: 90,
    completed_lessons: 0
  },
  {
    id: 'options-trading',
    title: 'Options Trading',
    description: 'Complete guide to options strategies and derivatives',
    level: 'advanced',
    total_lessons: 15,
    estimated_duration: 240,
    completed_lessons: 0
  },
  {
    id: 'market-psychology',
    title: 'Market Psychology',
    description: 'Understanding trader psychology and market sentiment',
    level: 'intermediate',
    total_lessons: 10,
    estimated_duration: 150,
    completed_lessons: 0
  }
];

export function TutorTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use mock data since learning_topics table doesn't exist yet
    setTimeout(() => {
      setTopics(MOCK_TOPICS);
      setLoading(false);
    }, 500);
  }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (topic: Topic) => {
    if (topic.total_lessons === 0) return 0;
    return Math.round((topic.completed_lessons / topic.total_lessons) * 100);
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
          Structured learning paths to master trading concepts at your own pace
        </p>
        <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
          📚 These are preview topics. The full interactive learning system will be available once the learning database tables are set up.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {topics.map((topic) => {
          const progress = calculateProgress(topic);
          const isCompleted = progress === 100;
          
          return (
            <Card key={topic.id} className="h-full">
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

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    {progress}% complete
                  </div>
                  <Button size="sm" disabled>
                    Coming Soon
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}