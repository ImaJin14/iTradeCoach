"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, Clock, Trophy, BookOpen, Star,
  Activity, Target, Settings, Users, Video
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StudentData {
  name: string;
  avatarUrl: string | null;
  currentLevel: string;
  subscriptionStatus: string | null;
  stats: {
    sessionsCompleted: number;
    tokensEarned: number;
    coursesCompleted: number;
  };
  upcomingSessions: Array<{
    id: string;
    date: string;
    time: string;
    coachName: string;
    coachAvatar: string | null;
    topic: string;
    type: 'individual' | 'live_session';
    scheduledTime: string;
    duration: number;
    maxParticipants?: number;
    currentParticipants?: number;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Utility function to check if session can be joined
  const getSessionStatus = (scheduledTime: string, duration: number) => {
    const now = new Date();
    const sessionStart = new Date(scheduledTime);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
    const joinWindow = new Date(sessionStart.getTime() - 10 * 60000); // 10 minutes early

    if (now < joinWindow) {
      return {
        status: 'upcoming',
        canJoin: false,
        timeUntil: sessionStart.getTime() - now.getTime(),
        message: 'Session not yet available'
      };
    } else if (now >= joinWindow && now < sessionEnd) {
      return {
        status: 'active',
        canJoin: true,
        timeUntil: 0,
        message: now < sessionStart ? 'Ready to join' : 'Session in progress'
      };
    } else {
      return {
        status: 'ended',
        canJoin: false,
        timeUntil: 0,
        message: 'Session ended'
      };
    }
  };

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Not authenticated');

        // Get basic profile info including subscription status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get user profile for avatar
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('prof_id', user.id)
          .maybeSingle();

        // Get student-specific data
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('tokens_earned, current_level, courses_completed')
          .eq('student_id', user.id)
          .maybeSingle();

        // Fetch individual sessions
        const { data: individualSessions, error: individualError } = await supabase
          .from('sessions')
          .select('id, scheduled_time, coach_id, notes, status, duration')
          .eq('student_id', user.id)
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString())
          .order('scheduled_time', { ascending: true })
          .limit(10);

        if (individualError) {
          console.error('Error fetching individual sessions:', individualError);
        }

        // Fetch live sessions via enrollments
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('session_enrollments')
          .select('session_id, status')
          .eq('student_id', user.id)
          .eq('status', 'enrolled');

        if (enrollmentError) {
          console.error('Error fetching enrollments:', enrollmentError);
        }

        let liveSessions: any[] = [];
        if (enrollments && enrollments.length > 0) {
          const sessionIds = enrollments.map(e => e.session_id);
          
          const { data: liveSessionsData, error: liveSessionsError } = await supabase
            .from('live_sessions')
            .select('id, title, scheduled_time, duration, coach_id, status, max_participants, current_participants')
            .in('id', sessionIds)
            .gte('scheduled_time', new Date().toISOString())
            .order('scheduled_time', { ascending: true })
            .limit(10);

          if (liveSessionsError) {
            console.error('Error fetching live sessions:', liveSessionsError);
          } else {
            liveSessions = liveSessionsData || [];
          }
        }

        // Combine and format all sessions
        let formattedSessions: StudentData['upcomingSessions'] = [];

        if ((individualSessions && individualSessions.length > 0) || liveSessions.length > 0) {
          // Get unique coach IDs
          const coachIds = [
            ...(individualSessions?.map(s => s.coach_id) || []),
            ...liveSessions.map(s => s.coach_id)
          ];
          const uniqueCoachIds = [...new Set(coachIds)];
          
          // Get coach profiles
          const { data: coachProfiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', uniqueCoachIds);

          // Get coach avatars
          const { data: coachUserProfiles } = await supabase
            .from('user_profiles')
            .select('prof_id, avatar_url')
            .in('prof_id', uniqueCoachIds);

          const coachNameMap = new Map(coachProfiles?.map(p => [p.id, p.name]) || []);
          const coachAvatarMap = new Map(coachUserProfiles?.map(p => [p.prof_id, p.avatar_url]) || []);

          // Format individual sessions
          const formattedIndividualSessions = (individualSessions || []).map(session => ({
            id: session.id,
            date: new Date(session.scheduled_time).toLocaleDateString(),
            time: new Date(session.scheduled_time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            coachName: coachNameMap.get(session.coach_id) || 'Coach',
            coachAvatar: coachAvatarMap.get(session.coach_id) || null,
            topic: session.notes || '1-on-1 Coaching Session',
            type: 'individual' as const,
            scheduledTime: session.scheduled_time,
            duration: session.duration || 60
          }));

          // Format live sessions
          const formattedLiveSessions = liveSessions.map(session => ({
            id: session.id,
            date: new Date(session.scheduled_time).toLocaleDateString(),
            time: new Date(session.scheduled_time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            coachName: coachNameMap.get(session.coach_id) || 'Coach',
            coachAvatar: coachAvatarMap.get(session.coach_id) || null,
            topic: session.title,
            type: 'live_session' as const,
            scheduledTime: session.scheduled_time,
            duration: session.duration || 60,
            maxParticipants: session.max_participants,
            currentParticipants: session.current_participants
          }));

          // Combine and sort by scheduled time
          formattedSessions = [...formattedIndividualSessions, ...formattedLiveSessions]
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
            .slice(0, 5); // Keep only next 5 sessions
        }

        // Count completed sessions
        const { count: completedSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed');

        setData({
          name: profile.name || 'Student',
          avatarUrl: userProfile?.avatar_url || null,
          currentLevel: studentProfile?.current_level || 'beginner',
          subscriptionStatus: profile.subscription_status,
          stats: {
            sessionsCompleted: completedSessions || 0,
            tokensEarned: studentProfile?.tokens_earned || 0,
            coursesCompleted: (studentProfile?.courses_completed || []).length
          },
          upcomingSessions: formattedSessions
        });
      } catch (error: any) {
        console.error("Error fetching student data:", error);
        toast({
          title: "Error",
          description: "Failed to load your dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [toast]);

  // Join session handler
  const handleJoinSession = async (session: StudentData['upcomingSessions'][0]) => {
    const sessionStatus = getSessionStatus(session.scheduledTime, session.duration);
    
    if (!sessionStatus.canJoin) {
      toast({
        title: "Session Not Available",
        description: sessionStatus.message,
        variant: "destructive",
      });
      return;
    }

    try {
      if (session.type === 'live_session') {
        // Redirect to live session room with Daily.co integration
        window.location.href = `/session/${session.id}/live`;
      } else {
        // Redirect to individual session room
        window.location.href = `/session/${session.id}/room`;
      }
      
      toast({
        title: "Joining Session",
        description: "Redirecting to session room...",
      });
    } catch (error: any) {
      console.error('Error joining session:', error);
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine continue learning destination
  const getContinueLearningHref = () => {
    if (data?.subscriptionStatus === 'active') {
      return '/classroom';
    } else if (data?.stats.tokensEarned && data.stats.tokensEarned > 0) {
      return '/classroom';
    } else {
      return '/learn';
    }
  };

  const getContinueLearningText = () => {
    if (data?.subscriptionStatus === 'active') {
      return 'Go to Classroom';
    } else if (data?.stats.tokensEarned && data.stats.tokensEarned > 0) {
      return 'Continue in Classroom';
    } else {
      return 'Continue Learning';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mb-4">Unable to load your dashboard data.</p>
          <Button asChild>
            <Link href="/profile">Update Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="animate-slideInLeft">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome back, {data.name}!
              </h1>
              <p className="text-muted-foreground mt-1">Continue your trading education journey</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium capitalize">{data.currentLevel} Trader</div>
                <div className="text-xs text-muted-foreground">Current Level</div>
              </div>
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={data.avatarUrl || undefined} alt={data.name} />
                <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{data.stats.sessionsCompleted}</div>
              <p className="text-xs text-muted-foreground">Total sessions completed</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Tokens</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{data.stats.tokensEarned}</div>
              <p className="text-xs text-muted-foreground">Tokens earned from learning</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.stats.coursesCompleted}</div>
              <p className="text-xs text-muted-foreground">Courses finished</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              {data.upcomingSessions[0] ? (
                <>
                  <div className="text-2xl font-bold text-indigo-600">{data.upcomingSessions[0].time}</div>
                  <p className="text-xs text-muted-foreground">{data.upcomingSessions[0].date}</p>
                </>
              ) : (
                <>
                  <div className="text-lg font-medium">No sessions scheduled</div>
                  <Button asChild variant="link" className="px-0 hover:scale-105 transition-transform duration-200">
                    <Link href="/coaches">Find a Coach</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Upcoming Sessions
                <Activity className="h-4 w-4 text-primary animate-pulse" />
              </CardTitle>
              <CardDescription>Your scheduled coaching sessions and live sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {data.upcomingSessions.map((session) => {
                    const sessionStatus = getSessionStatus(session.scheduledTime, session.duration);
                    
                    return (
                      <div 
                        key={session.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                            <AvatarImage 
                              src={session.coachAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`} 
                              alt={session.coachName} 
                            />
                            <AvatarFallback>{session.coachName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {session.coachName}
                              {session.type === 'live_session' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Video className="h-3 w-3" />
                                  Live Session
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{session.topic}</div>
                            {session.type === 'live_session' && (
                              <div className="text-xs text-muted-foreground">
                                {session.currentParticipants}/{session.maxParticipants} participants
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{session.date}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">{session.time}</span>
                          </div>
                          
                          {/* Join Session Button */}
                          {sessionStatus.canJoin ? (
                            <Button
                              onClick={() => handleJoinSession(session)}
                              className="gap-2 bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <Video className="h-4 w-4" />
                              {sessionStatus.status === 'active' && new Date() >= new Date(session.scheduledTime) 
                                ? 'Join Now' 
                                : 'Enter Room'
                              }
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {sessionStatus.message}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No upcoming sessions</p>
                  <p className="text-xs mb-4">Book a session with a coach to continue learning</p>
                  <Button asChild variant="outline" className="hover:scale-105 transition-transform duration-200">
                    <Link href="/coaches">Find a Coach</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Quick Actions
                <Target className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Common tasks and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button asChild className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/coaches">
                    <BookOpen className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Find a Coach
                  </Link>
                </Button>
                
                {/* ✅ UPDATED: Removed Premium text */}
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href={getContinueLearningHref()}>
                    <Trophy className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    {getContinueLearningText()}
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/sessions">
                    <CalendarDays className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    View All Sessions
                    {data.upcomingSessions.some(s => s.type === 'live_session') && (
                      <Badge variant="secondary" className="ml-2 text-xs gap-1">
                        <Video className="h-3 w-3" />
                        Live
                      </Badge>
                    )}
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/profile">
                    <Settings className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Update Profile
                  </Link>
                </Button>

                {/* ✅ UPDATED: Conditional Premium Upgrade Button */}
                {data.subscriptionStatus !== 'active' && (
                  <div className="pt-2 border-t">
                    <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 group hover:scale-105 transition-all duration-200">
                      <Link href="/pricing">
                        <Star className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                        Upgrade to Premium
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Get unlimited access to courses and live sessions
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}