"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, Calendar, MessageSquare, Star, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  current_level: string;
  tokens_earned: number;
  sessions_completed: number;
  last_session: string | null;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkCoachAccess() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if user is a coach
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'coach') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }

        setCurrentUser(user);
        await fetchStudents(user.id);
      } catch (error: any) {
        console.error('Error checking coach access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkCoachAccess();
  }, [router, toast]);

  async function fetchStudents(coachId: string) {
    try {
      // Get students who have had sessions with this coach
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          student_id,
          created_at,
          status,
          student:student_id (
            id,
            name,
            email,
            avatar_url,
            created_at
          )
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (sessionError) throw sessionError;

      // Get student profiles for additional data
      const studentIds = [...new Set(sessionData?.map(s => s.student_id))];
      
      if (studentIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: studentProfiles, error: profileError } = await supabase
        .from('student_profiles')
        .select(`
          Student_id,
          current_level,
          tokens_earned
        `)
        .in('Student_id', studentIds);

      if (profileError) throw profileError;

      // Combine data and calculate stats
      const studentsMap = new Map();
      
      sessionData?.forEach(session => {
        const studentId = session.student_id;
        if (!studentsMap.has(studentId)) {
          const profile = studentProfiles?.find(p => p.Student_id === studentId);
          studentsMap.set(studentId, {
            id: studentId,
            name: session.student.name,
            email: session.student.email,
            avatar_url: session.student.avatar_url,
            created_at: session.student.created_at,
            current_level: profile?.current_level || 'beginner',
            tokens_earned: profile?.tokens_earned || 0,
            sessions_completed: 0,
            last_session: null
          });
        }

        const student = studentsMap.get(studentId);
        if (session.status === 'completed') {
          student.sessions_completed += 1;
          if (!student.last_session || session.created_at > student.last_session) {
            student.last_session = session.created_at;
          }
        }
      });

      setStudents(Array.from(studentsMap.values()));
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === "all" || student.current_level === levelFilter;
    
    return matchesSearch && matchesLevel;
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

  return (
    <div className="container py-8">
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
            <h1 className="text-3xl font-bold">My Students</h1>
            <p className="text-muted-foreground">Manage and track your students' progress</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.last_session && 
                new Date(s.last_session) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sessions in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce((sum, student) => sum + student.sessions_completed, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0 
                ? Math.round(students.reduce((sum, s) => sum + s.tokens_earned, 0) / students.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Average tokens earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or email..."
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
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            All students who have had sessions with you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Last Session</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
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
                  <TableCell>
                    <span className="font-medium">{student.sessions_completed}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{student.tokens_earned}</span>
                  </TableCell>
                  <TableCell>
                    {student.last_session ? (
                      <span className="text-sm">
                        {new Date(student.last_session).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No sessions</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(student.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {students.length === 0 
                ? "No students yet. Start coaching to see your students here!"
                : "No students found matching your criteria"
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}