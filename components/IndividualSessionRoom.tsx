"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { DailyManager } from "@/lib/daily";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Phone, 
  Monitor,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface IndividualSession {
  id: string;
  scheduled_time: string;
  duration: number;
  status: string;
  notes: string | null;
  coach_id: string;
  student_id: string;
  price: number;
  coach: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  student: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface IndividualSessionRoomProps {
  sessionId: string;
}

export default function IndividualSessionRoom({ sessionId }: IndividualSessionRoomProps) {
  const [session, setSession] = useState<IndividualSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [dailyManager, setDailyManager] = useState<DailyManager | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Check if session can be joined
  const getSessionStatus = (scheduledTime: string, duration: number) => {
    const now = new Date();
    const sessionStart = new Date(scheduledTime);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
    const joinWindow = new Date(sessionStart.getTime() - 10 * 60000);

    if (now < joinWindow) {
      return { canJoin: false, message: 'Session not yet available' };
    } else if (now >= joinWindow && now < sessionEnd) {
      return { canJoin: true, message: 'Session is live' };
    } else {
      return { canJoin: false, message: 'Session has ended' };
    }
  };

  useEffect(() => {
    if (!sessionId) {
      router.push('/dashboard');
      return;
    }
    
    fetchSessionDetails();
    getCurrentUser();
  }, [sessionId, router]);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/sign-in');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('prof_id', user.id)
        .single();

      setCurrentUser({
        id: user.id,
        name: profile?.name || 'User',
        avatar_url: userProfile?.avatar_url
      });
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchSessionDetails = async () => {
    if (!sessionId) return;

    try {
      // Get individual session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get coach details
      const { data: coachProfile, error: coachError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', sessionData.coach_id)
        .single();

      if (coachError) throw coachError;

      // Get coach avatar
      const { data: coachUserProfile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('prof_id', sessionData.coach_id)
        .single();

      // Get student details
      const { data: studentProfile, error: studentError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', sessionData.student_id)
        .single();

      if (studentError) throw studentError;

      // Get student avatar
      const { data: studentUserProfile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('prof_id', sessionData.student_id)
        .single();

      const formattedSession: IndividualSession = {
        id: sessionData.id,
        scheduled_time: sessionData.scheduled_time,
        duration: sessionData.duration || 60,
        status: sessionData.status || 'scheduled',
        notes: sessionData.notes,
        coach_id: sessionData.coach_id,
        student_id: sessionData.student_id,
        price: sessionData.price || 0,
        coach: {
          id: sessionData.coach_id,
          name: coachProfile?.name || 'Coach',
          avatar_url: coachUserProfile?.avatar_url || null
        },
        student: {
          id: sessionData.student_id,
          name: studentProfile?.name || 'Student',
          avatar_url: studentUserProfile?.avatar_url || null
        }
      };

      setSession(formattedSession);
    } catch (error: any) {
      console.error('Error fetching session:', error);
      toast({
        title: "Error",
        description: "Failed to load session details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinVideoCall = async () => {
    if (!session || !currentUser || !sessionId) return;

    const sessionStatus = getSessionStatus(session.scheduled_time, session.duration);
    if (!sessionStatus.canJoin) {
      toast({
        title: "Cannot Join",
        description: sessionStatus.message,
        variant: "destructive",
      });
      return;
    }

    setJoining(true);
    try {
      // Initialize Daily manager
      const manager = new DailyManager({
        userName: currentUser.name,
        userAvatar: currentUser.avatar_url
      });

      // Create or get room
      const { roomUrl, token } = await manager.createRoom(sessionId);
      
      // Join the call
      await manager.joinRoom(roomUrl, {
        token,
        userName: currentUser.name
      });

      setDailyManager(manager);
      setIsInCall(true);

      // Set up event listeners
      manager.onCallStateChanged((state) => {
        if (state === 'left') {
          setIsInCall(false);
          setDailyManager(null);
        }
      });

      // Update session status to in progress
      await supabase
        .from('sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

      toast({
        title: "Joined Session",
        description: "You're now in the session!",
      });

    } catch (error: any) {
      console.error('Error joining call:', error);
      toast({
        title: "Error",
        description: "Failed to join the video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const leaveCall = async () => {
    if (dailyManager && sessionId) {
      await dailyManager.leaveRoom();
      setIsInCall(false);
      setDailyManager(null);
      
      // Update session status if needed
      await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);
        
      router.push('/dashboard');
    }
  };

  const toggleCamera = async () => {
    if (dailyManager) {
      await dailyManager.toggleCamera();
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMicrophone = async () => {
    if (dailyManager) {
      await dailyManager.toggleMicrophone();
      setIsMicOn(!isMicOn);
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

  if (!session) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested session could not be found.</p>
              <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessionStatus = getSessionStatus(session.scheduled_time, session.duration);

  return (
    <div className="min-h-screen bg-gray-900">
      {!isInCall && (
        <div className="container py-8">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 mb-4 text-white hover:text-gray-300"
            asChild
          >
            <Link href="/dashboard">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-6 w-6" />
                1-on-1 Session
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Coach: {session.coach.name}</span>
                <span>Student: {session.student.name}</span>
                <span>{session.duration} minutes</span>
                <span>${session.price}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {session.notes && (
                <div>
                  <h3 className="font-medium mb-2">Session Notes</h3>
                  <p className="text-muted-foreground">{session.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-center">
                <Badge variant={sessionStatus.canJoin ? "default" : "secondary"}>
                  {sessionStatus.message}
                </Badge>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Scheduled Time</div>
                  <div className="text-muted-foreground">
                    {new Date(session.scheduled_time).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Duration</div>
                  <div className="text-muted-foreground">{session.duration} minutes</div>
                </div>
              </div>

              {/* Participants */}
              <div>
                <h3 className="font-medium mb-3">Participants</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach.id}`} />
                      <AvatarFallback>{session.coach.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{session.coach.name}</div>
                      <div className="text-xs text-muted-foreground">Coach</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.student.id}`} />
                      <AvatarFallback>{session.student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{session.student.name}</div>
                      <div className="text-xs text-muted-foreground">Student</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <div className="text-center space-y-4">
                {sessionStatus.canJoin ? (
                  <Button
                    onClick={joinVideoCall}
                    disabled={joining}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {joining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Joining Session...
                      </>
                    ) : (
                      <>
                        <Video className="h-4 w-4" />
                        Join Session
                      </>
                    )}
                  </Button>
                ) : (
                  <Button disabled className="w-full" size="lg">
                    {sessionStatus.message}
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Make sure your camera and microphone are working before joining
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Call UI - this will be rendered by Daily.co iframe */}
      {isInCall && (
        <div className="fixed top-4 left-4 z-50 flex gap-2">
          <Button
            onClick={toggleMicrophone}
            variant={isMicOn ? "default" : "secondary"}
            size="sm"
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
          <Button
            onClick={toggleCamera}
            variant={isCameraOn ? "default" : "secondary"}
            size="sm"
          >
            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => dailyManager?.startScreenShare()}
            variant="outline"
            size="sm"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            onClick={leaveCall}
            variant="destructive"
            size="sm"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}