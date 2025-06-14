"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CalendarDays, Clock, Star, BookOpen, Trophy, ArrowUpRight, Shield,
  Menu, X, TrendingUp, BarChart3, DollarSign, AlertTriangle,
  Wallet, PieChart, Activity, Bell, Eye, EyeOff, ChevronRight,
  LineChart, Target, Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

// Trading Sidebar Component
const TradingSidebar = ({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
  const tradingMenuItems = [
    {
      icon: PieChart,
      label: "Portfolio",
      subLabel: "$12,450.32",
      color: "text-green-500",
      href: "/trading/portfolio"
    },
    {
      icon: TrendingUp,
      label: "Watchlist",
      subLabel: "8 assets",
      color: "text-blue-500",
      href: "/trading/watchlist"
    },
    {
      icon: BarChart3,
      label: "Market Data",
      subLabel: "Live prices",
      color: "text-purple-500",
      href: "/trading/market"
    },
    {
      icon: Activity,
      label: "Trading History",
      subLabel: "12 trades today",
      color: "text-orange-500",
      href: "/trading/history"
    },
    {
      icon: Target,
      label: "Analytics",
      subLabel: "+15.2% this week",
      color: "text-green-500",
      href: "/trading/analytics"
    },
    {
      icon: AlertTriangle,
      label: "Risk Management",
      subLabel: "Low risk",
      color: "text-yellow-500",
      href: "/trading/risk"
    },
    {
      icon: Bell,
      label: "Alerts",
      subLabel: "3 active",
      color: "text-red-500",
      href: "/trading/alerts"
    },
    {
      icon: Settings,
      label: "Trading Settings",
      subLabel: "Configure",
      color: "text-gray-500",
      href: "/trading/settings"
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-background/95 backdrop-blur-md border-r shadow-lg z-50 transition-all duration-300 ease-in-out",
        isOpen ? "w-80" : "w-0 lg:w-16",
        "overflow-hidden"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex items-center gap-3 transition-opacity duration-300",
                isOpen ? "opacity-100" : "opacity-0 lg:opacity-100"
              )}>
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                {isOpen && <span className="font-semibold text-lg">Trading Hub</span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {tradingMenuItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent/50",
                    "transform hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200",
                    item.color
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  
                  {(isOpen) && (
                    <div className="flex-1 min-w-0 animate-fadeIn">
                      <div className="font-medium text-sm truncate">{item.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.subLabel}</div>
                    </div>
                  )}
                  
                  {(isOpen) && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className={cn(
              "flex items-center gap-3 transition-opacity duration-300",
              isOpen ? "opacity-100" : "opacity-0 lg:opacity-100"
            )}>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="flex-1 animate-fadeIn">
                  <div className="text-sm font-medium">Total P&L</div>
                  <div className="text-xs text-green-500 font-semibold">+$2,450.32</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fadeIn">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mb-4">Unable to load your dashboard data.</p>
          <Button onClick={() => window.location.reload()} className="animate-pulse">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Trading Sidebar */}
      <TradingSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        sidebarOpen ? "lg:ml-80" : "lg:ml-16"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hover:bg-accent/50 transition-all duration-200 hover:scale-105"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <div className="animate-slideInLeft">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Welcome back, {data.name}!
                  </h1>
                  {data.role === 'admin' && (
                    <div className="flex items-center gap-2 mt-2 animate-slideInLeft" style={{ animationDelay: "100ms" }}>
                      <Badge variant="secondary" className="gap-1 animate-pulse">
                        <Shield className="h-3 w-3" />
                        Admin User
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* <div className="flex items-center gap-3 animate-slideInRight">
                <Avatar className="ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                  <AvatarImage src={data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`} />
                  <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div> */}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container py-8">
          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {data.role === 'admin' ? 'Total Sessions' : 'Completed Sessions'}
                </CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary animate-countUp">{data.stats.sessionsCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {data.role === 'admin' ? 'Platform-wide completed' : 'Total sessions completed'}
                </p>
              </CardContent>
            </Card>

            {data.role === 'student' ? (
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-yellow-500" style={{ animationDelay: "100ms" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Knowledge Tokens</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors duration-200" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600 animate-countUp">{data.stats.tokensEarned}</div>
                  <p className="text-xs text-muted-foreground">
                    Tokens earned from learning
                  </p>
                </CardContent>
              </Card>
            ) : data.role === 'coach' ? (
              <>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-green-500" style={{ animationDelay: "100ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors duration-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 animate-countUp">${data.stats.totalEarnings}</div>
                    <p className="text-xs text-muted-foreground">
                      Lifetime earnings
                    </p>
                  </CardContent>
                </Card>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-orange-500" style={{ animationDelay: "200ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors duration-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 animate-countUp">{data.stats.rating}</div>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-4 w-4 transition-all duration-200",
                            i < (data.stats.rating || 0) 
                              ? 'fill-yellow-400 text-yellow-400 animate-pulse' 
                              : 'text-muted'
                          )}
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // Admin stats
              <>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-blue-500" style={{ animationDelay: "100ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Access</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">Admin</div>
                    <p className="text-xs text-muted-foreground">
                      Full platform access
                    </p>
                  </CardContent>
                </Card>
                <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-purple-500" style={{ animationDelay: "200ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Management</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-500 transition-colors duration-200" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">Active</div>
                    <p className="text-xs text-muted-foreground">
                      System status
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideInUp border-l-4 border-l-indigo-500" style={{ animationDelay: "300ms" }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {data.role === 'admin' ? 'Next Scheduled' : 'Next Session'}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 transition-colors duration-200" />
              </CardHeader>
              <CardContent>
                {data.upcomingSessions[0] ? (
                  <>
                    <div className="text-2xl font-bold text-indigo-600">{data.upcomingSessions[0].time}</div>
                    <p className="text-xs text-muted-foreground">
                      {data.upcomingSessions[0].date}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-medium">No sessions scheduled</div>
                    <Button asChild variant="link" className="px-0 hover:scale-105 transition-transform duration-200">
                      <Link href={data.role === 'student' ? "/coaches" : data.role === 'admin' ? "/admin/sessions" : "/availability"}>
                        {data.role === 'student' ? "Find a Coach" : data.role === 'admin' ? "Manage Sessions" : "Set Availability"}
                      </Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="group hover:shadow-lg transition-all duration-300 animate-slideInUp" style={{ animationDelay: "400ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {data.role === 'admin' ? 'Scheduled Sessions (Monitor)' : 'Upcoming Sessions'}
                  <Activity className="h-4 w-4 text-primary animate-pulse" />
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
                    {data.upcomingSessions.map((session, index) => (
                      <div 
                        key={session.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:scale-[1.02] animate-slideInLeft"
                        style={{ animationDelay: `${500 + index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
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
                              <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'} className="text-xs mt-1 animate-pulse">
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
                  <div className="text-center py-6 text-muted-foreground animate-fadeIn">
                    <p>No upcoming sessions</p>
                    <Button asChild variant="outline" className="mt-2 hover:scale-105 transition-transform duration-200">
                      <Link href={data.role === 'student' ? "/coaches" : data.role === 'admin' ? "/admin/sessions" : "/availability"}>
                        {data.role === 'student' ? "Find a Coach" : data.role === 'admin' ? "Manage Sessions" : "Set Availability"}
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 animate-slideInUp" style={{ animationDelay: "500ms" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Quick Actions
                  <Target className="h-4 w-4 text-primary" />
                </CardTitle>
                <CardDescription>
                  Common tasks and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.role === 'student' ? (
                    <>
                      <Button asChild className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "600ms" }}>
                        <Link href="/coaches">
                          <BookOpen className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          Find a Coach
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "700ms" }}>
                        <Link href="/learn">
                          <Trophy className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          Continue Learning
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "800ms" }}>
                        <Link href="/rewards">
                          <Star className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          View Rewards
                        </Link>
                      </Button>
                    </>
                  ) : data.role === 'coach' ? (
                    <>
                      <Button asChild className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "600ms" }}>
                        <Link href="/availability">
                          <Clock className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          Manage Availability
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "700ms" }}>
                        <Link href="/sessions">
                          <CalendarDays className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          View All Sessions
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "800ms" }}>
                        <Link href="/profile">
                          <Settings className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          Update Profile
                        </Link>
                      </Button>
                    </>
                  ) : (
                    // Admin actions
                    <>
                      <Button asChild className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "600ms" }}>
                        <Link href="/admin">
                          <Shield className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          Admin Dashboard
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full group hover:scale-105 transition-all duration-200 animate-slideInRight" style={{ animationDelay: "700ms" }}>
                        <Link href="/admin/coaches">
                          <Activity className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                          Manage Coaches
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}