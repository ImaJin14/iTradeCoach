"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  Calendar,
  TrendingUp,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Trash2,
  UserX,
  ChevronLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalCoaches: number;
  totalStudents: number;
  activeSessions: number;
  totalRevenue: number;
  verifiedCoaches: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  subscription_status: string;
  profile_complete: boolean;
}

interface Coach extends User {
  verification_status: string;
  rating: number;
  total_students: number;
  earnings: number;
  hourly_rate: number;
  expertise_areas: string[];
}

interface Student extends User {
  current_level: string;
  tokens_earned: number;
  selected_coach_id: string | null;
  coach_name?: string;
}

interface CoachStudentRelation {
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  student_id: string;
  student_name: string;
  student_avatar: string | null;
  session_count: number;
  last_session: string | null;
}

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [coachStudentRelations, setCoachStudentRelations] = useState<CoachStudentRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin dashboard.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }

        setCurrentUser(profile);
        await fetchAdminData();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin access. Please try again.",
          variant: "destructive",
        });
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router, toast]);

  async function fetchAdminData() {
    try {
      // Fetch all users
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch coaches with their profiles
      const { data: coachData, error: coachError } = await supabase
        .from('coach_profiles')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            avatar_url,
            created_at,
            subscription_status,
            profile_complete
          )
        `);

      if (coachError) throw coachError;

      // Fetch students with their profiles
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            avatar_url,
            created_at,
            subscription_status,
            profile_complete
          ),
          coach:selected_coach_id (
            name
          )
        `);

      if (studentError) throw studentError;

      // Fetch coach-student relationships through sessions
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          coach_id,
          student_id,
          created_at,
          coach:coach_id (
            name,
            avatar_url
          ),
          student:student_id (
            name,
            avatar_url
          )
        `)
        .eq('status', 'completed');

      if (sessionError) throw sessionError;

      // Process coach-student relationships
      const relationshipMap = new Map<string, CoachStudentRelation>();
      
      sessionData?.forEach(session => {
        const key = `${session.coach_id}-${session.student_id}`;
        if (relationshipMap.has(key)) {
          const existing = relationshipMap.get(key)!;
          existing.session_count += 1;
          if (!existing.last_session || session.created_at > existing.last_session) {
            existing.last_session = session.created_at;
          }
        } else {
          relationshipMap.set(key, {
            coach_id: session.coach_id,
            coach_name: session.coach[0]?.name || 'Unknown Coach',
            coach_avatar: session.coach[0]?.avatar_url || null,
            student_id: session.student_id,
            student_name: session.student[0]?.name || 'Unknown Student',
            student_avatar: session.student[0]?.avatar_url || null,
            session_count: 1,
            last_session: session.created_at
          });
        }
      });

      // Calculate stats
      const totalUsers = allUsers?.length || 0;
      const totalCoaches = coachData?.length || 0;
      const totalStudents = studentData?.length || 0;
      const verifiedCoaches = coachData?.filter(c => c.verification_status === 'verified').length || 0;
      const totalRevenue = coachData?.reduce((sum, coach) => sum + (coach.earnings || 0), 0) || 0;

      // Get active sessions count
      const { count: activeSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      setStats({
        totalUsers,
        totalCoaches,
        totalStudents,
        activeSessions: activeSessions || 0,
        totalRevenue,
        verifiedCoaches
      });

      setUsers(allUsers || []);
      
      // Transform coach data
      const transformedCoaches = coachData?.map(coach => ({
        ...coach.profiles,
        role: 'coach',
        verification_status: coach.verification_status,
        rating: coach.rating,
        total_students: coach.total_students,
        earnings: coach.earnings,
        hourly_rate: coach.hourly_rate,
        expertise_areas: coach.expertise_areas
      })) || [];

      // Transform student data
      const transformedStudents = studentData?.map(student => ({
        ...student.profiles,
        role: 'student',
        current_level: student.current_level,
        tokens_earned: student.tokens_earned,
        selected_coach_id: student.selected_coach_id,
        coach_name: student.coach?.name
      })) || [];

      setCoaches(transformedCoaches);
      setStudents(transformedStudents);
      setCoachStudentRelations(Array.from(relationshipMap.values()));

    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleSuspendUser(userId: string, userType: 'user' | 'coach') {
    try {
      // Update user status (you might want to add a suspended field to your schema)
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'suspended' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Suspended",
        description: "The user has been suspended successfully.",
      });

      await fetchAdminData(); // Refresh data
    } catch (error: any) {
      console.error('Error suspending user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Deleted",
        description: "The user has been permanently deleted.",
      });

      await fetchAdminData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleVerifyCoach(coachId: string) {
    try {
      const { error } = await supabase
        .from('coach_profiles')
        .update({ verification_status: 'verified' })
        .eq('user_id', coachId);

      if (error) throw error;

      toast({
        title: "Coach Verified",
        description: "The coach has been verified successfully.",
      });

      await fetchAdminData(); // Refresh data
    } catch (error: any) {
      console.error('Error verifying coach:', error);
      toast({
        title: "Error",
        description: "Failed to verify coach. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.subscription_status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 mb-4"
          asChild
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, coaches, and platform analytics</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coaches</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCoaches}</div>
              <p className="text-xs text-muted-foreground">
                {stats.verifiedCoaches} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coach-Student Pairs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coachStudentRelations.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="coach">Coaches</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="none">No Subscription</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="coaches">Manage Coaches</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="relationships">Coach-Student Relationships</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of all platform users with management actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                            />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.subscription_status === 'active' ? 'default' : 'outline'}
                        >
                          {user.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/profile/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleSuspendUser(user.id, 'user')}
                              className="text-orange-600"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Warn User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSuspendUser(user.id, 'user')}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user
                                    account and remove all associated data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coaches">
          <Card>
            <CardHeader>
              <CardTitle>Manage Coaches</CardTitle>
              <CardDescription>
                All coaches on the platform with management capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Earnings</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoaches.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.id}`} 
                            />
                            <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{coach.name}</div>
                            <div className="text-sm text-muted-foreground">{coach.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={coach.verification_status === 'verified' ? 'default' : 'outline'}
                        >
                          {coach.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{coach.rating}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-3 w-3 ${
                                  i < coach.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-muted'
                                }`}
                              >
                                ⭐
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{coach.total_students}</TableCell>
                      <TableCell>${coach.earnings}</TableCell>
                      <TableCell>${coach.hourly_rate}/hr</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/profile/${coach.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            {coach.verification_status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleVerifyCoach(coach.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify Coach
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleSuspendUser(coach.id, 'coach')}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend Coach
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSuspendUser(coach.id, 'coach')}
                              className="text-red-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Ban Coach
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Coach
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Coach Account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove the coach from the platform and 
                                    cancel all their scheduled sessions. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(coach.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Coach
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                All students on the platform with their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Current Coach</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} 
                            />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {student.current_level}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.tokens_earned}</TableCell>
                      <TableCell>
                        {student.coach_name ? (
                          <span className="text-sm">{student.coach_name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No coach selected</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/profile/${student.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleSuspendUser(student.id, 'user')}
                              className="text-orange-600"
                            >
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Warn Student
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSuspendUser(student.id, 'user')}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend Student
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Student
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Student Account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove the student from the platform.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(student.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Student
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle>Coach-Student Relationships</CardTitle>
              <CardDescription>
                Active coaching relationships and session history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coach</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Last Session</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coachStudentRelations.map((relation, index) => (
                    <TableRow key={`${relation.coach_id}-${relation.student_id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={relation.coach_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${relation.coach_id}`} 
                            />
                            <AvatarFallback>{relation.coach_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{relation.coach_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={relation.student_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${relation.student_id}`} 
                            />
                            <AvatarFallback>{relation.student_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{relation.student_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {relation.session_count} sessions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {relation.last_session ? 
                          new Date(relation.last_session).toLocaleDateString() : 
                          'No sessions'
                        }
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}