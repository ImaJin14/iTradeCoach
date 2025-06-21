"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, Clock, Shield, ArrowUpRight,
  Activity, Target, Users
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AdminData {
  name: string;
  avatarUrl: string | null;
  stats: {
    totalSessions: number;
    totalUsers: number;
    totalCoaches: number;
    totalStudents: number;
  };
  recentSessions: Array<{
    id: string;
    date: string;
    time: string;
    coachName: string;
    studentName: string;
    status: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAdminData() {
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

        // Get platform statistics
        const [
          { count: totalSessions },
          { count: totalUsers },
          { count: totalCoaches },
          { count: totalStudents }
        ] = await Promise.all([
          supabase.from('sessions').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
        ]);

        // Get recent sessions for monitoring
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .order('scheduled_time', { ascending: true })
          .limit(5);

        if (sessionsError) throw sessionsError;

        // Get user names for sessions
        const userIds = sessions?.flatMap(s => [s.coach_id, s.student_id]) || [];
        const uniqueIds = [...new Set(userIds)];
        
        const { data: sessionProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', uniqueIds);

        const nameMap = new Map(sessionProfiles?.map(p => [p.id, p.name]) || []);

        // Format sessions
        const formattedSessions = sessions?.map(session => ({
          id: session.id,
          date: new Date(session.scheduled_time).toLocaleDateString(),
          time: new Date(session.scheduled_time).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          coachName: nameMap.get(session.coach_id) || 'Coach',
          studentName: nameMap.get(session.student_id) || 'Student',
          status: session.status || 'scheduled'
        })) || [];

        setData({
          name: profile.name || 'Admin',
          avatarUrl: userProfile?.avatar_url || null,
          stats: {
            totalSessions: totalSessions || 0,
            totalUsers: totalUsers || 0,
            totalCoaches: totalCoaches || 0,
            totalStudents: totalStudents || 0
          },
          recentSessions: formattedSessions
        });
      } catch (error: any) {
        console.error("Error fetching admin data:", error);
        toast({
          title: "Error",
          description: "Failed to load admin dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAdminData();
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
          <p className="text-muted-foreground">Unable to load admin dashboard data.</p>
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
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin User
              </Badge>
              <p className="text-muted-foreground">Platform administration and monitoring</p>
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
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{data.stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Platform-wide sessions</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coaches</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.stats.totalCoaches}</div>
              <p className="text-xs text-muted-foreground">Verified coaches</p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{data.stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Learning users</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Sessions Monitor
                <Activity className="h-4 w-4 text-primary animate-pulse" />
              </CardTitle>
              <CardDescription>Monitor recent coaching sessions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{session.coachName} → {session.studentName}</div>
                          <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs mt-1">
                            {session.status}
                          </Badge>
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
                  <p>No recent sessions</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Admin Actions
                <Target className="h-4 w-4 text-primary" />
              </CardTitle>
              <CardDescription>Platform management and administration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button asChild className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Admin Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Manage Users
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/admin/coaches">
                    <Activity className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Manage Coaches
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200">
                  <Link href="/admin/sessions">
                    <CalendarDays className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                    Manage Sessions
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