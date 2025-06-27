"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Calendar, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ClassroomStats from "./classroom_stats";
import ClassroomCourses from "./classroom_courses";
import ClassroomSessions from "./classroom_sessions";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/database.types";

// ✅ FIXED: Using exact database types
type CourseRow = Database['public']['Tables']['courses']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

interface Course {
  id: number;
  title: string;
  description: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  duration: string | null;
  progress: number;
  status: 'draft' | 'published' | 'archived' | null;
  thumbnail: string | null;
  category: string | null;
  enrolled_count: number;
  coach_id: string;
  coach_name: string;
  coach_avatar: string | null;
  created_at: string;
  updated_at: string;
  price: number;
  is_hidden: boolean | null; // ✅ FIXED: Allow null to match database
  student_id: string | null;
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
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | null;
  type: string;
  level: string;
  notes?: string;
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

interface ClassroomStatsData {
  totalCourses: number;
  completedCourses: number;
  activeSessions: number;
  totalStudents?: number;
  tokensEarned?: number;
}

interface UserProfile {
  id: string;
  role: string; // ✅ FIXED: Allow string (will handle null separately)
  name: string;
}

export default function ClassroomPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [stats, setStats] = useState<ClassroomStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  // Get current user and profile
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, role, name')
          .eq('id', user.id)
          .single();
        
        if (profileData && profileData.role && profileData.name) {
          // ✅ FIXED: Only set profile if required fields exist
          setProfile({
            id: profileData.id,
            role: profileData.role,
            name: profileData.name
          });
        }
      }
    }
    getUser();
  }, []);

  // ✅ FIXED: Updated course fetching with proper type handling
  async function fetchCourses(userId: string, role: string): Promise<void> {
    try {
      let coursesQuery = supabase
        .from('courses')
        .select('*');

      // Filter based on role
      if (role === 'coach') {
        coursesQuery = coursesQuery.eq('coach_id', userId);
        if (!showHidden) {
          coursesQuery = coursesQuery.or('is_hidden.is.null,is_hidden.eq.false');
        }
      } else if (role === 'student') {
        coursesQuery = coursesQuery.or(`student_id.eq.${userId},status.eq.published`);
      } else {
        coursesQuery = coursesQuery.eq('status', 'published');
      }

      const { data: coursesData, error } = await coursesQuery.order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCourses: Course[] = [];

      if (coursesData) {
        for (const course of coursesData) {
          // Get coach profile data separately
          const { data: coachProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', course.coach_id)
            .single();

          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('prof_id', course.coach_id)
            .single();

          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('id', course.id)
            .not('student_id', 'is', null);

          // ✅ FIXED: Proper type casting and validation
          const courseLevel = course.level;
          const validLevel = courseLevel === 'beginner' || courseLevel === 'intermediate' || courseLevel === 'advanced' 
            ? courseLevel as 'beginner' | 'intermediate' | 'advanced'
            : null;

          const courseStatus = course.status;
          const validStatus = courseStatus === 'draft' || courseStatus === 'published' || courseStatus === 'archived'
            ? courseStatus as 'draft' | 'published' | 'archived'
            : 'draft' as const;

          formattedCourses.push({
            id: course.id,
            title: course.title || 'Untitled Course',
            description: course.description,
            level: validLevel, // ✅ FIXED: Proper type validation
            duration: course.duration,
            progress: role === 'student' ? Math.floor(Math.random() * 100) : 100,
            status: validStatus, // ✅ FIXED: Proper type validation
            thumbnail: course.thumbnail,
            category: course.category,
            enrolled_count: enrollmentCount || 0,
            coach_id: course.coach_id,
            coach_name: coachProfile?.name || 'Unknown Coach',
            coach_avatar: userProfile?.avatar_url || null,
            created_at: course.created_at,
            updated_at: course.updated_at,
            price: parseFloat(course.price?.toString() || '0'),
            is_hidden: course.is_hidden, // ✅ FIXED: Allow null
            student_id: course.student_id
          });
        }
      }

      setCourses(formattedCourses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses. Please try again.",
        variant: "destructive",
      });
    }
  }

  // ✅ FIXED: Updated session fetching
  async function fetchSessions(userId: string, role: string): Promise<void> {
    try {
      let sessionsQuery = supabase
        .from('sessions')
        .select('*');

      if (role === 'coach') {
        sessionsQuery = sessionsQuery.eq('coach_id', userId);
      } else if (role === 'student') {
        sessionsQuery = sessionsQuery.eq('student_id', userId);
      }

      const { data: sessionsData, error } = await sessionsQuery
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const formattedSessions: Session[] = [];

      if (sessionsData) {
        for (const session of sessionsData) {
          // Get coach profile data
          const { data: coachProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.coach_id)
            .single();

          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('prof_id', session.coach_id)
            .single();

          formattedSessions.push({
            id: session.id,
            title: `1-on-1 Session`,
            scheduled_time: session.scheduled_time,
            duration: session.duration,
            coach_id: session.coach_id,
            coach_name: coachProfile?.name || 'Unknown Coach',
            coach_avatar: userProfile?.avatar_url || null,
            student_count: 1,
            status: session.status,
            type: '1-on-1',
            level: 'all',
            notes: session.notes || undefined // ✅ FIXED: Convert null to undefined
          });
        }
      }

      setSessions(formattedSessions);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sessions. Please try again.",
        variant: "destructive",
      });
    }
  }

  // ✅ FIXED: Updated learning paths
  async function fetchLearningPaths(): Promise<void> {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('level, coach_id')
        .not('level', 'is', null);

      const pathsMap = new Map<string, LearningPath>();

      if (coursesData) {
        coursesData.forEach(course => {
          const level = course.level;
          if (level && !pathsMap.has(level)) { // ✅ FIXED: Check for null
            pathsMap.set(level, {
              id: `path-${level}`,
              name: `${level.charAt(0).toUpperCase()}${level.slice(1)} Trading`,
              level: level,
              description: `Courses designed for ${level} level traders`,
              course_count: 0,
              student_count: 0,
              coach_id: course.coach_id
            });
          }
          if (level) {
            const path = pathsMap.get(level)!;
            path.course_count += 1;
          }
        });
      }

      setLearningPaths(Array.from(pathsMap.values()));
    } catch (error: any) {
      console.error('Error fetching learning paths:', error);
    }
  }

  // Stats fetching function remains the same...
  async function fetchStats(userId: string, role: string): Promise<void> {
    try {
      let statsData: ClassroomStatsData = {
        totalCourses: 0,
        completedCourses: 0,
        activeSessions: 0,
        totalStudents: 0,
        tokensEarned: 0
      };

      if (role === 'coach') {
        const { count: totalCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId);

        const { count: publishedCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId)
          .eq('status', 'published');

        const { count: activeSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId)
          .eq('status', 'scheduled');

        const { count: totalStudents } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId)
          .not('student_id', 'is', null);

        statsData = {
          totalCourses: totalCourses || 0,
          completedCourses: publishedCourses || 0,
          activeSessions: activeSessions || 0,
          totalStudents: totalStudents || 0
        };
      } else if (role === 'student') {
        const { count: enrolledCourses } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId);

        const { count: completedSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('status', 'completed');

        const { count: activeSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('status', 'scheduled');

        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('tokens_earned')
          .eq('student_id', userId)
          .single();

        statsData = {
          totalCourses: enrolledCourses || 0,
          completedCourses: completedSessions || 0,
          activeSessions: activeSessions || 0,
          tokensEarned: studentProfile?.tokens_earned || 0
        };
      }

      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }

  async function loadData() {
    if (!user || !profile) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchCourses(user.id, profile.role),
        fetchSessions(user.id, profile.role),
        fetchLearningPaths(),
        fetchStats(user.id, profile.role)
      ]);
    } catch (error) {
      console.error('Error loading classroom data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && profile) {
      loadData();
    }
  }, [user, profile, showHidden]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Classroom</h1>
          <p className="text-muted-foreground">
            {profile?.role === 'coach'
              ? "Manage your courses and student sessions"
              : "Access your enrolled courses and upcoming sessions"
            }
          </p>
        </div>
        {profile?.role === 'coach' && (
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/courses/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setShowHidden(!showHidden)}>
              {showHidden ? 'Hide Hidden' : 'Show Hidden'}
            </Button>
          </div>
        )}
      </div>

      <ClassroomStats stats={stats} userRole={profile?.role || 'student'} />

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          {profile?.role === 'coach' && (
            <TabsTrigger value="paths" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Learning Paths
            </TabsTrigger>
          )}
          {profile?.role === 'student' && (
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Progress
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="courses">
          <ClassroomCourses
            courses={courses}
            userRole={profile?.role || 'student'}
            onRefresh={loadData}
            learningPaths={learningPaths}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <ClassroomSessions
            sessions={sessions}
            courses={courses}
            userRole={profile?.role || 'student'}
            learningPaths={learningPaths}
          />
        </TabsContent>

        {profile?.role === 'coach' && (
          <TabsContent value="paths">
            <ClassroomSessions
              sessions={sessions}
              courses={courses}
              userRole={profile?.role || 'student'}
              learningPaths={learningPaths}
              showPathsTab={true}
            />
          </TabsContent>
        )}

        {profile?.role === 'student' && (
          <TabsContent value="progress">
            <ClassroomSessions
              sessions={sessions}
              courses={courses}
              userRole={profile?.role || 'student'}
              learningPaths={learningPaths}
              showProgressTab={true}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}