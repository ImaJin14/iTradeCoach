// components/IndividualSessionRoom.tsx
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
import { CallWindow } from "./CallWindow";
import { 
  Video, 
  ChevronLeft,
  Clock,
  DollarSign,
  User,
  RefreshCw
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
  const [isInCall, setIsInCall] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [hasLeftCall, setHasLeftCall] = useState(false);
  const [roomUrl, setRoomUrl] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  // Check if session can be joined
  const getSessionStatus = (scheduledTime: string, duration: number) => {
    const now = new Date();
    const sessionStart = new Date(scheduledTime);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
    const joinWindow = new Date(sessionStart.getTime() - 10 * 60000);

    if (now < joinWindow) {
      return { canJoin: false, message: 'Session not yet available', color: 'secondary' };
    } else if (now >= joinWindow && now < sessionEnd) {
      return { canJoin: true, message: 'Session is live', color: 'default' };
    } else {
      return { canJoin: false, message: 'Session has ended', color: 'destructive' };
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
        .select('name, role')
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
      setUserRole(profile?.role || '');
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchSessionDetails = async () => {
    if (!sessionId) return;

    try {
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
    setHasLeftCall(false);
    
    try {
      const manager = new DailyManager({
        userName: currentUser.name,
        userAvatar: currentUser.avatar_url
      });

      const { roomUrl: dailyRoomUrl, token } = await manager.getOrCreateRoom(sessionId);
      
      // Create room URL with token
      const fullRoomUrl = token ? `${dailyRoomUrl}?t=${token}` : dailyRoomUrl;
      setRoomUrl(fullRoomUrl);
      setIsInCall(true);

      // Update session status
      await supabase
        .from('sessions')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

      toast({
        title: "Joined Session",
        description: "Welcome to your 1-on-1 session!",
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

  const handleCallEnd = async () => {
    setIsInCall(false);
    setHasLeftCall(true);
    setRoomUrl('');
    
    // Update session status
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);

    toast({
      title: "Session Ended",
      description: "Your 1-on-1 session has ended. You can rejoin if it's still active.",
    });
  };

  const handleCallClose = () => {
    setIsInCall(false);
    setHasLeftCall(true);
    setRoomUrl('');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Call Window Component */}
      {isInCall && roomUrl && (
        <CallWindow
          roomUrl={roomUrl}
          sessionTitle="1-on-1 Coaching Session"
          sessionType="individual"
          participantCount={2}
          onClose={handleCallClose}
          onSessionEnd={handleCallEnd}
        />
      )}

      <div className="container py-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-6 text-white hover:text-gray-300 hover:bg-white/10"
          asChild
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Show reconnection message if user left call */}
          {hasLeftCall && sessionStatus.canJoin && (
            <Card className="mb-6 bg-blue-600/20 border-blue-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 text-blue-200">
                  <RefreshCw className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Call Disconnected</p>
                    <p className="text-sm">You left the session but can rejoin if it's still active.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Header */}
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 rounded-full">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-2xl">1-on-1 Coaching Session</CardTitle>
                    <p className="text-gray-300 mt-1">Private session between coach and student</p>
                  </div>
                </div>
                <Badge variant={sessionStatus.color as any} className="text-sm px-3 py-1">
                  {sessionStatus.message}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Session Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Info */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Session Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="text-white font-medium">{session.duration} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Price</p>
                        <p className="text-white font-medium">${session.price}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Scheduled Time</p>
                    <p className="text-white font-medium">
                      {new Date(session.scheduled_time).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(session.scheduled_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {session.notes && (
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Session Notes</p>
                      <p className="text-white">{session.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Join Session - Only show if not in call */}
              {!isInCall && (
                <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      {sessionStatus.canJoin ? (
                        <Button
                          onClick={joinVideoCall}
                          disabled={joining}
                          className={`w-full text-white py-6 text-lg font-semibold ${
                            hasLeftCall 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          size="lg"
                        >
                          {joining ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              {hasLeftCall ? 'Rejoining Session...' : 'Joining Session...'}
                            </>
                          ) : (
                            <>
                              <Video className="h-5 w-5 mr-3" />
                              {hasLeftCall 
                                ? 'Rejoin Session' 
                                : userRole === 'coach' 
                                  ? 'Start Session' 
                                  : 'Join Session'
                              }
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button disabled className="w-full py-6 text-lg" size="lg">
                          {sessionStatus.message}
                        </Button>
                      )}
                      
                      <p className="text-sm text-gray-400">
                        {hasLeftCall 
                          ? 'Click above to rejoin the session if it\'s still active.'
                          : 'The session will open in a window that you can minimize or move around.'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Participants */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coach */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Avatar className="h-12 w-12 border-2 border-blue-400">
                      <AvatarImage src={session.coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach.id}`} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {session.coach.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{session.coach.name}</p>
                        {userRole === 'coach' && currentUser?.id === session.coach_id && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">Coach</p>
                    </div>
                  </div>
                  
                  {/* Student */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Avatar className="h-12 w-12 border-2 border-green-400">
                      <AvatarImage src={session.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.student.id}`} />
                      <AvatarFallback className="bg-green-600 text-white">
                        {session.student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{session.student.name}</p>
                        {userRole === 'student' && currentUser?.id === session.student_id && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">Student</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Tips */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Session Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Professional video interface with Daily.co</li>
                    <li>• Minimize window to continue browsing</li>
                    <li>• Screen sharing for chart analysis</li>
                    <li>• Full camera and microphone controls</li>
                    <li>• Secure, private 1-on-1 environment</li>
                    <li>• Rejoin if accidentally disconnected</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}