"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
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

interface Session {
  id: string;
  scheduled_time: string;
  duration: number;
  status: string;
  price: number;
  notes: string;
  coach: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  student: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAccessAndLoadSessions() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setCurrentUser(user);
        setUserRole(profile.role);
        await fetchSessions(user.id, profile.role);
      } catch (error: any) {
        console.error('Error checking access:', error);
        toast({
          title: "Error",
          description: "Failed to load sessions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndLoadSessions();
  }, [router, toast]);

  async function fetchSessions(userId: string, role: string) {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          id,
          scheduled_time,
          duration,
          status,
          price,
          notes,
          coach:coach_id (
            id,
            name,
            avatar_url
          ),
          student:student_id (
            id,
            name,
            avatar_url
          )
        `)
        .order('scheduled_time', { ascending: false });

      // Filter sessions based on user role
      if (role === 'coach') {
        query = query.eq('coach_id', userId);
      } else if (role === 'student') {
        query = query.eq('student_id', userId);
      } else if (role === 'admin') {
        // Admin sees all sessions - no additional filter needed
      } else {
        // For other roles, show only their sessions
        query = query.or(`coach_id.eq.${userId},student_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load sessions. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    
    // Time filter logic
    let matchesTime = true;
    const sessionDate = new Date(session.scheduled_time);
    const now = new Date();
    
    if (timeFilter === "upcoming") {
      matchesTime = sessionDate > now;
    } else if (timeFilter === "past") {
      matchesTime = sessionDate < now;
    } else if (timeFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesTime = sessionDate >= today && sessionDate < tomorrow;
    }
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'scheduled':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSessionStatusBadge = (session: Session) => {
    const sessionDate = new Date(session.scheduled_time);
    const now = new Date();
    
    if (session.status === 'completed') {
      return <Badge variant="default">Completed</Badge>;
    } else if (session.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (sessionDate < now && session.status === 'scheduled') {
      return <Badge variant="destructive">Missed</Badge>;
    } else if (sessionDate > now && session.status === 'scheduled') {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
    
    return <Badge variant="outline">{session.status}</Badge>;
  };

  const getPageTitle = () => {
    switch (userRole) {
      case 'coach':
        return 'My Coaching Sessions';
      case 'student':
        return 'My Learning Sessions';
      case 'admin':
        return 'All Platform Sessions';
      default:
        return 'My Sessions';
    }
  };

  const getPageDescription = () => {
    switch (userRole) {
      case 'coach':
        return 'View and manage all your coaching sessions';
      case 'student':
        return 'Track your learning progress and upcoming sessions';
      case 'admin':
        return 'Monitor all sessions across the platform';
      default:
        return 'View your session history and upcoming appointments';
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
            <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
            <p className="text-muted-foreground">{getPageDescription()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_time) > new Date()).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => {
                const sessionDate = new Date(s.scheduled_time);
                const now = new Date();
                return sessionDate.getMonth() === now.getMonth() && 
                       sessionDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={userRole === 'coach' ? "Search by student name or notes..." : "Search by coach name or notes..."}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past Sessions</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            {userRole === 'coach' 
              ? "All your coaching sessions with students"
              : userRole === 'student'
              ? "All your learning sessions with coaches"
              : "Complete session history and status"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {userRole === 'coach' ? 'Student' : userRole === 'student' ? 'Coach' : 'Participants'}
                </TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {userRole === 'admin' ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={session.coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach.id}`} 
                            />
                            <AvatarFallback className="text-xs">{session.coach.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{session.coach.name}</span>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={session.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.student.id}`} 
                            />
                            <AvatarFallback className="text-xs">{session.student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{session.student.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={userRole === 'coach' 
                              ? (session.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.student.id}`)
                              : (session.coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach.id}`)
                            } 
                          />
                          <AvatarFallback>
                            {userRole === 'coach' ? session.student.name.charAt(0) : session.coach.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {userRole === 'coach' ? session.student.name : session.coach.name}
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {new Date(session.scheduled_time).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(session.scheduled_time).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{session.duration} min</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(session.status)}
                      {getSessionStatusBadge(session)}
                    </div>
                  </TableCell>
                  <TableCell>${session.price}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={session.notes}>
                      {session.notes || 'Coaching Session'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {sessions.length === 0 
                ? "No sessions found. Start coaching to see your sessions here!"
                : "No sessions found matching your criteria"
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}