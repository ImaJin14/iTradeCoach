"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search,
  BookOpen,
  Users,
  Calendar,
  Clock,
  Play,
  FileText,
  Award,
  TrendingUp,
  Plus,
  Filter,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  EyeOff,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface ClassroomStats {
  totalCourses: number;
  completedCourses: number;
  activeSessions: number;
  totalStudents?: number;
  tokensEarned?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  progress: number;
  status: string;
  thumbnail: string;
  category: string;
  enrolled_count: number;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  created_at: string;
  updated_at: string;
  price: number;
  is_hidden: boolean;
}

interface Session {
  id: string;
  title: string;
  scheduled_time: string;
  duration: number;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  student_count: number;
  status: string;
  type: string;
  level: string;
}

interface LearningPath {
  id: string;
  name: string;
  level: string;
  description: string;
  course_count: number;
  student_count: number;
  coach_id: string;
}

export default function ClassroomPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClassroomStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPath, setSelectedPath] = useState<string>("all");
  const [showHidden, setShowHidden] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAccessAndLoadData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setCurrentUser(user);
        setUserRole(profile.role || ''); 
    
        await Promise.all([
          fetchClassroomStats(user.id, profile.role || ''),
          fetchCourses(user.id, profile.role || ''),
          fetchSessions(user.id, profile.role || ''),
          fetchLearningPaths(user.id, profile.role || '')
        ]);
      } catch (error: any) {
        console.error('Error loading classroom data:', error);
        toast({
          title: "Error",
          description: "Failed to load classroom data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndLoadData();
  }, [router, toast]);

  async function fetchClassroomStats(userId: string, role: string) {
    try {
      let stats: ClassroomStats = {
        totalCourses: 0,
        completedCourses: 0,
        activeSessions: 0
      };
  
      if (role === 'coach') {
        // Get courses created by this coach
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId);
  

        const publishedCourses = totalCourses; 
  
        // Get unique students enrolled in coach's courses
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .eq('coach_id', userId);
  
        const courseIds = courses?.map(c => c.id) || [];
        
        // Note: There's no 'course_enrollments' table, using session enrollments instead
        const { data: sessions } = await supabase
          .from('sessions')
          .select('student_id')
          .eq('coach_id', userId);
  
        const uniqueStudents = new Set(sessions?.map(s => s.student_id) || []).size;
  
        // Get active/scheduled sessions
        const { count: activeSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId)
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString());
  
        stats = {
          totalCourses: totalCourses || 0,
          completedCourses: publishedCourses || 0,
          activeSessions: activeSessions || 0,
          totalStudents: uniqueStudents
        };
      } else if (role === 'student') {
        // Get courses where student is enrolled
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId);
  
        // Get completed courses (using is_hidden as proxy for completion)
        const { count: completedCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('is_hidden', false); // Assuming visible courses are completed
  
        // Get upcoming sessions
        const { count: activeSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString());
  
        // Get tokens from student profile
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('tokens_earned')
          .eq('student_id', userId) // Changed from 'user_id' to 'student_id'
          .single();
  
        stats = {
          totalCourses: totalCourses || 0,
          completedCourses: completedCourses || 0,
          activeSessions: activeSessions || 0,
          tokensEarned: studentProfile?.tokens_earned || 0
        };
      } else {
        // Admin stats - platform wide
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });
  
        // All courses are considered published since there's no status field
        const publishedCourses = totalCourses;
  
        const { count: activeSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString());
  
        stats = {
          totalCourses: totalCourses || 0,
          completedCourses: publishedCourses || 0,
          activeSessions: activeSessions || 0
        };
      }
      
      setStats(stats);
    } catch (error: any) {
      console.error('Error fetching classroom stats:', error);
    }
  }

  async function fetchCourses(userId: string, role: string) {
    try {
      let query = supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          level,
          duration,
          status,
          thumbnail,
          category,
          price,
          created_at,
          updated_at,
          coach_id,
          is_hidden,
          coach:coach_id (
            name,
            avatar_url
          )
        `);

      // Filter based on role
      if (role === 'coach') {
        query = query.eq('coach_id', userId);
      } else if (role === 'student') {
        // Get courses the student is enrolled in
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id, progress, status')
          .eq('student_id', userId);

        const courseIds = enrollments?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          query = query.in('id', courseIds).eq('is_hidden', false);
        } else {
          setCourses([]);
          return;
        }
      } else {
        // Admin sees all courses
        query = query.eq('is_hidden', false);
      }

      // For coaches, show hidden courses only if showHidden is true
      if (role === 'coach' && !showHidden) {
        query = query.eq('is_hidden', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get enrollment counts for each course
      const courseIds = data?.map(c => c.id) || [];
      const { data: enrollmentCounts } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .in('course_id', courseIds);

      // Count enrollments per course
      const enrollmentMap = enrollmentCounts?.reduce((acc, enrollment) => {
        acc[enrollment.course_id] = (acc[enrollment.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get progress for students
      let progressMap: Record<string, number> = {};
      if (role === 'student') {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('course_id, progress')
          .eq('student_id', userId);
        
        progressMap = enrollments?.reduce((acc, enrollment) => {
          acc[enrollment.course_id] = enrollment.progress || 0;
          return acc;
        }, {} as Record<string, number>) || {};
      }

      const formattedCourses = data?.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        duration: course.duration,
        progress: role === 'student' ? (progressMap[course.id] || 0) : 100,
        status: course.status,
        thumbnail: course.thumbnail || 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
        category: course.category,
        enrolled_count: enrollmentMap[course.id] || 0,
        coach_id: course.coach_id,
        coach_name: course.coach.name,
        coach_avatar: course.coach.avatar_url,
        created_at: course.created_at,
        updated_at: course.updated_at,
        price: course.price || 0,
        is_hidden: course.is_hidden || false
      })) || [];

      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  }

  async function fetchSessions(userId: string, role: string) {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          id,
          scheduled_time,
          duration,
          status,
          notes,
          coach:coach_id(name, avatar_url),
          student:student_id(name, avatar_url)
        `)
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(5);

      // Filter based on role
      if (role === 'coach') {
        query = query.eq('coach_id', userId);
      } else if (role === 'student') {
        query = query.eq('student_id', userId);
      }
      // Admin sees all sessions (no additional filter)

      const { data, error } = await query;

      if (error) throw error;

      const formattedSessions = data?.map(session => ({
        id: session.id,
        title: session.notes || 'Coaching Session',
        scheduled_time: session.scheduled_time,
        duration: session.duration,
        coach_id: session.coach.id,
        coach_name: session.coach.name,
        coach_avatar: session.coach.avatar_url,
        student_count: 1, // 1-on-1 sessions
        status: session.status,
        type: 'coaching',
        level: 'all'
      })) || [];

      setSessions(formattedSessions);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
    }
  }

  async function fetchLearningPaths(userId: string, role: string) {
    try {
      if (role === 'coach') {
        // Create learning paths for each level for this coach
        const levels = ['beginner', 'intermediate', 'advanced'];
        const paths: LearningPath[] = [];

        for (const level of levels) {
          // Get course count for this level
          const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', userId)
            .eq('level', level)
            .eq('is_hidden', false);

          // Get student count for this level (students enrolled in any course of this level)
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('student_id')
            .in('course_id', 
              await supabase
                .from('courses')
                .select('id')
                .eq('coach_id', userId)
                .eq('level', level)
                .eq('is_hidden', false)
                .then(res => res.data?.map(c => c.id) || [])
            );

          const uniqueStudents = new Set(enrollments?.map(e => e.student_id) || []).size;

          paths.push({
            id: `${userId}-${level}`,
            name: `${level.charAt(0).toUpperCase() + level.slice(1)} Path`,
            level: level,
            description: `${level.charAt(0).toUpperCase() + level.slice(1)} level trading courses`,
            course_count: courseCount || 0,
            student_count: uniqueStudents,
            coach_id: userId
          });
        }

        setLearningPaths(paths);
      } else {
        // For students and admins, show all available paths
        const { data: coaches } = await supabase
          .from('coach_profiles')
          .select(`
            user_id,
            profiles:user_id (
              name
            )
          `)
          .eq('verification_status', 'verified');

        const paths: LearningPath[] = [];
        const levels = ['beginner', 'intermediate', 'advanced'];

        for (const coach of coaches || []) {
          for (const level of levels) {
            const { count: courseCount } = await supabase
              .from('courses')
              .select('*', { count: 'exact', head: true })
              .eq('coach_id', coach.user_id)
              .eq('level', level)
              .eq('status', 'published')
              .eq('is_hidden', false);

            if (courseCount && courseCount > 0) {
              paths.push({
                id: `${coach.user_id}-${level}`,
                name: `${level.charAt(0).toUpperCase() + level.slice(1)} - ${coach.profiles.name}`,
                level: level,
                description: `${level.charAt(0).toUpperCase() + level.slice(1)} level courses by ${coach.profiles.name}`,
                course_count: courseCount,
                student_count: 0, // Can be calculated if needed
                coach_id: coach.user_id
              });
            }
          }
        }

        setLearningPaths(paths);
      }
    } catch (error: any) {
      console.error('Error fetching learning paths:', error);
    }
  }

  async function handleHideCourse(courseId: string) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_hidden: true })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Course Hidden",
        description: "The course has been hidden from students and will not appear in search results.",
      });

      // Refresh courses
      await fetchCourses(currentUser.id, userRole);
    } catch (error: any) {
      console.error('Error hiding course:', error);
      toast({
        title: "Error",
        description: "Failed to hide course. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleShowCourse(courseId: string) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_hidden: false })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Course Shown",
        description: "The course is now visible to students and will appear in search results.",
      });

      // Refresh courses
      await fetchCourses(currentUser.id, userRole);
    } catch (error: any) {
      console.error('Error showing course:', error);
      toast({
        title: "Error",
        description: "Failed to show course. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCourse(courseId: string) {
    try {
      // First, delete any enrollments
      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId);

      if (enrollmentError) throw enrollmentError;

      // Then delete the course
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Course Deleted",
        description: "The course has been permanently deleted.",
      });

      // Refresh courses and stats
      await Promise.all([
        fetchCourses(currentUser.id, userRole),
        fetchClassroomStats(currentUser.id, userRole),
        fetchLearningPaths(currentUser.id, userRole)
      ]);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.coach_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || course.level.toLowerCase() === levelFilter;
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesPath = selectedPath === "all" || course.level === selectedPath.split('-')[1];
    
    return matchesSearch && matchesLevel && matchesCategory && matchesPath;
  });

  const getStatusBadge = (status: string, progress: number, isHidden: boolean) => {
    if (isHidden) {
      return <Badge variant="outline\" className="text-gray-500">Hidden</Badge>;
    }
    
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress ({progress}%)</Badge>;
      case 'enrolled':
        return <Badge variant="outline">Enrolled</Badge>;
      case 'published':
        return <Badge variant="default">Published</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPageTitle = () => {
    switch (userRole) {
      case 'coach':
        return 'Teaching Dashboard';
      case 'student':
        return 'My Classroom';
      case 'admin':
        return 'Platform Classroom';
      default:
        return 'Classroom';
    }
  };

  const getPageDescription = () => {
    switch (userRole) {
      case 'coach':
        return 'Manage your courses and track student progress across learning paths';
      case 'student':
        return 'Access your courses, sessions, and learning progress';
      case 'admin':
        return 'Monitor all classroom activities across the platform';
      default:
        return 'Your learning and teaching hub';
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-muted-foreground">{getPageDescription()}</p>
          </div>
          <div className="flex gap-2">
            {userRole === 'coach' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowHidden(!showHidden)}
                  className="gap-2"
                >
                  {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showHidden ? 'Hide Hidden' : 'Show Hidden'}
                </Button>
                <Button className="gap-2" asChild>
                  <Link href="/courses/create">
                    <Plus className="h-4 w-4" />
                    Create Course
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'coach' ? 'Courses Created' : 'Enrolled Courses'}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {userRole === 'coach' ? 'Published Courses' : 'Completed Courses'}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCourses}</div>
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
              <CardTitle className="text-sm font-medium">
                {userRole === 'coach' ? 'Total Students' : 'Tokens Earned'}
              </CardTitle>
              {userRole === 'coach' ? (
                <Users className="h-4 w-4 text-muted-foreground" />
              ) : (
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userRole === 'coach' ? stats.totalStudents : stats.tokensEarned}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">
            {userRole === 'coach' ? 'My Courses' : 'Courses'}
          </TabsTrigger>
          <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
          {userRole === 'coach' && (
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          )}
          {userRole === 'student' && (
            <TabsTrigger value="progress">My Progress</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            {userRole !== 'coach' && learningPaths.length > 0 && (
              <Select value={selectedPath} onValueChange={setSelectedPath}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select learning path" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Paths</SelectItem>
                  {learningPaths.map((path) => (
                    <SelectItem key={path.id} value={path.id}>
                      {path.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${course.is_hidden ? 'opacity-60' : ''}`}>
                <div className="aspect-video relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      {userRole === 'coach' ? 'Manage' : 'Continue'}
                    </Button>
                  </div>
                  {course.is_hidden && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-gray-500 text-white">
                        Hidden
                      </Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(course.status, course.progress, course.is_hidden)}
                      {userRole === 'coach' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost\" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Course
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {course.is_hidden ? (
                              <DropdownMenuItem onClick={() => handleShowCourse(course.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Show Course
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleHideCourse(course.id)}>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Hide Course
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Course
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{course.title}" and remove all student enrollments. 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Course
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={course.coach_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.coach_id}`} 
                      />
                      <AvatarFallback className="text-xs">{course.coach_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{course.coach_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.enrolled_count} students
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {course.level}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">${course.price}</span>
                    {userRole === 'student' && course.progress > 0 && (
                      <span className="text-sm text-muted-foreground">{course.progress}% complete</span>
                    )}
                  </div>
                  {userRole === 'student' && course.progress > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {courses.length === 0 
                ? userRole === 'coach' 
                  ? "No courses created yet. Start by creating your first course!"
                  : "No courses enrolled yet. Browse available courses to get started!"
                : "No courses found matching your criteria"
              }
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                {userRole === 'coach' 
                  ? "Your scheduled coaching sessions with students"
                  : "Your upcoming coaching sessions"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.scheduled_time).toLocaleDateString()} at{' '}
                            {new Date(session.scheduled_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage 
                            src={session.coach_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach_id}`} 
                          />
                          <AvatarFallback className="text-xs">{session.coach_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{session.coach_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{session.type}</Badge>
                      <Button size="sm">Join Session</Button>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming sessions scheduled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'coach' && (
          <TabsContent value="paths" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Paths</CardTitle>
                <CardDescription>
                  Manage your learning paths for different skill levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {learningPaths.map((path) => (
                    <Card key={path.id} className="border-2 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {path.name}
                          <Badge variant="outline" className="capitalize">
                            {path.level}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{path.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Courses:</span>
                            <span className="font-medium">{path.course_count}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Students:</span>
                            <span className="font-medium">{path.student_count}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4" variant="outline" asChild>
                          <Link href={`/courses/create?level=${path.level}`}>
                            Add Course
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {userRole === 'student' && (
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>
                  Track your progress across all enrolled courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {courses.filter(c => c.progress > 0).map((course) => (
                    <div key={course.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">{course.coach_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{course.progress}%</div>
                          <div className="text-sm text-muted-foreground">
                            {getStatusBadge(course.status, course.progress, course.is_hidden)}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {courses.filter(c => c.progress > 0).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No course progress to display yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}