"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CalendarDays, Clock, Trophy, BookOpen, Star,
  Activity, Target
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface StudentData {
  name: string;
  avatarUrl: string | null;
  stats: {
    sessionsCompleted: number;
    tokensEarned: number;
  };
  upcomingSessions: Array<{
    id: string;
    date: string;
    time: string;
    coachName: string;
    coachAvatar: string | null;
    topic: string;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Not authenticated');

        // Get basic profile info
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get user profile for avatar
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('prof_id', user.id)
          .single();

        // Get student-specific data
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('tokens_earned')
          .eq('student_id', user.id)
          .maybeSingle();

        // Get upcoming sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            *,
            coach_profiles!sessions_coach_id_fkey (
              coach_id,
              user_profiles!coach_profiles_coach_id_fkey (
                avatar_url
              )
            )
          `)
          .eq('student_id', user.id)
          .eq('status', 'scheduled')
          .order('scheduled_time', { ascending: true })
          .limit(3);

        if (sessionsError) throw sessionsError;

        // Get coach names
        const coachIds = sessions?.map(s => s.coach_id) || [];
        const { data: coachProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', coachIds);

        const coachNameMap = new Map(coachProfiles?.map(p => [p.id, p.name]) || []);

        // Format sessions
        const formattedSessions = sessions?.map(session => ({
          id: session.id,
          date: new Date(session.scheduled_time).toLocaleDateString(),
          time: new Date(session.scheduled_time).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          coachName: coachNameMap.get(session.coach_id) || 'Coach',
          coachAvatar: session.coach_profiles?.user_profiles?.avatar_url || null,
          topic: session.notes || 'Coaching Session'
        })) || [];

        // Count completed sessions
        const { count: completedSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed');

        setData({
          name: profile.name || 'Student',
          avatarUrl: userProfile?.avatar_url || null,
          stats: {
            sessionsCompleted: completedSessions || 0,
            tokensEarned: studentProfile?.tokens_earned || 0
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
          <p className="text-muted-foreground">Unable to load your dashboard data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b">
        <div className="container py-4">
          <div className="animate-slideInLeft">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome back, {data.name}!
            </h1>
            <p className="text-muted-foreground mt-1">Continue your trading education journey</p>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container py-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
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
              <CardDescription>Your scheduled coaching sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {data.upcomingSessions.map((session) => (
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
                          <div className="font-medium">{session.coachName}</div>
                          <div className="text-sm text-muted-foreground">{session.topic}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-1">
                          <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm">{session.date}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm">{session.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No upcoming sessions</p>
                  <Button asChild variant="outline" className="mt-2 hover:scale-105 transition-transform duration-200">
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
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/learn">
                    <Trophy className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Continue Learning
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/rewards">
                    <Star className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    View Rewards
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}