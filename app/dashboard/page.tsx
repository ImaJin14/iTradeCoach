"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CalendarDays, 
  Clock, 
  PieChart,
  ArrowUpRight,
  BarChart4,
  Wallet,
  BookOpen,
  ArrowRight,
  Star,
  MessageCircle,
  Users,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"student" | "coach" | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Get user profile including role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setUserRole(profile.role);

        // Fetch role-specific data
        if (profile.role === 'student') {
          // First get student profile
          const { data: studentProfile, error: studentError } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (studentError) throw studentError;

          // Then fetch sessions separately
          const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select(`
              *,
              coach:profiles!coach_id(
                name,
                avatar_url
              )
            `)
            .eq('student_id', user.id);

          if (sessionsError) throw sessionsError;

          setUserData({
            ...studentProfile,
            sessions
          });

        } else if (profile.role === 'coach') {
          // First get coach profile
          const { data: coachProfile, error: coachError } = await supabase
            .from('coach_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (coachError) throw coachError;

          // Then fetch sessions separately
          const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select(`
              *,
              student:profiles!student_id(
                name,
                avatar_url
              )
            `)
            .eq('coach_id', user.id);

          if (sessionsError) throw sessionsError;

          setUserData({
            ...coachProfile,
            sessions
          });
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router, toast]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  if (userRole === "student") {
    return (
      <div className="container py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48%</div>
              <p className="text-xs text-muted-foreground">
                12 of 25 lessons completed
              </p>
              <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: "48%" }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18 hrs</div>
              <p className="text-xs text-muted-foreground">
                Total coaching time
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="text-green-500 inline-flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +2 hrs last week
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Tokens</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">240</div>
              <p className="text-xs text-muted-foreground">
                Tokens earned from learning
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                <Link href="/rewards" className="text-primary inline-flex items-center hover:underline">
                  View rewards
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Course</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold line-clamp-1">DeFi Masterclass</div>
              <p className="text-xs text-muted-foreground">
                Next: Yield Farming Strategies
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                <Link href="/courses" className="text-primary inline-flex items-center hover:underline">
                  Continue learning
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                Your scheduled coaching sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.sessions?.length > 0 ? (
                <div className="space-y-4">
                  {userData.sessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={session.coach?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.coach_id}`} alt={session.coach?.name} />
                          <AvatarFallback>{session.coach?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{session.coach?.name}</div>
                          <div className="text-sm text-muted-foreground">{session.topic}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center mb-1">
                          <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm">{new Date(session.scheduled_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-sm">{new Date(session.scheduled_time).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No upcoming sessions</p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/coaches">Find a Coach</Link>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/sessions">View All Sessions</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest learning activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: "a1",
                    type: "session_completed",
                    date: "June 2, 2025",
                    description: "Completed session with Sarah Johnson"
                  },
                  {
                    id: "a2",
                    type: "quiz_completed",
                    date: "May 30, 2025",
                    description: "Passed 'Crypto Security Basics' quiz"
                  },
                  {
                    id: "a3",
                    type: "lesson_completed",
                    date: "May 28, 2025",
                    description: "Completed lesson: 'Introduction to DeFi'"
                  }
                ].map((activity) => (
                  <div key={activity.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium">{activity.description}</div>
                      <Badge variant="outline" className="text-xs font-normal">
                        {activity.type === "session_completed" ? "Session" : 
                         activity.type === "quiz_completed" ? "Quiz" : "Lesson"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{activity.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/activity">View All Activity</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Coach Dashboard
  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings This Month</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userData?.earnings_this_month || 0}</div>
            <p className="text-xs text-muted-foreground">
              From {userData?.sessions_this_month || 0} sessions
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="text-green-500 inline-flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +20% from last month
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${userData?.earnings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime earnings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.total_students || 0}</div>
            <p className="text-xs text-muted-foreground">
              Completed sessions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userData?.rating || 0}</div>
            <div className="flex mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < (userData?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {userData?.total_students || 0} sessions
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>
                  Your earnings for the past 6 months
                </CardDescription>
              </div>
              <Select defaultValue="6months">
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Jan", earnings: 680 },
                  { name: "Feb", earnings: 720 },
                  { name: "Mar", earnings: 880 },
                  { name: "Apr", earnings: 950 },
                  { name: "May", earnings: 980 },
                  { name: "Jun", earnings: 1250 },
                ]}
                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                <Bar 
                  dataKey="earnings" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>
              Latest feedback from your students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: "r1",
                  studentName: "Michael T.",
                  studentImage: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
                  rating: 5,
                  date: "2023-12-10",
                  content: "Sarah's deep knowledge of DeFi protocols is incredible. She explained complex concepts in ways that finally clicked for me."
                },
                {
                  id: "r2",
                  studentName: "Jessica L.",
                  studentImage: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
                  rating: 5,
                  date: "2023-11-28",
                  content: "I was completely new to NFTs and wasn't sure where to start. Sarah created a personalized learning plan that helped me understand both the technology and the market."
                }
              ].map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={review.studentImage} alt={review.studentName} />
                        <AvatarFallback>{review.studentName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{review.studentName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(review.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{review.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/reviews">View All Reviews</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Your scheduled coaching sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userData?.sessions?.length > 0 ? (
              <div className="space-y-4">
                {userData.sessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={session.student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.student_id}`} alt={session.student?.name} />
                        <AvatarFallback>{session.student?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{session.student?.name}</div>
                        <div className="text-sm text-muted-foreground">{session.topic}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center mb-1">
                        <CalendarDays className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">{new Date(session.scheduled_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">{new Date(session.scheduled_time).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Prepare
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No upcoming sessions</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild variant="outline">
              <Link href="/sessions">View All Sessions</Link>
            </Button>
            <Button asChild>
              <Link href="/availability">Manage Availability</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}