// app/tutor/page.tsx - Fixed database schema compatibility
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Send, 
  Video, 
  MessageSquare, 
  Loader2, 
  Clock,
  BookOpen,
  User,
  Lightbulb,
  Star,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TutorVideoResponse } from "@/components/tutor/TutorVideoResponse";
import { TutorChat } from "@/components/tutor/TutorChat";
import { TutorTopics } from "@/components/tutor/TutorTopics";

interface VideoResponse {
  id: string;
  coach_id: string;
  student_id: string;
  status: string;
  url: string | null;
  created_at: string;
  question: string;
  topic?: string;
  coach: {
    name: string;
    avatar_url: string | null;
  };
}

interface UserStats {
  videoResponsesCount: number;
  chatInteractions: number;
  learningTimeHours: number;
  topicsCovered: number;
  tradingExperience?: string;
}

export default function TutorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [videoResponses, setVideoResponses] = useState<VideoResponse[]>([]);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [isStartingLiveSession, setIsStartingLiveSession] = useState(false); // Add this line
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    async function checkAccess() {
      try {
        // Check if user is logged in
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          router.push('/sign-in');
          return;
        }

        if (!session?.user) {
          console.error('No active session');
          router.push('/sign-in');
          return;
        }

        const user = session.user;
        console.log('User session found:', user.id);

        // Get user profile for role (only select existing columns)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          // Continue anyway for demo purposes
        }

        setCurrentUser(user);
        setUserRole(profile?.role || 'student');

        // Load user data
        await Promise.all([
          fetchVideoResponses(user.id),
          fetchUserStats(user.id),
          loadSuggestedTopics()
        ]);

      } catch (error: any) {
        console.error('Error checking access:', error);
        toast({
          title: "Authentication Error",
          description: "Please sign in to access iTrader.",
          variant: "destructive",
        });
        router.push('/sign-in');
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [router, toast]);

  async function fetchVideoResponses(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('video_responses')
        .select(`
          id,
          coach_id,
          student_id,
          status,
          url,
          created_at,
          tavus_video_id,
          template_id
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching video responses:', error);
        setVideoResponses([]);
        return;
      }

      // Transform the data (add question and topic from response if stored in localStorage or default)
      const transformedData: VideoResponse[] = (data || []).map((item: any) => ({
        id: item.id,
        coach_id: item.coach_id,
        student_id: item.student_id,
        status: item.status,
        url: item.url,
        created_at: item.created_at,
        question: 'Trading Question', // Default since column doesn't exist yet
        topic: undefined,
        coach: {
          name: 'iTrader',
          avatar_url: null
        }
      }));

      setVideoResponses(transformedData);
    } catch (error: any) {
      console.error('Error fetching video responses:', error);
      setVideoResponses([]);
    }
  }

  async function fetchUserStats(studentId: string) {
    try {
      // Fetch video responses count
      const { count: videoCount, error: videoError } = await supabase
        .from('video_responses')
        .select('id', { count: 'exact' })
        .eq('student_id', studentId);

      if (videoError) {
        console.error('Error fetching video count:', videoError);
      }

      const stats: UserStats = {
        videoResponsesCount: videoCount || 0,
        chatInteractions: 0,
        learningTimeHours: 0,
        topicsCovered: 0,
        tradingExperience: 'beginner' // Default value
      };

      setUserStats(stats);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      setUserStats({
        videoResponsesCount: 0,
        chatInteractions: 0,
        learningTimeHours: 0,
        topicsCovered: 0,
        tradingExperience: 'beginner'
      });
    }
  }

  async function loadSuggestedTopics() {
    setSuggestedTopics([
      "Risk Management",
      "Technical Analysis",
      "Candlestick Patterns",
      "Market Psychology",
      "Trading Plan",
      "Position Sizing",
      "Trend Analysis"
    ]);
  }

  const handleRequestVideoFromChat = async (question: string, topic?: string) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/tutor/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          topicHint: topic,
          userLevel: userStats?.tradingExperience || 'beginner'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create video response');
      }

      toast({
        title: "Video Response Started",
        description: `iTrader is creating your personalized video response. This usually takes 2-3 minutes.`,
      });
      
      await fetchVideoResponses(currentUser.id);
      setActiveTab('video');
      
    } catch (error: any) {
      console.error('Error requesting video from chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create video response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  async function handleSubmitQuestion() {
    console.log('Submit question clicked');
    
    // Check session before making request
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', !!session?.user);
    
    if (!session?.user) {
      toast({
        title: "Session Expired",
        description: "Please refresh the page and sign in again.",
        variant: "destructive",
      });
      router.push('/sign-in');
      return;
    }

    if (!question.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/tutor/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          topicHint: question.toLowerCase().includes('risk') ? 'Risk Management' :
                     question.toLowerCase().includes('technical') ? 'Technical Analysis' :
                     question.toLowerCase().includes('psychology') ? 'Trading Psychology' : undefined,
          userLevel: userStats?.tradingExperience || 'beginner'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit question');
      }

      toast({
        title: "Question Submitted",
        description: "iTrader is generating your personalized video response. This usually takes 2-3 minutes.",
      });

      setQuestion("");
      await fetchVideoResponses(currentUser.id);
      setActiveTab('video');
      pollForVideoCompletion(result.videoId);
      
    } catch (error: any) {
      console.error('Error submitting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function pollForVideoCompletion(videoId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('video_responses')
          .select('status, url')
          .eq('id', videoId)
          .single();

        if (error) {
          console.error('Error polling video status:', error);
          clearInterval(pollInterval);
          return;
        }

        if (data.status === 'ready' && data.url) {
          clearInterval(pollInterval);
          toast({
            title: "Video Ready!",
            description: "Your personalized video response is now available.",
          });
          await fetchVideoResponses(currentUser.id);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          toast({
            title: "Video Generation Failed",
            description: "There was an issue generating your video. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in polling:', error);
        clearInterval(pollInterval);
      }
    }, 10000);

    setTimeout(() => clearInterval(pollInterval), 300000);
  }

    const handleStartLiveSession = async (context: any) => {
    setIsStartingLiveSession(true);
    try {
      const response = await fetch('/api/tutor/start-contextual-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start live session');
      }

      toast({
        title: "Live Session Started!",
        description: result.message || "Connecting you to your AI tutor...",
      });

      // Redirect to the Daily.co room URL
      if (result.roomUrl) {
        window.open(result.roomUrl, '_blank');
      }

    } catch (error: any) {
      console.error('Error starting live session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start live session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStartingLiveSession(false);
    }
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

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4"
          asChild
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              iTrader - Your AI Trading Tutor
            </h1>
            <p className="text-muted-foreground">Get personalized video responses and real-time trading guidance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat with iTrader</span>
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Video Responses</span>
                {videoResponses.filter(v => v.status === 'processing').length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {videoResponses.filter(v => v.status === 'processing').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Learning Topics</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-4 pt-4">
              <TutorChat 
                currentUser={currentUser} 
                onRequestVideo={handleRequestVideoFromChat}
              />
            </TabsContent>
            
            <TabsContent value="video" className="space-y-4 pt-4">
              <TutorVideoResponse 
                videoResponses={videoResponses}
              />
            </TabsContent>
            
            <TabsContent value="topics" className="space-y-4 pt-4">
              <TutorTopics onRequestVideo={handleRequestVideoFromChat} />
            </TabsContent>
          </Tabs>

                  <TabsContent value="video" className="space-y-4 pt-4">
          <TutorVideoResponse
            videoResponses={videoResponses}
            onStartLiveSession={handleStartLiveSession} // Add this prop
          />
        </TabsContent>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ask a question card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Ask iTrader
              </CardTitle>
              <CardDescription>
                Get a personalized video response from your AI trading tutor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Question</label>
                <Textarea 
                  placeholder="Ask about trading strategies, market analysis, risk management..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="resize-none"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific with your question to get the most helpful response
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmitQuestion}
                disabled={!question.trim() || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Video...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Get Video Response
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Stats Card */}
          {userStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Learning Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Video Responses</span>
                    </div>
                    <span className="font-medium">{userStats.videoResponsesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Chat Messages</span>
                    </div>
                    <span className="font-medium">{userStats.chatInteractions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Learning Time</span>
                    </div>
                    <span className="font-medium">{userStats.learningTimeHours} hrs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Topics Covered</span>
                    </div>
                    <span className="font-medium">{userStats.topicsCovered}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((topic) => (
                  <Badge 
                    key={topic} 
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setQuestion(`Can you explain ${topic} in detail?`)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}