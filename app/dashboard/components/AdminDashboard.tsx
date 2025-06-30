"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  CalendarDays, Clock, Shield, ArrowUpRight,
  Activity, Target, Users, Eye, UserCheck, UserX,
  MoreVertical, Star, TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/lib/types";

type VerificationStatus = Database['public']['Enums']['verification_status'];
type VerificationAction = Extract<VerificationStatus, 'verified' | 'rejected'>;


interface AdminData {
  name: string;
  avatarUrl: string | null;
  stats: {
    totalSessions: number;
    totalUsers: number;
    totalCoaches: number;
    totalStudents: number;
    pendingVerifications: number;
    pendingCoachVerifications: number;
    pendingStudentVerifications: number;
  };
  recentSessions: Array<{
    id: string;
    date: string;
    time: string;
    coachName: string;
    studentName: string;
    status: string;
  }>;
  pendingCoaches: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    verificationStatus: VerificationStatus;
    hourlyRate: number;
    expertiseAreas: string[];
    createdAt: string;
  }>;
  pendingStudents: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    verificationStatus: VerificationStatus;
    currentLevel: string;
    tokensEarned: number;
    coursesCompleted: number;
    createdAt: string;
  }>;
  allUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
    verificationStatus?: VerificationStatus | null;
    profileComplete: boolean;
    createdAt: string;
  }>;
}

interface UserDetailsModal {
  isOpen: boolean;
  user: any;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDetailsModal, setUserDetailsModal] = useState<UserDetailsModal>({ isOpen: false, user: null });
  const [verifyingUser, setVerifyingUser] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

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
        { count: totalStudents },
        { count: pendingCoachVerifications },
        { count: pendingStudentVerifications }
      ] = await Promise.all([
        supabase.from('sessions').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('coach_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('student_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
      ]);

      const pendingVerifications = (pendingCoachVerifications || 0) + (pendingStudentVerifications || 0);

      // Get recent sessions for monitoring
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (sessionsError) throw sessionsError;

      // Get user names for sessions
      const sessionUserIds = sessions?.flatMap(s => [s.coach_id, s.student_id]) || [];
      const uniqueSessionIds = [...new Set(sessionUserIds)];
      
      const { data: sessionProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', uniqueSessionIds);

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

      // Get pending coaches - query coach_profiles directly
      const { data: pendingCoachProfiles, error: pendingCoachError } = await supabase
        .from('coach_profiles')
        .select('coach_id, verification_status, hourly_rate, expertise_areas, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (pendingCoachError) throw pendingCoachError;

      // Get profile info for pending coaches
      const coachIds = pendingCoachProfiles?.map(c => c.coach_id) || [];
      let pendingCoachesData: AdminData['pendingCoaches'] = [];
      
      if (coachIds.length > 0) {
        const { data: coachProfilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', coachIds);

        const { data: coachUserProfiles } = await supabase
          .from('user_profiles')
          .select('prof_id, avatar_url')
          .in('prof_id', coachIds);

        pendingCoachesData = (pendingCoachProfiles || []).map(coach => {
          const profile = coachProfilesData?.find(p => p.id === coach.coach_id);
          const userProfile = coachUserProfiles?.find(up => up.prof_id === coach.coach_id);
          
          return {
            id: coach.coach_id,
            name: profile?.name || 'Unknown',
            email: profile?.email || '',
            avatarUrl: userProfile?.avatar_url || null,
            verificationStatus: coach.verification_status || 'pending',
            hourlyRate: coach.hourly_rate || 0,
            expertiseAreas: coach.expertise_areas || [],
            createdAt: coach.created_at || ''
          };
        });
      }

      // Get pending students - query student_profiles directly
      const { data: pendingStudentProfiles, error: pendingStudentError } = await supabase
        .from('student_profiles')
        .select('student_id, verification_status, current_level, tokens_earned, courses_completed, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (pendingStudentError) throw pendingStudentError;

      // Get profile info for pending students
      const studentIds = pendingStudentProfiles?.map(s => s.student_id) || [];
      let pendingStudentsData: AdminData['pendingStudents'] = [];
      
      if (studentIds.length > 0) {
        const { data: studentProfilesData } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', studentIds);

        const { data: studentUserProfiles } = await supabase
          .from('user_profiles')
          .select('prof_id, avatar_url')
          .in('prof_id', studentIds);

        pendingStudentsData = (pendingStudentProfiles || []).map(student => {
          const profile = studentProfilesData?.find(p => p.id === student.student_id);
          const userProfile = studentUserProfiles?.find(up => up.prof_id === student.student_id);
          
          return {
            id: student.student_id,
            name: profile?.name || 'Unknown',
            email: profile?.email || '',
            avatarUrl: userProfile?.avatar_url || null,
            verificationStatus: student.verification_status || 'pending',
            currentLevel: student.current_level || 'beginner',
            tokensEarned: student.tokens_earned || 0,
            coursesCompleted: (student.courses_completed || []).length,
            createdAt: student.created_at || ''
          };
        });
      }

      // Get all users for management
      const { data: allProfilesData, error: allProfilesError } = await supabase
        .from('profiles')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (allProfilesError) throw allProfilesError;

      // Get user profiles and coach/student profiles for additional data
      const allUserIds = allProfilesData?.map(p => p.id).filter(Boolean) || [];
      
      const { data: allUserProfiles } = await supabase
        .from('user_profiles')
        .select('prof_id, avatar_url, profile_complete')
        .in('prof_id', allUserIds);

      const { data: allCoachProfiles } = await supabase
        .from('coach_profiles')
        .select('coach_id, verification_status')
        .in('coach_id', allUserIds);

      const { data: allStudentProfiles } = await supabase
        .from('student_profiles')
        .select('student_id, verification_status')
        .in('student_id', allUserIds);

      setData({
        name: profile.name || 'Admin',
        avatarUrl: userProfile?.avatar_url || null,
        stats: {
          totalSessions: totalSessions || 0,
          totalUsers: totalUsers || 0,
          totalCoaches: totalCoaches || 0,
          totalStudents: totalStudents || 0,
          pendingVerifications: pendingVerifications || 0,
          pendingCoachVerifications: pendingCoachVerifications || 0,
          pendingStudentVerifications: pendingStudentVerifications || 0
        },
        recentSessions: formattedSessions,
        pendingCoaches: pendingCoachesData,
        pendingStudents: pendingStudentsData,
        allUsers: (allProfilesData || [])
          .filter(user => user.id) // Filter out null IDs
          .map(user => {
            const userProfile = allUserProfiles?.find(up => up.prof_id === user.id);
            const coachProfile = allCoachProfiles?.find(cp => cp.coach_id === user.id);
            const studentProfile = allStudentProfiles?.find(sp => sp.student_id === user.id);
            
            // Get verification status based on role
            let verificationStatus = null;
            if (user.role === 'coach') {
              verificationStatus = coachProfile?.verification_status || null;
            } else if (user.role === 'student') {
              verificationStatus = studentProfile?.verification_status || null;
            }
            
            return {
              id: user.id,
              name: user.name || 'Unknown',
              email: user.email || '',
              role: user.role || 'student',
              avatarUrl: userProfile?.avatar_url || null,
              verificationStatus,
              profileComplete: userProfile?.profile_complete || false,
              createdAt: user.created_at || ''
            };
          })
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

  async function handleVerifyUser(
  userId: string,
  userRole: string,
  action: VerificationAction
) {
  setVerifyingUser(userId);

  const capitalizedRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  try {
    let error: any = null;

    if (userRole === 'coach') {
      const { error: updateError } = await supabase
        .from('coach_profiles')
        .update({
          verification_status: action,
          updated_at: new Date().toISOString(),
        })
        .eq('coach_id', userId);
      
      error = updateError;
    } else if (userRole === 'student') {
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({
          verification_status: action,
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', userId);
      
      error = updateError;
    } else {
      toast({
        title: 'Info',
        description: 'Only coaches and students require verification.',
        variant: 'default',
      });
      return;
    }

    if (error) throw error;

    toast({
      title: 'Success',
      description: `${capitalizedRole} ${action === 'verified' ? 'verified' : 'rejected'} successfully.`,
    });

    await fetchAdminData();
  } catch (error: any) {
    console.error('Error updating verification status:', error.message || error);
    toast({
      title: 'Error',
      description: `Failed to update ${userRole} verification status.`,
      variant: 'destructive',
    });
  } finally {
    setVerifyingUser(null);
  }
}

  async function viewUserProfile(userId: string) {
    try {
      // Get basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, email, role, subscription_status, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user profile data
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('prof_id', userId)
        .maybeSingle();

      // Get role-specific data
      let roleSpecificData: any = {};
      
      if (profileData.role === 'coach') {
        const { data: coachData } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('coach_id', userId)
          .maybeSingle();
        roleSpecificData = coachData || {};
      } else if (profileData.role === 'student') {
        const { data: studentData } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('student_id', userId)
          .maybeSingle();
        roleSpecificData = studentData || {};
      }

      // Combine all data
      const combinedUserData = {
        ...profileData,
        ...userProfileData,
        ...roleSpecificData
      };

      setUserDetailsModal({ isOpen: true, user: combinedUserData });
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details.",
        variant: "destructive",
      });
    }
  }

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
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
              <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors duration-200" />
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

          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.stats.pendingVerifications}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.pendingCoachVerifications} coaches, {data.stats.pendingStudentVerifications} students
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different admin functions */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending Verifications ({data.stats.pendingVerifications})</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="pending">
            <div className="space-y-6">
              {/* Pending Coaches */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Coach Verifications ({data.stats.pendingCoachVerifications})</CardTitle>
                  <CardDescription>Review and approve coach applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.pendingCoaches.length > 0 ? (
                    <div className="space-y-4">
                      {data.pendingCoaches.map((coach) => (
                        <div key={coach.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={coach.avatarUrl || undefined} />
                              <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{coach.name}</div>
                              <div className="text-sm text-muted-foreground">{coach.email}</div>
                              <div className="text-sm text-muted-foreground">${coach.hourlyRate}/hr</div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">Coach</Badge>
                                {coach.expertiseAreas.slice(0, 3).map((area: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {area}
                                  </Badge>
                                ))}
                                {coach.expertiseAreas.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{coach.expertiseAreas.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewUserProfile(coach.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyUser(coach.id, 'coach', 'verified')}
                              disabled={verifyingUser === coach.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyUser(coach.id, 'coach', 'rejected')}
                              disabled={verifyingUser === coach.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending coach verifications</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Students */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Student Verifications ({data.stats.pendingStudentVerifications})</CardTitle>
                  <CardDescription>Review and approve student applications</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.pendingStudents.length > 0 ? (
                    <div className="space-y-4">
                      {data.pendingStudents.map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={student.avatarUrl || undefined} />
                              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs">Student</Badge>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {student.currentLevel}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {student.tokensEarned} tokens
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {student.coursesCompleted} courses
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewUserProfile(student.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyUser(student.id, 'student', 'verified')}
                              disabled={verifyingUser === student.id}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerifyUser(student.id, 'student', 'rejected')}
                              disabled={verifyingUser === student.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No pending student verifications</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={user.role === 'admin' ? 'default' : user.role === 'coach' ? 'secondary' : 'outline'}>
                              {user.role}
                            </Badge>
                            {user.verificationStatus && (
                              <Badge variant={user.verificationStatus === 'verified' ? 'default' : user.verificationStatus === 'pending' ? 'secondary' : 'destructive'}>
                                {user.verificationStatus}
                              </Badge>
                            )}
                            <Badge variant={user.profileComplete ? 'default' : 'outline'}>
                              {user.profileComplete ? 'Complete' : 'Incomplete'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewUserProfile(user.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            
                            {/* Show verification options for users with pending status */}
                            {user.verificationStatus === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleVerifyUser(user.id, user.role, 'verified')}
                                  className="text-green-600"
                                  disabled={verifyingUser === user.id}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Verify {user.role}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleVerifyUser(user.id, user.role, 'rejected')}
                                  className="text-red-600"
                                  disabled={verifyingUser === user.id}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Reject {user.role}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Modal */}
      <Dialog open={userDetailsModal.isOpen} onOpenChange={(open) => setUserDetailsModal({ isOpen: open, user: null })}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>
              Complete profile information for {userDetailsModal.user?.name}
            </DialogDescription>
          </DialogHeader>
          
          {userDetailsModal.user && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userDetailsModal.user.avatar_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {userDetailsModal.user.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{userDetailsModal.user.name}</h3>
                  <p className="text-muted-foreground">{userDetailsModal.user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={userDetailsModal.user.role === 'admin' ? 'default' : 'secondary'}>
                      {userDetailsModal.user.role}
                    </Badge>
                    {userDetailsModal.user.verification_status && (
                      <Badge variant={userDetailsModal.user.verification_status === 'verified' ? 'default' : userDetailsModal.user.verification_status === 'pending' ? 'secondary' : 'destructive'}>
                        {userDetailsModal.user.verification_status}
                      </Badge>
                    )}
                    <Badge variant={userDetailsModal.user.profile_complete ? 'default' : 'outline'}>
                      {userDetailsModal.user.profile_complete ? 'Complete Profile' : 'Incomplete Profile'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {userDetailsModal.user.bio && (
                <div>
                  <h4 className="font-medium mb-2">Bio</h4>
                  <p className="text-muted-foreground">{userDetailsModal.user.bio}</p>
                </div>
              )}

              {/* Coach-specific info */}
              {userDetailsModal.user.role === 'coach' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Coach Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Hourly Rate</label>
                      <p className="text-muted-foreground">${userDetailsModal.user.hourly_rate || 0}/hr</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rating</label>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{userDetailsModal.user.rating || 0}/5</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Students</label>
                      <p className="text-muted-foreground">{userDetailsModal.user.total_students || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total Earnings</label>
                      <p className="text-muted-foreground">${userDetailsModal.user.earnings || 0}</p>
                    </div>
                  </div>
                  
                  {userDetailsModal.user.expertise_areas && userDetailsModal.user.expertise_areas.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Expertise Areas</label>
                      <div className="flex flex-wrap gap-2">
                        {userDetailsModal.user.expertise_areas.map((area: string, index: number) => (
                          <Badge key={index} variant="outline">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {userDetailsModal.user.video_intro_url && (
                    <div>
                      <label className="text-sm font-medium">Video Introduction</label>
                      <p className="text-muted-foreground">
                        <a 
                          href={userDetailsModal.user.video_intro_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View Introduction Video
                        </a>
                      </p>
                    </div>
                  )}

                  {userDetailsModal.user.algorand_wallet && (
                    <div>
                      <label className="text-sm font-medium">Algorand Wallet</label>
                      <p className="text-muted-foreground font-mono text-xs">
                        {userDetailsModal.user.algorand_wallet}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Student-specific info */}
              {userDetailsModal.user.role === 'student' && (
                <div className="space-y-4">
                  <h4 className="font-medium">Student Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Current Level</label>
                      <p className="text-muted-foreground capitalize">
                        {userDetailsModal.user.current_level || 'beginner'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tokens Earned</label>
                      <p className="text-muted-foreground">{userDetailsModal.user.tokens_earned || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Courses Completed</label>
                      <p className="text-muted-foreground">
                        {(userDetailsModal.user.courses_completed || []).length}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Selected Path</label>
                      <p className="text-muted-foreground">
                        {userDetailsModal.user.selected_path || 'Not selected'}
                      </p>
                    </div>
                  </div>

                  {userDetailsModal.user.learning_goals && userDetailsModal.user.learning_goals.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Learning Goals</label>
                      <div className="flex flex-wrap gap-2">
                        {userDetailsModal.user.learning_goals.map((goal: string, index: number) => (
                          <Badge key={index} variant="outline">{goal}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="font-medium">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  {userDetailsModal.user.website && (
                    <div>
                      <label className="text-sm font-medium">Website</label>
                      <p className="text-muted-foreground">
                        <a 
                          href={userDetailsModal.user.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {userDetailsModal.user.website}
                        </a>
                      </p>
                    </div>
                  )}
                  {userDetailsModal.user.twitter && (
                    <div>
                      <label className="text-sm font-medium">Twitter</label>
                      <p className="text-muted-foreground">{userDetailsModal.user.twitter}</p>
                    </div>
                  )}
                  {userDetailsModal.user.linkedin && (
                    <div>
                      <label className="text-sm font-medium">LinkedIn</label>
                      <p className="text-muted-foreground">
                        <a 
                          href={userDetailsModal.user.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View LinkedIn Profile
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Details */}
              <div className="space-y-4">
                <h4 className="font-medium">Account Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Subscription Status</label>
                    <p className="text-muted-foreground">
                      {userDetailsModal.user.subscription_status || 'None'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-muted-foreground">
                      {userDetailsModal.user.created_at 
                        ? new Date(userDetailsModal.user.created_at).toLocaleDateString()
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-muted-foreground">
                      {userDetailsModal.user.updated_at 
                        ? new Date(userDetailsModal.user.updated_at).toLocaleDateString()
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Profile Status</label>
                    <Badge variant={userDetailsModal.user.profile_complete ? 'default' : 'outline'}>
                      {userDetailsModal.user.profile_complete ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Admin Actions - For users with pending verification */}
              {userDetailsModal.user?.verification_status === 'pending' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Admin Actions</h4>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        handleVerifyUser(userDetailsModal.user.id, userDetailsModal.user.role, 'verified');
                        setUserDetailsModal({ isOpen: false, user: null });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={verifyingUser === userDetailsModal.user.id}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Approve {userDetailsModal.user.role}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleVerifyUser(userDetailsModal.user.id, userDetailsModal.user.role, 'rejected');
                        setUserDetailsModal({ isOpen: false, user: null });
                      }}
                      disabled={verifyingUser === userDetailsModal.user.id}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject {userDetailsModal.user.role}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setUserDetailsModal({ isOpen: false, user: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}