"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Clock, Star, BookOpen, Trophy, ArrowUpRight, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  role: 'student' | 'coach' | 'admin';
  name: string;
  avatarUrl: string | null;
  stats: {
    sessionsCompleted: number;
    tokensEarned?: number;
    totalEarnings?: number;
    rating?: number;
    totalStudents?: number;
  };
  upcomingSessions: Array<{
    id: string;
    date: string;
    time: string;
    otherPartyName: string;
    otherPartyAvatar: string | null;
    topic: string;
    status?: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Not authenticated');
        }
    
        // Get user profile with role from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`*`)
          .eq('id', user.id)
          .single();
    
        if (profileError) throw profileError;
    
        // Get user_profile data for avatar
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('prof_id', user.id)
          .single();
    
        // Get upcoming sessions with proper joins following your schema
        let sessionsQuery = supabase
          .from('sessions')
          .select(`
            *,
            student_profiles!sessions_student_id_fkey (
              student_id,
              user_profiles!student_profiles_student_id_fkey (
                avatar_url,
                prof_id
              )
            ),
            coach_profiles!sessions_coach_id_fkey (
              coach_id,
              user_profiles!coach_profiles_coach_id_fkey (
                avatar_url,
                prof_id
              )
            )
          `)
          .eq('status', 'scheduled')
          .order('scheduled_time', { ascending: true });
    
        // Apply role-based filtering and limits
        if (profile.role === 'admin') {
          sessionsQuery = sessionsQuery.limit(5);
        } else {
          sessionsQuery = sessionsQuery
            .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`)
            .limit(3);
        }
    
        const { data: sessions, error: sessionsError } = await sessionsQuery;
        if (sessionsError) throw sessionsError;
    
        // We need to get the names separately since they're in the profiles table
        const sessionIds = sessions?.map(s => [s.coach_id, s.student_id]).flat() || [];
        const uniqueIds = sessionIds.filter((id, index, arr) => arr.indexOf(id) === index);
        
        const { data: sessionProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueIds);
    
        // Create a lookup map for names
        const nameMap = new Map(sessionProfiles?.map(p => [p.id, p.name]) || []);
    
        // Get role-specific data
        let roleSpecificData = {};
        if (profile.role === 'student') {
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('student_id', user.id)
            .maybeSingle();
    
          roleSpecificData = {
            tokensEarned: studentProfile?.tokens_earned || 0
          };
        } else if (profile.role === 'coach') {
          const { data: coachProfile } = await supabase
            .from('coach_profiles')
            .select('*')
            .eq('coach_id', user.id)
            .maybeSingle();
    
          roleSpecificData = {
            rating: coachProfile?.rating || 0,
            totalStudents: coachProfile?.total_students || 0,
            totalEarnings: coachProfile?.earnings || 0
          };
        }
    
        // Format sessions data
        const formattedSessions = sessions?.map(session => {
          if (profile.role === 'admin') {
            // Admin sees coach-student pairs
            const coachName = nameMap.get(session.coach_id) || 'Coach';
            const studentName = nameMap.get(session.student_id) || 'Student';
            
            return {
              id: session.id,
              date: new Date(session.scheduled_time).toLocaleDateString(),
              time: new Date(session.scheduled_time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              otherPartyName: `${coachName} → ${studentName}`,
              otherPartyAvatar: session.coach_profiles?.user_profiles?.avatar_url || null,
              topic: session.notes || 'Coaching Session',
              status: session.status || 'scheduled'
            };
          } else {
            // Regular users see their counterpart
            const isCoach = session.coach_id === user.id;
            const otherPartyId = isCoach ? session.student_id : session.coach_id;
            const otherPartyName = nameMap.get(otherPartyId) || 'Unknown';
            
            // Get avatar from the appropriate profile
            const otherPartyAvatar = isCoach 
              ? session.student_profiles?.user_profiles?.avatar_url 
              : session.coach_profiles?.user_profiles?.avatar_url;
            
            return {
              id: session.id,
              date: new Date(session.scheduled_time).toLocaleDateString(),
              time: new Date(session.scheduled_time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              otherPartyName,
              otherPartyAvatar: otherPartyAvatar || null,
              topic: session.notes || 'Coaching Session',
              status: session.status || 'scheduled'
            };
          }
        }) || [];
    
        // Count completed sessions
        let completedSessionsQuery = supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
    
        if (profile.role !== 'admin') {
          completedSessionsQuery = completedSessionsQuery
            .or(`coach_id.eq.${user.id},student_id.eq.${user.id}`);
        }
    
        const { count: completedSessions } = await completedSessionsQuery;
    
        setData({
          role: (profile.role as 'student' | 'coach' | 'admin') || 'student',
          name: profile.name || 'User',
          avatarUrl: userProfile?.avatar_url || null,
          stats: {
            sessionsCompleted: completedSessions || 0,
            ...roleSpecificData
          },
          upcomingSessions: formattedSessions
        });
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mb-4">Unable to load your dashboard data.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {data.name}!</h1>
          {data.role === 'admin' && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin User
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {data.role === 'admin' ? 'Total Sessions' : 'Completed Sessions'}
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.sessionsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {data.role === 'admin' ? 'Platform-wide completed' : 'Total sessions completed'}
            </p>
          </CardContent>
        </Card>

        {data.role === 'student' ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Tokens</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.tokensEarned}</div>
              <p className="text-xs text-muted-foreground">
                Tokens earned from learning
              </p>
            </CardContent>
          </Card>
        ) : data.role === 'coach' ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data.stats.totalEarnings}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.rating}</div>
                <div className="flex mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${
                        i < (data.stats.rating || 0) 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted'
                      }`} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          // Admin stats
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Access</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Admin</div>
                <p className="text-xs text-muted-foreground">
                  Full platform access
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Management</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">
                  System status
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {data.role === 'admin' ? 'Next Scheduled' : 'Next Session'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.upcomingSessions[0] ? (
              <>
                <div className="text-2xl font-bold">{data.upcomingSessions[0].time}</div>
                <p className="text-xs text-muted-foreground">
                  {data.upcomingSessions[0].date}
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-medium">No sessions scheduled</div>
                <Button asChild variant="link" className="px-0">
                  <Link href={data.role === 'student' ? "/coaches" : data.role === 'admin' ? "/admin/sessions" : "/availability"}>
                    {data.role === 'student' ? "Find a Coach" : data.role === 'admin' ? "Manage Sessions" : "Set Availability"}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {data.role === 'admin' ? 'Scheduled Sessions (Monitor)' : 'Upcoming Sessions'}
            </CardTitle>
            <CardDescription>
              {data.role === 'admin' 
                ? 'Monitor scheduled coaching sessions and their status'
                : 'Your scheduled coaching sessions'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {data.upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage 
                          src={session.otherPartyAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.id}`} 
                          alt={session.otherPartyName} 
                        />
                        <AvatarFallback>{session.otherPartyName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{session.otherPartyName}</div>
                        <div className="text-sm text-muted-foreground">{session.topic}</div>
                        {data.role === 'admin' && session.status && (
                          <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {session.status}
                          </Badge>
                        )}
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
                <Button asChild variant="outline" className="mt-2">
                  <Link href={data.role === 'student' ? "/coaches" : data.role === 'admin' ? "/admin/sessions" : "/availability"}>
                    {data.role === 'student' ? "Find a Coach" : data.role === 'admin' ? "Manage Sessions" : "Set Availability"}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.role === 'student' ? (
                <>
                  <Button asChild className="w-full">
                    <Link href="/coaches">Find a Coach</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/learn">Continue Learning</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/rewards">View Rewards</Link>
                  </Button>
                </>
              ) : data.role === 'coach' ? (
                <>
                  <Button asChild className="w-full">
                    <Link href="/availability">Manage Availability</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/sessions">View All Sessions</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/profile">Update Profile</Link>
                  </Button>
                </>
              ) : (
                // Admin actions
                <>
                  <Button asChild className="w-full">
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/coaches">Manage Coaches</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}