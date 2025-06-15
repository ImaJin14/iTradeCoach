"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  BookOpen, 
  CheckCircle, 
  Video, 
  MessageSquare, 
  FileText,
  Play,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz';
  duration: number;
  completed: boolean;
  order_index: number;
  content?: string;
  video_url?: string;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
}

interface LearningTopic {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  total_lessons: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LessonData {
  id: string;
  topic_id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz';
  content?: string;
  video_url?: string;
  duration: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  topic_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
  time_spent: number;
  created_at: string;
  updated_at: string;
}

export default function TopicPage({ params }: { params: { id: string } }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        setCurrentUser(user);
        await fetchTopicData(params.id, user.id);
      } catch (error: any) {
        console.error('Error checking access:', error);
        router.push('/tutor');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [params.id, router]);

  async function fetchTopicData(topicId: string, userId: string) {
    try {
      // Use type assertion to bypass TypeScript errors temporarily
      const { data: topicData, error: topicError } = await (supabase as any)
        .from('learning_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (topicError) throw topicError;

      if (!topicData) {
        toast({
          title: "Topic Not Found",
          description: "The requested learning topic could not be found.",
          variant: "destructive",
        });
        router.push('/tutor');
        return;
      }

      // Fetch lessons for this topic
      const { data: lessonsData, error: lessonsError } = await (supabase as any)
        .from('lessons')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Fetch user progress for these lessons
      const lessonIds = lessonsData?.map((l: LessonData) => l.id) || [];
      const { data: progressData, error: progressError } = await (supabase as any)
        .from('user_lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      if (progressError) throw progressError;

      // Create a map of completed lessons
      const completedLessons = new Set(
        progressData?.filter((p: UserProgress) => p.completed).map((p: UserProgress) => p.lesson_id) || []
      );

      // Transform lessons data
      const lessons: Lesson[] = lessonsData?.map((lesson: LessonData) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        type: lesson.type,
        duration: lesson.duration,
        completed: completedLessons.has(lesson.id),
        order_index: lesson.order_index,
        content: lesson.content,
        video_url: lesson.video_url
      })) || [];

      const topicWithLessons: Topic = {
        id: topicData.id,
        title: topicData.title,
        description: topicData.description,
        level: topicData.level,
        lessons
      };

      setTopic(topicWithLessons);
      
      // Set the first incomplete lesson as active, or the first lesson if all are complete
      const firstIncompleteLesson = lessons.find(lesson => !lesson.completed);
      setActiveLesson(firstIncompleteLesson || lessons[0]);
    } catch (error: any) {
      console.error('Error fetching topic data:', error);
      
      // If tables don't exist, show a helpful message
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        toast({
          title: "Learning System Not Ready",
          description: "The learning system tables need to be created. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load topic data. Please try again.",
          variant: "destructive",
        });
      }
      router.push('/tutor');
    }
  }

  const markLessonComplete = async (lessonId: string) => {
    if (!currentUser || !topic) return;
    
    try {
      // Update lesson progress in database
      const { error } = await (supabase as any)
        .from('user_lesson_progress')
        .upsert({
          user_id: currentUser.id,
          topic_id: topic.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      const updatedLessons = topic.lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, completed: true } : lesson
      );
      
      setTopic({ ...topic, lessons: updatedLessons });
      
      toast({
        title: "Lesson Completed",
        description: "Your progress has been saved. You earned 10 XP!",
      });
      
      // Move to the next lesson if available
      const currentIndex = topic.lessons.findIndex(lesson => lesson.id === lessonId);
      if (currentIndex < topic.lessons.length - 1) {
        setActiveLesson(topic.lessons[currentIndex + 1]);
      }
    } catch (error: any) {
      console.error('Error marking lesson complete:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateProgress = () => {
    if (!topic) return 0;
    const completedCount = topic.lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedCount / topic.lessons.length) * 100);
  };

  const getNextLesson = () => {
    if (!topic || !activeLesson) return null;
    const currentIndex = topic.lessons.findIndex(lesson => lesson.id === activeLesson.id);
    return currentIndex < topic.lessons.length - 1 ? topic.lessons[currentIndex + 1] : null;
  };

  const getPreviousLesson = () => {
    if (!topic || !activeLesson) return null;
    const currentIndex = topic.lessons.findIndex(lesson => lesson.id === activeLesson.id);
    return currentIndex > 0 ? topic.lessons[currentIndex - 1] : null;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Topic Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested learning topic could not be found.</p>
          <Button asChild>
            <Link href="/tutor">Back to AI Tutor</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4"
          asChild
        >
          <Link href="/tutor">
            <ChevronLeft className="h-4 w-4" />
            Back to AI Tutor
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{topic.title}</h1>
              <Badge variant="outline" className="capitalize">
                {topic.level}
              </Badge>
            </div>
            <p className="text-muted-foreground">{topic.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar - Lesson List */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Course Progress</CardTitle>
              <CardDescription>
                {topic.lessons.filter(l => l.completed).length} of {topic.lessons.length} lessons completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={calculateProgress()} className="h-2" />
                
                <div className="space-y-2">
                  {topic.lessons.map((lesson) => (
                    <div 
                      key={lesson.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        activeLesson?.id === lesson.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveLesson(lesson)}
                    >
                      <div className={`p-1 rounded-full ${lesson.completed ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                        {lesson.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          lesson.type === 'video' ? (
                            <Video className="h-4 w-4" />
                          ) : lesson.type === 'quiz' ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <div className={`font-medium ${lesson.completed ? 'text-muted-foreground' : ''}`}>
                          {lesson.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lesson.duration} min • {lesson.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Lesson */}
        <div className="md:col-span-2 space-y-6">
          {activeLesson && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{activeLesson.title}</CardTitle>
                    <CardDescription>{activeLesson.description}</CardDescription>
                  </div>
                  <Badge variant="outline">
                    {activeLesson.duration} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lesson Content */}
                {activeLesson.type === 'video' && (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {activeLesson.video_url ? (
                      <video
                        src={activeLesson.video_url}
                        controls
                        className="w-full h-full rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="text-center">
                        <Button variant="outline" size="lg" className="gap-2">
                          <Play className="h-5 w-5" />
                          Video Coming Soon
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeLesson.type === 'text' && (
                  <div className="prose max-w-none">
                    {activeLesson.content ? (
                      <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                    ) : (
                      <div>
                        <p>
                          This is a text-based lesson on {activeLesson.title.toLowerCase()}. In this lesson, you'll learn about the key concepts and principles related to this topic.
                        </p>
                        <p>
                          Trading requires a solid understanding of market dynamics, risk management, and analytical skills. This lesson will help you develop these skills and apply them to your trading strategy.
                        </p>
                        <h3>Key Points</h3>
                        <ul>
                          <li>Understanding market structure and price action</li>
                          <li>Identifying key support and resistance levels</li>
                          <li>Recognizing chart patterns and their implications</li>
                          <li>Applying technical indicators effectively</li>
                          <li>Managing risk through proper position sizing</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeLesson.type === 'quiz' && (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Test your knowledge with this quiz on {activeLesson.title.toLowerCase()}.
                    </p>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Quiz content is being prepared.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Interactive quizzes will be available soon.
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const prevLesson = getPreviousLesson();
                      if (prevLesson) setActiveLesson(prevLesson);
                    }}
                    disabled={!getPreviousLesson()}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => markLessonComplete(activeLesson.id)}
                      disabled={activeLesson.completed}
                    >
                      {activeLesson.completed ? 'Completed' : 'Mark Complete'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        const nextLesson = getNextLesson();
                        if (nextLesson) setActiveLesson(nextLesson);
                      }}
                      disabled={!getNextLesson()}
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}