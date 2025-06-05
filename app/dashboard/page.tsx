"use client";

import { useState } from "react";
import { 
  CalendarDays, 
  Clock, 
  PieChart,
  ArrowUpRight,
  BarChart4,
  Wallet,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

// Mock data for student dashboard
const studentData = {
  upcomingSessions: [
    {
      id: "s1",
      coachName: "Sarah Johnson",
      coachImage: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg",
      date: "June 10, 2025",
      time: "10:00 AM",
      topic: "DeFi Fundamentals",
    },
    {
      id: "s2",
      coachName: "Mark Chen",
      coachImage: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
      date: "June 15, 2025",
      time: "2:00 PM",
      topic: "Security Best Practices",
    }
  ],
  learningProgress: {
    completedLessons: 12,
    totalLessons: 25,
    hours: 18,
    tokensEarned: 240,
    currentCourse: "DeFi Masterclass",
    nextLesson: "Yield Farming Strategies",
  },
  recentActivity: [
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
    },
  ]
};

// Mock data for coach dashboard
const coachData = {
  upcomingSessions: [
    {
      id: "s1",
      studentName: "Michael T.",
      studentImage: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
      date: "June 10, 2025",
      time: "10:00 AM",
      topic: "DeFi Fundamentals",
    },
    {
      id: "s2",
      studentName: "Jessica L.",
      studentImage: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      date: "June 11, 2025",
      time: "1:00 PM",
      topic: "NFT Market Analysis",
    },
    {
      id: "s3",
      studentName: "David W.",
      studentImage: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg",
      date: "June 12, 2025",
      time: "3:00 PM",
      topic: "Trading Basics",
    }
  ],
  earnings: {
    thisMonth: 1250,
    lastMonth: 980,
    total: 10540,
    sessionsThisMonth: 15,
    sessionsTotal: 124,
    monthlyData: [
      { name: "Jan", earnings: 680 },
      { name: "Feb", earnings: 720 },
      { name: "Mar", earnings: 880 },
      { name: "Apr", earnings: 950 },
      { name: "May", earnings: 980 },
      { name: "Jun", earnings: 1250 },
    ],
  },
  reviews: [
    {
      id: "r1",
      studentName: "Michael T.",
      studentImage: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
      rating: 5,
      date: "June 2, 2025",
      content: "Sarah's deep knowledge of DeFi protocols is incredible. She explained complex concepts in ways that finally clicked for me."
    },
    {
      id: "r2",
      studentName: "Jessica L.",
      studentImage: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      rating: 5,
      date: "May 28, 2025",
      content: "I was completely new to NFTs and wasn't sure where to start. Sarah created a personalized learning plan that helped me understand both the technology and the market."
    },
  ]
};

export default function Dashboard() {
  const [userRole, setUserRole] = useState<"student" | "coach">("student");

  // Switch between student and coach dashboards (this is just for demo purposes)
  const toggleUserRole = () => {
    setUserRole(prev => prev === "student" ? "coach" : "student");
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* This button is just for demo to toggle between student/coach views */}
        <Button variant="outline" onClick={toggleUserRole}>
          Switch to {userRole === "student" ? "Coach" : "Student"} View
        </Button>
      </div>

      {/* Student Dashboard */}
      {userRole === "student" && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">48%</div>
                <p className="text-xs text-muted-foreground">
                  {studentData.learningProgress.completedLessons} of {studentData.learningProgress.totalLessons} lessons completed
                </p>
                <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${(studentData.learningProgress.completedLessons / studentData.learningProgress.totalLessons) * 100}%` }}
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
                <div className="text-2xl font-bold">{studentData.learningProgress.hours} hrs</div>
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
                <div className="text-2xl font-bold">{studentData.learningProgress.tokensEarned}</div>
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
                <div className="text-lg font-bold line-clamp-1">{studentData.learningProgress.currentCourse}</div>
                <p className="text-xs text-muted-foreground">
                  Next: {studentData.learningProgress.nextLesson}
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
                {studentData.upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {studentData.upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={session.coachImage} alt={session.coachName} />
                            <AvatarFallback>{session.coachName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{session.coachName}</div>
                            <div className="text-sm text-muted-foreground">{session.topic}</div>
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
                  {studentData.recentActivity.map((activity) => (
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
        </>
      )}

      {/* Coach Dashboard */}
      {userRole === "coach" && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Earnings This Month</CardTitle>
                <BarChart4 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${coachData.earnings.thisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  From {coachData.earnings.sessionsThisMonth} sessions
                </p>
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className={`inline-flex items-center ${
                    coachData.earnings.thisMonth > coachData.earnings.lastMonth 
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}>
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {(((coachData.earnings.thisMonth - coachData.earnings.lastMonth) / coachData.earnings.lastMonth) * 100).toFixed(1)}% from last month
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
                <div className="text-2xl font-bold">${coachData.earnings.total}</div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{coachData.earnings.sessionsTotal}</div>
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
                <div className="text-2xl font-bold">4.9</div>
                <div className="flex mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {coachData.earnings.sessionsTotal} sessions
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
                    data={coachData.earnings.monthlyData}
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
                  {coachData.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.studentImage} alt={review.studentName} />
                            <AvatarFallback>{review.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{review.studentName}</div>
                            <div className="text-xs text-muted-foreground">{review.date}</div>
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
                {coachData.upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {coachData.upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={session.studentImage} alt={session.studentName} />
                            <AvatarFallback>{session.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{session.studentName}</div>
                            <div className="text-sm text-muted-foreground">{session.topic}</div>
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
        </>
      )}
    </div>
  );
}