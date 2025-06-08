"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  ChevronLeft, 
  Calendar,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  Video,
  Save
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const sessionFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  learning_path: z.enum(["beginner", "intermediate", "advanced"], {
    required_error: "Please select a learning path",
  }),
  scheduled_time: z.string().min(1, { message: "Please select date and time" }),
  duration: z.string().min(1, { message: "Please select duration" }),
  max_participants: z.string().min(1, { message: "Please set maximum participants" }),
  price: z.string().min(1, { message: "Please set a price" }),
  selected_students: z.array(z.string()).optional(),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  current_level: string;
  tokens_earned: number;
  sessions_completed: number;
  last_session: string | null;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  learning_path: string;
  scheduled_time: string;
  duration: number;
  max_participants: number;
  current_participants: number;
  price: number;
  status: string;
  coach_id: string;
  created_at: string;
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

const LEARNING_PATH_DESCRIPTIONS = {
  beginner: "Perfect for those new to trading with basic concepts and fundamentals",
  intermediate: "For traders with some experience looking to enhance their skills",
  advanced: "Advanced strategies and complex concepts for experienced traders"
};

export default function ScheduleSessionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPath, setSelectedPath] = useState<string>("all");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      learning_path: "beginner",
      scheduled_time: "",
      duration: "60",
      max_participants: "10",
      price: "50",
      selected_students: [],
    },
  });

  const watchedLearningPath = form.watch("learning_path");

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
          .select('role, subscription_status')
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

        // Check subscription status
        if (profile.subscription_status !== 'active') {
          toast({
            title: "Subscription Required",
            description: "You need an active subscription to schedule live sessions.",
            variant: "destructive",
          });
          router.push('/pricing');
          return;
        }

        setCurrentUser(user);
        await Promise.all([
          fetchStudents(user.id),
          fetchLiveSessions(user.id)
        ]);
      } catch (error: any) {
        console.error('Error checking coach access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkCoachAccess();
  }, [router, toast]);

  useEffect(() => {
    // Filter students based on selected learning path and search term
    let filtered = students;

    if (watchedLearningPath) {
      filtered = filtered.filter(student => student.current_level === watchedLearningPath);
    }

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
  }, [students, watchedLearningPath, searchTerm]);

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
          student_id,
          current_level,
          tokens_earned
        `)
        .in('user_id', studentIds);

      if (profileError) throw profileError;

      // Combine data and calculate stats
      const studentsMap = new Map();
      
      sessionData?.forEach(session => {
        const studentId = session.student_id;
        if (!studentsMap.has(studentId)) {
          const profile = studentProfiles?.find(p => p.user_id === studentId);
          studentsMap.set(studentId, {
            id: studentId,
            name: session.student.name,
            email: session.student.email,
            avatar_url: session.student.avatar_url,
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

  async function fetchLiveSessions(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('coach_id', coachId)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setLiveSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching live sessions:', error);
    }
  }

  async function onSubmit(data: SessionFormValues) {
    if (!currentUser) return;

    setSaving(true);
    try {
      // Create live session
      const { data: session, error: sessionError } = await supabase
        .from('live_sessions')
        .insert({
          title: data.title,
          description: data.description,
          learning_path: data.learning_path,
          scheduled_time: new Date(data.scheduled_time).toISOString(),
          duration: parseInt(data.duration),
          max_participants: parseInt(data.max_participants),
          price: parseFloat(data.price),
          coach_id: currentUser.id,
          status: 'scheduled',
          current_participants: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // If specific students are selected, create enrollments
      if (data.selected_students && data.selected_students.length > 0) {
        const enrollments = data.selected_students.map(studentId => ({
          session_id: session.id,
          student_id: studentId,
          enrolled_at: new Date().toISOString(),
          status: 'enrolled'
        }));

        const { error: enrollmentError } = await supabase
          .from('session_enrollments')
          .insert(enrollments);

        if (enrollmentError) throw enrollmentError;

        // Update current participants count
        const { error: updateError } = await supabase
          .from('live_sessions')
          .update({ current_participants: data.selected_students.length })
          .eq('id', session.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Session Scheduled",
        description: "Your live session has been scheduled successfully.",
      });

      setIsDialogOpen(false);
      form.reset();
      await fetchLiveSessions(currentUser.id);
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to schedule session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16);
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
            <h1 className="text-3xl font-bold">Schedule Live Sessions</h1>
            <p className="text-muted-foreground">Create and manage live coaching sessions for your students</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule New Live Session</DialogTitle>
                <DialogDescription>
                  Create a live session for students in a specific learning path
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Session Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Advanced Trading Strategies Workshop" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="learning_path"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Path</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select learning path" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(LEARNING_PATH_DESCRIPTIONS).map(([level, description]) => (
                                <SelectItem key={level} value={level}>
                                  <div>
                                    <div className="font-medium capitalize">{level}</div>
                                    <div className="text-xs text-muted-foreground">{description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scheduled_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              min={formatDateTime(new Date())}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DURATION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Participants</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              placeholder="10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (USD)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="50.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what students will learn in this session..."
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Student Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Select Students (Optional)</FormLabel>
                      <Badge variant="outline">
                        {filteredStudents.length} students available for {watchedLearningPath} level
                      </Badge>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="selected_students"
                      render={() => (
                        <FormItem>
                          <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-3">
                            {filteredStudents.length > 0 ? (
                              filteredStudents.map((student) => (
                                <FormField
                                  key={student.id}
                                  control={form.control}
                                  name="selected_students"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={student.id}
                                        className="flex flex-row items-center space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(student.id)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...(field.value || []), student.id])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== student.id
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <div className="flex items-center gap-3 flex-1">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage 
                                              src={student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`} 
                                            />
                                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1">
                                            <div className="font-medium">{student.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {student.sessions_completed} sessions • {student.tokens_earned} tokens
                                            </div>
                                          </div>
                                          <Badge variant="outline" className="capitalize">
                                            {student.current_level}
                                          </Badge>
                                        </div>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))
                            ) : (
                              <div className="text-center py-4 text-muted-foreground">
                                No students found for {watchedLearningPath} level
                              </div>
                            )}
                          </div>
                          <FormDescription>
                            Leave empty to allow any student from the selected learning path to join
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Schedule Session
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
            <div className="text-2xl font-bold">{liveSessions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveSessions.filter(s => new Date(s.scheduled_time) > new Date()).length}
            </div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveSessions.reduce((sum, session) => sum + session.current_participants, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions by Learning Path */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
          <TabsTrigger value="beginner">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {["all", "beginner", "intermediate", "advanced"].map((level) => (
          <TabsContent key={level} value={level}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {level === "all" ? "All Live Sessions" : `${level.charAt(0).toUpperCase() + level.slice(1)} Sessions`}
                </CardTitle>
                <CardDescription>
                  {level === "all" 
                    ? "All your scheduled live sessions across all learning paths"
                    : `Live sessions for ${level} level students`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveSessions
                    .filter(session => level === "all" || session.learning_path === level)
                    .map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                            <Video className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{session.title}</div>
                            <div className="text-sm text-muted-foreground">{session.description}</div>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(session.scheduled_time).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(session.scheduled_time).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {session.current_participants}/{session.max_participants}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {session.learning_path}
                          </Badge>
                          <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                          <span className="font-medium">${session.price}</span>
                        </div>
                      </div>
                    ))}
                  
                  {liveSessions.filter(session => level === "all" || session.learning_path === level).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sessions scheduled for {level === "all" ? "any learning path" : `${level} level`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}