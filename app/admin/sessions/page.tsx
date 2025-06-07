"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
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

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
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
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }

        await fetchSessions();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router, toast]);

  async function fetchSessions() {
    try {
      const { data, error } = await supabase
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
    
    if (timeFilter === "scheduled") {
      // Sessions that are scheduled and in the future
      matchesTime = session.status === 'scheduled' && sessionDate > now;
    } else if (timeFilter === "future") {
      // All future sessions regardless of status
      matchesTime = sessionDate > now;
    } else if (timeFilter === "past") {
      // All past sessions
      matchesTime = sessionDate < now;
    } else if (timeFilter === "incomplete") {
      // Future sessions that haven't been held yet (status not completed)
      matchesTime = sessionDate > now && session.status !== 'completed';
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
      return <Badge variant="default">Held</Badge>;
    } else if (session.status === 'cancelled') {
      return <Badge variant="destructive">Failed</Badge>;
    } else if (sessionDate < now && session.status === 'scheduled') {
      return <Badge variant="destructive">Failed to Hold</Badge>;
    } else if (sessionDate > now && session.status === 'scheduled') {
      return <Badge variant="secondary">Scheduled</Badge>;
    }
    
    return <Badge variant="outline">{session.status}</Badge>;
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
            <h1 className="text-3xl font-bold">Manage Sessions</h1>
            <p className="text-muted-foreground">Monitor and manage all coaching sessions on the platform</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5 mb-8">
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
            <CardTitle className="text-sm font-medium">Held</CardTitle>
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
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
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
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.status === 'cancelled' || (new Date(s.scheduled_time) < new Date() && s.status === 'scheduled')).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplete</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => new Date(s.scheduled_time) > new Date() && s.status !== 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions by coach, student, or notes..."
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
            <SelectItem value="scheduled">Scheduled (Monitor)</SelectItem>
            <SelectItem value="incomplete">Next Scheduled</SelectItem>
            <SelectItem value="future">Future Sessions</SelectItem>
            <SelectItem value="past">Past Sessions</SelectItem>
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
          <CardTitle>
            {timeFilter === "scheduled" ? "Scheduled Sessions (Monitor)" : 
             timeFilter === "incomplete" ? "Next Scheduled Sessions" : 
             "All Sessions"}
          </CardTitle>
          <CardDescription>
            {timeFilter === "scheduled" ? "Monitor scheduled coaching sessions and their status" :
             timeFilter === "incomplete" ? "Future sessions that haven't been held yet (status incomplete)" :
             "Complete list of all coaching sessions with their status and details"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach → Student</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Session Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
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
              No sessions found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}