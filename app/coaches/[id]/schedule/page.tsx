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
  User,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const sessionRequestSchema = z.object({
  preferred_time: z.string().min(1, { message: "Please select a preferred time" }),
  duration: z.string().min(1, { message: "Please select duration" }),
  topic: z.string().min(5, { message: "Topic must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
  learning_goals: z.string().optional(),
});

type SessionRequestValues = z.infer<typeof sessionRequestSchema>;

interface CoachProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string;
  expertise_areas: string[];
  hourly_rate: number;
  rating: number;
  total_students: number;
  verification_status: string;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  is_recurring: boolean;
}

// ✅ Update interfaces to match schema structure
interface SessionRequest {
  id: string;
  student_id: string;
  coach_id: string;
  preferred_time: string;
  duration: number;
  topic: string;
  message: string;
  learning_goals: string | null;
  status: string;
  created_at: string;
  updated_at: string; // Add missing field from schema
  coach_response: string | null;
  student_profiles: {
    student_id: string;
    user_profiles: {
      prof_id: string;
      avatar_url: string | null;
      profiles: {
        name: string;
      };
    };
  };
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function CoachSchedulePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [coachId, setCoachId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SessionRequestValues>({
    resolver: zodResolver(sessionRequestSchema),
    defaultValues: {
      preferred_time: "",
      duration: "60",
      topic: "",
      message: "",
      learning_goals: "",
    },
  });

  useEffect(() => {
    async function initializePage() {
      try {
        const resolvedParams = await params;
        setCoachId(resolvedParams.id);
        await loadCoachData(resolvedParams.id);
      } catch (error) {
        console.error('Error initializing page:', error);
        router.push('/coaches');
      }
    }

    initializePage();
  }, [params, router, toast]);

// ✅ CORRECT - Check user role properly
async function loadCoachData(id: string) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      router.push('/sign-in');
      return;
    }

    // Check if user is a student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'student') {
      toast({
        title: "Access Denied",
        description: "Only students can view coach schedules.",
        variant: "destructive",
      });
      router.push('/dashboard');
      return;
    }

    setCurrentUser(user);
    await Promise.all([
      fetchCoachProfile(id),
      fetchCoachAvailability(id),
      fetchSessionRequests(user.id, id)
    ]);
  } catch (error: any) {
    console.error('Error loading coach data:', error);
    router.push('/coaches');
  } finally {
    setLoading(false);
  }
}

// ✅ CORRECT - Based on schema
async function fetchCoachProfile(id: string) {
  try {
    const { data: coachData, error: coachError } = await supabase
      .from('coach_profiles')
      .select(`
        *,
        user_profiles!inner(
          prof_id,
          bio,
          avatar_url,
          profiles!inner(
            id,
            name,
            email
          )
        )
      `)
      .eq('coach_id', id)
      .eq('verification_status', 'verified')
      .single();

    if (coachError) throw coachError;

    // Map the data correctly
    setCoach({
      id: coachData.coach_id,
      name: coachData.user_profiles.profiles.name,
      email: coachData.user_profiles.profiles.email,
      avatar_url: coachData.user_profiles.avatar_url,
      bio: coachData.user_profiles.bio,
      expertise_areas: coachData.expertise_areas,
      hourly_rate: coachData.hourly_rate,
      rating: coachData.rating,
      total_students: coachData.total_students,
      verification_status: coachData.verification_status,
    });
  } catch (error: any) {
    console.error('Error fetching coach profile:', error);
    // Error handling...
  }
}
  async function fetchCoachAvailability(id: string) {
    try {
      const { data, error } = await supabase
        .from('coach_availability')
        .select('*')
        .eq('coach_id', id)
        .eq('is_recurring', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error: any) {
      console.error('Error fetching availability:', error);
    }
  }

  async function fetchSessionRequests(studentId: string, coachId: string) {
    try {
      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          *,
          student:student_id (
            name,
            avatar_url
          )
        `)
        .eq('student_id', studentId)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessionRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching session requests:', error);
    }
  }

  async function onSubmit(data: SessionRequestValues) {
    if (!currentUser || !coach) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('session_requests')
        .insert({
          student_id: currentUser.id,
          coach_id: coach.id,
          preferred_time: new Date(data.preferred_time).toISOString(),
          duration: parseInt(data.duration),
          topic: data.topic,
          message: data.message,
          learning_goals: data.learning_goals || null,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: "Your session request has been sent to the coach for approval.",
      });

      setIsDialogOpen(false);
      form.reset();
      await fetchSessionRequests(currentUser.id, coachId);
    } catch (error: any) {
      console.error('Error submitting session request:', error);
      toast({
        title: "Error",
        description: "Failed to send session request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const getAvailabilityForDay = (dayIndex: number) => {
    return availability.filter(slot => slot.day_of_week === dayIndex && slot.status === 'available');
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) { // Show next 2 weeks
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateTime = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    return dateTime.toISOString().slice(0, 16);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'scheduled':
        return <Badge variant="default">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  if (!coach) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Coach Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested coach could not be found or is not verified.</p>
          <Button asChild>
            <Link href="/coaches">Browse Coaches</Link>
          </Button>
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
          <Link href={`/coaches/${coach.id}`}>
            <ChevronLeft className="h-4 w-4" />
            Back to Profile
          </Link>
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Schedule with {coach.name}</h1>
            <p className="text-muted-foreground">View availability and request coaching sessions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Request Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Request Coaching Session</DialogTitle>
                <DialogDescription>
                  Send a session request to {coach.name} for approval
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="preferred_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              min={new Date().toISOString().slice(0, 16)}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Choose a time within the coach's availability
                          </FormDescription>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Technical Analysis Basics" {...field} />
                        </FormControl>
                        <FormDescription>
                          What would you like to focus on in this session?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message to Coach</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell the coach about your current level, specific questions, or what you hope to achieve..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="learning_goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Goals (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What are your broader learning objectives?"
                            className="min-h-[60px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Estimated Cost:</span>
                      <span className="text-lg font-bold">
                        ${(coach.hourly_rate * (parseInt(form.watch("duration") || "60") / 60)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on ${coach.hourly_rate}/hour rate
                    </p>
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
                      disabled={submitting}
                      className="gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Request
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

      {/* Coach Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.id}`} 
              />
              <AvatarFallback className="text-xl">{coach.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-xl font-semibold">{coach.name}</h2>
                <Badge variant="default">Verified</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {coach.total_students} students
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {coach.rating}/5 rating
                </div>
                <div className="font-medium text-foreground">
                  ${coach.hourly_rate}/hour
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {coach.expertise_areas.map((area, index) => (
                  <Badge key={index} variant="outline">{area}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                {coach.name}'s regular coaching hours. Request a session during these times.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {DAYS_OF_WEEK.map((day, index) => {
                  const daySlots = getAvailabilityForDay(index);
                  return (
                    <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="font-medium w-24">{day}</div>
                      <div className="flex-1">
                        {daySlots.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {daySlots.map((slot, slotIndex) => (
                              <Badge key={slotIndex} variant="outline">
                                {slot.start_time} - {slot.end_time}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {availability.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No availability schedule set by the coach
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Session Requests</CardTitle>
              <CardDescription>
                Your session requests with {coach.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessionRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{request.topic}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(request.preferred_time).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(request.preferred_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <span>{request.duration} minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
                    
                    {request.coach_response && (
                      <div className="bg-muted p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage 
                              src={coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.id}`} 
                            />
                            <AvatarFallback className="text-xs">{coach.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{coach.name}</span>
                        </div>
                        <p className="text-sm">{request.coach_response}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {sessionRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No session requests yet. Request your first session above!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}