// app/tutor/page.tsx - Complete updated file with enhanced polling
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
  Bot,
  PanelLeftClose,
  PanelLeft,
  Menu,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TutorVideoResponse } from "@/components/tutor/TutorVideoResponse";
import { TutorChat } from "@/components/tutor/TutorChat";
import { TutorTopics } from "@/components/tutor/TutorTopics";
import { LiveSession } from "@/components/tutor/LiveSession";
import { ChatHistorySidebar } from "@/components/tutor/ChatHistorySidebar";
import { LiveSessionHistory } from "@/components/tutor/LiveSessionHistory";
import { useLiveSession } from "@/hooks/useLiveSession";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Update the VideoResponse interface in page.tsx
interface VideoResponse {
  id: string;
  coach_id: string;
  student_id: string;
  status: string;
  url: string | null;
  stream_url?: string | null;
  download_url?: string | null;
  created_at: string;
  updated_at?: string;
  tavus_video_id?: string;
  question: string;
  topic?: string;
  user_level?: string;
  coach: {
    name: string;
    avatar_url: string | null;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  model?: string;
  topic?: string;
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
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  // Use the live session hook
  const { activeSession, isStarting, startSession, endSession, closeSession } = useLiveSession();

  useEffect(() => {
    async function checkAccess() {
      try {
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

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        setCurrentUser(user);
        setUserRole(profile?.role || 'student');

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

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarCollapsed(true);
      }
    };
    
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [pollingIntervals]);

  // Enhanced video polling function
  const pollForVideoCompletion = (videoId: string) => {
    console.log('Starting to poll for video completion:', videoId);
    
    // Don't start polling if already polling this video
    if (pollingIntervals.has(videoId)) {
      console.log('Already polling video:', videoId);
      return;
    }
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tutor/video-status/${videoId}`);
        if (response.ok) {
          const videoData = await response.json();
          console.log('Video poll result:', videoData);
          
          if (videoData.status === 'ready' && videoData.url) {
            // Stop polling
            clearInterval(pollInterval);
            setPollingIntervals(prev => {
              const newMap = new Map(prev);
              newMap.delete(videoId);
              return newMap;
            });
            
            toast({
              title: "Video Ready!",
              description: "Your personalized video response is now available.",
            });
            
            // Refresh video responses
            await fetchVideoResponses(currentUser.id);
            
          } else if (videoData.status === 'failed' || videoData.status === 'error') {
            // Stop polling
            clearInterval(pollInterval);
            setPollingIntervals(prev => {
              const newMap = new Map(prev);
              newMap.delete(videoId);
              return newMap;
            });
            
            toast({
              title: "Video Generation Failed",
              description: videoData.error_message || "There was an issue generating your video. Please try again.",
              variant: "destructive",
            });
            
            // Refresh video responses
            await fetchVideoResponses(currentUser.id);
          }
        } else {
          console.error('Failed to poll video status:', response.status);
        }
      } catch (error) {
        console.error('Error in polling:', error);
      }
    }, 10000); // Poll every 10 seconds

    // Store the interval
    setPollingIntervals(prev => new Map(prev).set(videoId, pollInterval));

    // Clear polling after 10 minutes (videos should be ready by then)
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollingIntervals(prev => {
        const newMap = new Map(prev);
        newMap.delete(videoId);
        return newMap;
      });
      console.log('Stopped polling for video:', videoId);
    }, 600000);
  };

  // Enhanced video fetching with all new fields
  // app/tutor/page.tsx - Update the fetchVideoResponses function
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
        stream_url,
        download_url,
        created_at,
        updated_at,
        tavus_video_id,
        question,
        topic,
        user_level,
        script_used,
        metadata
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching video responses:', error);
      setVideoResponses([]);
      return;
    }

    const transformedData: VideoResponse[] = (data || []).map((item: any) => ({
      id: item.id,
      coach_id: item.coach_id,
      student_id: item.student_id,
      status: item.status,
      url: item.url,
      stream_url: item.stream_url,
      download_url: item.download_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
      tavus_video_id: item.tavus_video_id,
      // Use actual stored question and topic instead of hardcoded values
      question: item.question || 'Trading Question',
      topic: item.topic,
      user_level: item.user_level,
      coach: {
        name: 'iTrader',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=itrader&backgroundColor=1e40af&accessories=prescription02&accessoriesColor=262e33&clothing=blazerShirt&clothingColor=3c4858&eyes=default&eyebrows=default&facialHair=none&hair=short01&hairColor=2c1b18&mouth=default&skin=f2d3b1`
      }
    }));

    console.log('Fetched video responses:', transformedData);
    setVideoResponses(transformedData);
  } catch (error: any) {
    console.error('Error fetching video responses:', error);
    setVideoResponses([]);
  }
}

  async function fetchUserStats(studentId: string) {
  try {
    // Get video count
    const { count: videoCount, error: videoError } = await supabase
      .from('video_responses')
      .select('id', { count: 'exact' })
      .eq('student_id', studentId);

    if (videoError) {
      console.error('Error fetching video count:', videoError);
    }

    // Get chat message count with proper query structure
    let chatCount = 0;
    try {
      // First get the user's conversations
      const { data: conversations, error: convError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', studentId);

      if (!convError && conversations && conversations.length > 0) {
        const conversationIds = conversations.map(conv => conv.id);
        
        // Then count messages in those conversations
        const { count: msgCount, error: msgError } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact' })
          .in('conversation_id', conversationIds);

        if (!msgError) {
          chatCount = msgCount || 0;
        }
      }
    } catch (chatError) {
      console.error('Error fetching chat count:', chatError);
    }

    // Get topics covered count
    let topicsCovered = 0;
    try {
      const { data: uniqueTopics, error: topicsError } = await supabase
        .from('video_responses')
        .select('topic')
        .eq('student_id', studentId)
        .not('topic', 'is', null);

      if (!topicsError && uniqueTopics) {
        const uniqueTopicSet = new Set(uniqueTopics.map(item => item.topic).filter(Boolean));
        topicsCovered = uniqueTopicSet.size;
      }
    } catch (topicsError) {
      console.error('Error fetching topics:', topicsError);
    }

    // Calculate learning time (rough estimate based on video count and chat interactions)
    const estimatedLearningTime = Math.round(((videoCount || 0) * 3 + (chatCount || 0) * 0.5) / 60 * 10) / 10;

    const stats: UserStats = {
      videoResponsesCount: videoCount || 0,
      chatInteractions: chatCount,
      learningTimeHours: estimatedLearningTime,
      topicsCovered: topicsCovered,
      tradingExperience: 'beginner'
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
        description: result.message || `Creating your personalized video response. This usually takes 2-3 minutes.`,
      });
      
      await fetchVideoResponses(currentUser.id);
      setActiveTab('video');
      
      // Start polling for this specific video
      if (result.videoId) {
        pollForVideoCompletion(result.videoId);
      }
      
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

  // Enhanced video request handling
  async function handleSubmitQuestion() {
    const { data: { session } } = await supabase.auth.getSession();
    
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
                     question.toLowerCase().includes('psychology') ? 'Trading Psychology' : 
                     question.toLowerCase().includes('options') ? 'Options Trading' :
                     question.toLowerCase().includes('fundamental') ? 'Fundamental Analysis' : undefined,
          userLevel: userStats?.tradingExperience || 'beginner'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit question');
      }

      toast({
        title: "Video Request Submitted",
        description: result.message || "Generating your personalized video response. This usually takes 2-3 minutes.",
      });

      setQuestion("");
      await fetchVideoResponses(currentUser.id);
      setActiveTab('video');
      
      // Start polling for this specific video
      if (result.videoId) {
        pollForVideoCompletion(result.videoId);
      }
      
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

  const handleStartLiveSession = async (context: any) => {
    try {
      const result = await startSession(context);

      if (result.errorType === 'access_required') {
        toast({
          title: "CVI Access Required",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.errorType === 'network_error') {
        toast({
          title: "Connection Issue", 
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.errorType === 'service_unavailable') {
        toast({
          title: "Service Temporarily Unavailable",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Live Session Started!",
        description: result.message || "Connecting you to your AI tutor...",
      });

    } catch (error: any) {
      console.error('Error starting live session:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start live session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/tutor/chat/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp,
          topic: msg.topic,
          model: msg.model
        }));
        
        setCurrentConversationId(conversationId);
        setConversationMessages(formattedMessages);
        setActiveTab('chat');
        setMobileSidebarOpen(false); // Close mobile sidebar after selection
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
    setConversationMessages([]);
    setActiveTab('chat');
    setMobileSidebarOpen(false); // Close mobile sidebar after creating new conversation
  };

  const handleConversationCreated = (conversationId: string, title: string) => {
    setCurrentConversationId(conversationId);
    toast({
      title: "New Conversation Started",
      description: "Your chat with iTrader is now being saved.",
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading iTrader...</p>
        </div>
      </div>
    );
  }

  // Mobile sidebar component
  const MobileSidebar = () => (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <ChatHistorySidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isCollapsed={false}
        />
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block border-r transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
          <ChatHistorySidebar
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            isCollapsed={sidebarCollapsed}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="border-b p-3 sm:p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <MobileSidebar />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex flex-shrink-0"
                >
                  {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 flex-shrink-0"
                  asChild
                >
                  <Link href="/dashboard">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
              </div>
              
              <div className="min-w-0 flex-1 text-center px-2">
                <h1 className="text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                  <span className="truncate">iTrader</span>
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                  Your Personal AI Trading Tutor
                </p>
              </div>
              
              <div className="w-16 sm:w-24"></div> {/* Spacer for balance */}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full lg:grid lg:grid-cols-4 lg:gap-6 p-3 sm:p-4">
              {/* Main Chat/Content Area */}
              <div className="lg:col-span-3 h-full overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-4 w-full flex-shrink-0 mb-4">
                    <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                      <Video className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Videos</span>
                      {videoResponses.filter(v => v.status === 'processing' || v.status === 'generating' || v.status === 'queued').length > 0 && (
                        <Badge variant="secondary" className="text-xs h-4 w-4 p-0 flex items-center justify-center">
                          {videoResponses.filter(v => v.status === 'processing' || v.status === 'generating' || v.status === 'queued').length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="topics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Topics</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
                      <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>Live History</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="chat" className="h-full m-0">
                      <TutorChat 
                        currentUser={currentUser} 
                        onRequestVideo={handleRequestVideoFromChat}
                        conversationId={currentConversationId}
                        onConversationCreated={handleConversationCreated}
                        initialMessages={conversationMessages}
                      />
                    </TabsContent>
                    
                    <TabsContent value="video" className="h-full m-0 overflow-auto">
                      <div className="h-full overflow-y-auto space-y-4">
                        <TutorVideoResponse 
                          videoResponses={videoResponses}
                          onStartLiveSession={handleStartLiveSession}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="topics" className="h-full m-0 overflow-auto">
                      <div className="h-full overflow-y-auto">
                        <TutorTopics 
                          onRequestVideo={handleRequestVideoFromChat} 
                          onStartLiveSession={handleStartLiveSession}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="history" className="h-full m-0 overflow-auto">
                      <div className="h-full overflow-y-auto">
                        <LiveSessionHistory 
                          onStartFollowUp={handleStartLiveSession}
                        />
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Sidebar Content - Hidden on mobile */}
              <div className="hidden lg:block space-y-4 overflow-y-auto">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">Ask iTrader</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Get a personalized video response or start a live session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Your Question</label>
                      <Textarea 
                        placeholder="Ask about trading strategies, risk management, technical analysis..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        rows={3}
                        className="resize-none text-xs min-h-[60px]"
                        disabled={submitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Be specific to get the most helpful response from iTrader
                      </p>
                    </div>

                    {/* Updated button layout with both options */}
                    <div className="space-y-2">
                      <Button 
                        className="w-full text-xs h-8" 
                        onClick={handleSubmitQuestion}
                        disabled={!question.trim() || submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Creating Video...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-3 w-3" />
                            Get Video Response
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="w-full text-xs h-8" 
                        onClick={() => {
                          if (question.trim()) {
                            // Start live session with the current question as context
                            const context = {
                              topic: question.trim(),
                              sessionType: 'initial',
                              topicLevel: 'general',
                              context: `LIVE TUTORING SESSION

STUDENT REQUEST: The student wants to discuss: "${question.trim()}"

YOUR INSTRUCTIONS:
1. IMMEDIATELY start discussing this topic when the session begins
2. Be enthusiastic and engaging from the first moment  
3. Ask about their current experience with this topic
4. Provide practical examples and real-world applications
5. Keep the conversation interactive and flowing

CONVERSATION STARTER: "Hi! I see you want to discuss '${question.trim()}' - great topic! Let me start by asking about your current experience with this. What specific aspect would you like to focus on?"

Remember: BE PROACTIVE, START IMMEDIATELY, KEEP ENGAGING!`,
                              coachId: 'itrader'
                            };
                            handleStartLiveSession(context);
                            setQuestion(""); // Clear the question after starting session
                          } else {
                            // Start general live session
                            const context = {
                              topic: 'General Trading Discussion',
                              sessionType: 'initial',
                              topicLevel: 'general',
                              context: `GENERAL LIVE TUTORING SESSION

STUDENT REQUEST: The student wants to have a general discussion about trading.

YOUR INSTRUCTIONS:
1. IMMEDIATELY start the conversation when the session begins
2. Be enthusiastic and welcoming
3. Ask about their trading goals and experience level
4. Find out what they want to learn most about
5. Tailor the conversation to their interests

CONVERSATION STARTER: "Hi there! I'm excited to chat with you about trading. What's your current experience level, and what aspects of trading are you most interested in learning about today?"

Remember: BE PROACTIVE, START IMMEDIATELY, KEEP ENGAGING!`,
                              coachId: 'itrader'
                            };
                            handleStartLiveSession(context);
                          }
                        }}
                        disabled={isStarting}
                      >
                        {isStarting ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-3 w-3" />
                            Start Live Session
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Separator and info */}
                    <div className="text-xs text-center space-y-1">
                      <Separator />
                      <p className="text-muted-foreground">
                        💡 <strong>Tip:</strong> Live sessions are great for interactive learning and immediate feedback
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {userStats && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Learning Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Video className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">Videos</span>
                          </div>
                          <span className="font-medium text-xs flex-shrink-0">{userStats.videoResponsesCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">Messages</span>
                          </div>
                          <span className="font-medium text-xs flex-shrink-0">{userStats.chatInteractions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate">Time</span>
                          </div>
                          <span className="font-medium text-xs flex-shrink-0">{userStats.learningTimeHours}h</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Popular Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {suggestedTopics.slice(0, 6).map((topic) => (
                        <Badge 
                          key={topic} 
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 text-xs px-2 py-1 truncate"
                          onClick={() => setQuestion(`Can you explain ${topic} in detail?`)}
                        >
                          {topic.split(' ')[0]}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Live Session */}
      {activeSession && (
        <LiveSession
          roomUrl={activeSession.roomUrl}
          sessionType={activeSession.sessionType}
          topic={activeSession.topic}
          onClose={closeSession}
          onSessionEnd={endSession}
        />
      )}

      {/* Loading overlay when starting session */}
      {isStarting && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <div>
                  <p className="font-medium text-sm">Starting Live Session</p>
                  <p className="text-xs text-muted-foreground">
                    Setting up your connection with iTrader...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}