"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Send, 
  Video, 
  MessageSquare, 
  Play, 
  Loader2, 
  Clock,
  BookOpen,
  User,
  Lightbulb,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
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
  coach: {
    name: string;
    avatar_url: string | null;
  };
}

interface Coach {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  expertise_areas: string[];
  rating: number;
}

interface UserStats {
  videoResponsesCount: number;
  chatInteractions: number;
  learningTimeHours: number;
  topicsCovered: number;
}

export default function TutorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [videoResponses, setVideoResponses] = useState<VideoResponse[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
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

        // Get user profile for role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setCurrentUser(user);
        setUserRole(profile?.role || 'student');

        // If user is a student, load their data
        if (profile?.role === 'student') {
          await Promise.all([
            fetchVideoResponses(user.id),
            fetchAvailableCoaches(),
            fetchUserStats(user.id),
            loadSuggestedTopics()
          ]);
        } else {
          toast({
            title: "Access Restricted",
            description: "The AI tutor is only available for students.",
            variant: "destructive",
          });
          router.push('/dashboard');
        }
      } catch (error: any) {
        console.error('Error checking access:', error);
        router.push('/dashboard');
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
          coach_profiles!video_responses_coach_id_fkey (
            coach_id,
            user_profiles!coach_profiles_coach_id_fkey (
              prof_id,
              avatar_url,
              profiles (
                name
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching video responses:', error);
        setVideoResponses([]);
        return;
      }

      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        id: item.id,
        coach_id: item.coach_id,
        student_id: item.student_id,
        status: item.status,
        url: item.url,
        created_at: item.created_at,
        coach: {
          name: item.coach_profiles?.user_profiles?.profiles?.name || 'AI Tutor',
          avatar_url: item.coach_profiles?.user_profiles?.avatar_url || null
        }
      })) || [];

      setVideoResponses(transformedData);
    } catch (error: any) {
      console.error('Error fetching video responses:', error);
      setVideoResponses([]);
      toast({
        title: "Error",
        description: "Failed to load your video responses. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function fetchAvailableCoaches() {
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select(`
          coach_id,
          expertise_areas,
          hourly_rate,
          rating,
          verification_status,
          user_profiles!coach_profiles_coach_id_fkey (
            prof_id,
            avatar_url,
            bio,
            profiles (
              name
            )
          )
        `)
        .eq('verification_status', 'verified')
        .order('rating', { ascending: false });

      if (error) throw error;

      // Transform the data
      const transformedCoaches = data?.map(coach => ({
        id: coach.coach_id,
        name: coach.user_profiles?.profiles?.name || 'Unknown Coach',
        avatar_url: coach.user_profiles?.avatar_url || null,
        bio: coach.user_profiles?.bio || null,
        expertise_areas: coach.expertise_areas || [],
        rating: coach.rating || 0
      })) || [];

      setCoaches(transformedCoaches);
      
      // Set default selected coach (first one)
      if (transformedCoaches.length > 0) {
        setSelectedCoach(transformedCoaches[0]);
      }
    } catch (error: any) {
      console.error('Error fetching coaches:', error);
      setCoaches([]);
      toast({
        title: "Error",
        description: "Failed to load available coaches. Please try again.",
        variant: "destructive",
      });
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

      // Set default stats since advanced tables don't exist yet
      const stats: UserStats = {
        videoResponsesCount: videoCount || 0,
        chatInteractions: 0, // Will be 0 until chat_messages table is created
        learningTimeHours: 0, // Will be 0 until learning_progress table is created
        topicsCovered: 0 // Will be 0 until learning system is implemented
      };

      setUserStats(stats);
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      // Set default stats if fetch fails
      setUserStats({
        videoResponsesCount: 0,
        chatInteractions: 0,
        learningTimeHours: 0,
        topicsCovered: 0
      });
    }
  }

  async function loadSuggestedTopics() {
    // Use static topics since learning_topics table doesn't exist yet
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

// Updated handleSubmitQuestion function in page.tsx
async function handleSubmitQuestion() {
  if (!question.trim() || !currentUser || !selectedCoach) return;

  setSubmitting(true);
  try {
    const response = await fetch('/api/tutor/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question.trim(),
        coachId: selectedCoach.id,
        topicHint: question.toLowerCase().includes('risk') ? 'Risk Management' :
                   question.toLowerCase().includes('technical') ? 'Technical Analysis' :
                   question.toLowerCase().includes('psychology') ? 'Trading Psychology' : undefined
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit question');
    }

    toast({
      title: "Question Submitted",
      description: "Your AI tutor is generating a personalized video response. This usually takes 1-2 minutes.",
    });

    setQuestion("");
    
    // Refresh video responses to show the new processing video
    await fetchVideoResponses(currentUser.id);
    
    // Poll for video completion (optional)
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

// Optional: Poll for video completion
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
        // Refresh video responses
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
  }, 10000); // Poll every 10 seconds

  // Stop polling after 5 minutes
  setTimeout(() => clearInterval(pollInterval), 300000);
}

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
    <div className="container py-8">
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
            <h1 className="text-3xl font-bold">AI Trading Tutor</h1>
            <p className="text-muted-foreground">Get personalized video responses to your trading questions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content area */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Video Responses</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Learning Topics</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="space-y-4 pt-4">
              <TutorVideoResponse videoResponses={videoResponses} />
            </TabsContent>
            
            <TabsContent value="chat" className="space-y-4 pt-4">
              <TutorChat currentUser={currentUser} />
            </TabsContent>
            
            <TabsContent value="topics" className="space-y-4 pt-4">
              <TutorTopics />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ask a question card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Ask Your Question
              </CardTitle>
              <CardDescription>
                Get a personalized video response from your AI tutor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coaches.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select AI Tutor</label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {coaches.map((coach) => (
                      <div 
                        key={coach.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedCoach?.id === coach.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedCoach(coach)}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.id}`} 
                          />
                          <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{coach.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {coach.expertise_areas.slice(0, 2).join(', ')}
                            {coach.expertise_areas.length > 2 && '...'}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs ml-1">{coach.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Question</label>
                <Textarea 
                  placeholder="Ask about trading strategies, market analysis, risk management..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific with your question to get the most helpful response
                </p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmitQuestion}
                disabled={!question.trim() || submitting || !selectedCoach}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Question
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
                      <span className="text-sm">Chat Interactions</span>
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
              <CardTitle className="text-lg">Suggested Topics</CardTitle>
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