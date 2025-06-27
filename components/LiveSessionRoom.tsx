// components/LiveSessionRoom.tsx
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
  ChevronLeft,
  Clock,
  DollarSign,
  Users,
  Calendar,
  BookOpen,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_time: string;
  duration: number;
  status: string;
  coach_id: string;
  max_participants: number;
  current_participants: number;
  learning_path: string;
  price: number;
  coach: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  participants: Array<{
    student_id: string;
    student: {
      name: string;
      avatar_url: string | null;
    };
  }>;
}

interface LiveSessionRoomProps {
  sessionId: string;
}

export default function LiveSessionRoom({ sessionId }: LiveSessionRoomProps) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [dailyManager, setDailyManager] = useState<DailyManager | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [hasLeftCall, setHasLeftCall] = useState(false); // ✅ NEW: Track if user left call
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-600';
      case 'intermediate': return 'bg-yellow-600';
      case 'advanced': return 'bg-red-600';
      default: return 'bg-gray-600';
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
        .from('live_sessions')
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

      // Get session enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('session_enrollments')
        .select('student_id, status')
        .eq('session_id', sessionId)
        .eq('status', 'enrolled');

      if (enrollmentsError) throw enrollmentsError;

      // Get student details for enrollments
      const participants = [];
      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id);
        
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', studentIds);

        const { data: studentUserProfiles } = await supabase
          .from('user_profiles')
          .select('prof_id, avatar_url')
          .in('prof_id', studentIds);

        for (const enrollment of enrollments) {
          const studentProfile = studentProfiles?.find(p => p.id === enrollment.student_id);
          const studentUserProfile = studentUserProfiles?.find(p => p.prof_id === enrollment.student_id);
          
          participants.push({
            student_id: enrollment.student_id,
            student: {
              name: studentProfile?.name || 'Student',
              avatar_url: studentUserProfile?.avatar_url || null
            }
          });
        }
      }
      
      const formattedSession: LiveSession = {
        id: sessionData.id,
        title: sessionData.title,
        description: sessionData.description,
        scheduled_time: sessionData.scheduled_time,
        duration: sessionData.duration || 60,
        status: sessionData.status || 'scheduled',
        coach_id: sessionData.coach_id,
        max_participants: sessionData.max_participants || 10,
        current_participants: sessionData.current_participants || 0,
        learning_path: sessionData.learning_path || 'beginner',
        price: sessionData.price || 0,
        coach: {
          id: sessionData.coach_id,
          name: coachProfile?.name || 'Coach',
          avatar_url: coachUserProfile?.avatar_url || null
        },
        participants: participants
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
    setHasLeftCall(false); // ✅ Reset the left call state
    
    try {
      const manager = new DailyManager({
        userName: currentUser.name,
        userAvatar: currentUser.avatar_url
      });

      const { roomUrl, token } = await manager.getOrCreateRoom(sessionId);
      
      await manager.joinRoom(roomUrl, {
        token,
        userName: currentUser.name
      });

      setDailyManager(manager);
      setIsInCall(true);

      // ✅ UPDATED: Set up event listeners
      manager.onCallStateChanged((state) => {
        console.log('Call state changed:', state);
        if (state === 'left') {
          // ✅ CHANGED: Stay on the same page instead of redirecting
          setIsInCall(false);
          setDailyManager(null);
          setHasLeftCall(true); // ✅ NEW: Mark that user left the call
          
          toast({
            title: "Call Ended",
            description: "You can rejoin the live session if it's still active.",
          });
        }
      });

      manager.onParticipantJoined((participant) => {
        toast({
          title: "Participant Joined",
          description: `${participant.user_name || 'Someone'} joined the session`,
        });
      });

      manager.onParticipantLeft((participant) => {
        toast({
          title: "Participant Left",
          description: `${participant.user_name || 'Someone'} left the session`,
        });
      });

      // Update session status
      await supabase
        .from('live_sessions')
        .update({ status: 'active' })
        .eq('id', sessionId);

      toast({
        title: "Joined Session",
        description: `Welcome to ${session.title}!`,
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

  // ✅ NEW: Manual leave function for explicit leave button (if needed)
  const leaveCall = async () => {
    if (dailyManager && sessionId) {
      await dailyManager.leaveRoom();
      // The onCallStateChanged will handle the rest
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

  // If in call, Daily.co UI takes over the entire screen
  if (isInCall) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Daily.co iframe will be rendered here automatically */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800">
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

        <div className="max-w-6xl mx-auto">
          {/* ✅ NEW: Show reconnection message if user left call */}
          {hasLeftCall && sessionStatus.canJoin && (
            <Card className="mb-6 bg-purple-600/20 border-purple-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 text-purple-200">
                  <RefreshCw className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Call Disconnected</p>
                    <p className="text-sm">You left the live session but can rejoin if it's still active.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Header */}
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-gray-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600 rounded-full">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-2xl">{session.title}</CardTitle>
                    <p className="text-gray-300 mt-1">Live group coaching session</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    className={`${getLevelColor(session.learning_path)} text-white capitalize`}
                  >
                    {session.learning_path}
                  </Badge>
                  <Badge variant={sessionStatus.color as any} className="text-sm px-3 py-1">
                    {sessionStatus.message}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Session Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Info */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white leading-relaxed">{session.description}</p>
                  </div>

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
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Users className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Participants</p>
                        <p className="text-white font-medium">
                          {session.participants.length} / {session.max_participants}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <BookOpen className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-400">Level</p>
                        <p className="text-white font-medium capitalize">{session.learning_path}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Scheduled Time</p>
                    </div>
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
                </CardContent>
              </Card>

              {/* Join Session */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    {sessionStatus.canJoin ? (
                      <Button
                        onClick={joinVideoCall}
                        disabled={joining}
                        className={`w-full text-white py-6 text-lg font-semibold ${
                          hasLeftCall 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
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
                              ? 'Rejoin Live Session' 
                              : userRole === 'coach' 
                                ? 'Start Live Session' 
                                : 'Join Live Session'
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
                        ? 'Click above to rejoin the live session if it\'s still active.'
                        : 'This session will open in full-screen mode with Daily.co\'s professional interface. All participants will join the same room automatically.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Host & Participants */}
            <div className="space-y-6">
              {/* Host */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Session Host</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <Avatar className="h-14 w-14 border-2 border-purple-400">
                      <AvatarImage src={session.coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach.id}`} />
                      <AvatarFallback className="bg-purple-600 text-white text-lg">
                        {session.coach.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{session.coach.name}</p>
                        {userRole === 'coach' && currentUser?.id === session.coach_id && (
                          <Badge variant="default" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">Coach & Session Host</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Participants ({session.participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {session.participants.length > 0 ? (
                      session.participants.map((participant, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                          <Avatar className="h-10 w-10 border border-blue-400">
                            <AvatarImage src={participant.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.student_id}`} />
                            <AvatarFallback className="bg-blue-600 text-white text-sm">
                              {participant.student.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-white text-sm">{participant.student.name}</p>
                              {currentUser?.id === participant.student_id && (
                                <Badge variant="default" className="text-xs">You</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">Student</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No participants enrolled yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Session Guidelines */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Live Session Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Join a few minutes early to test your setup</li>
                    <li>• Mute yourself when not speaking</li>
                    <li>• Use the chat for questions during the session</li>
                    <li>• Respect other participants' time</li>
                    <li>• Take notes during the session</li>
                    <li>• Use good lighting for better video quality</li>
                    <li>• You can rejoin if disconnected</li>
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