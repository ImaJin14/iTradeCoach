"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Check,
  X,
  Search,
  Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  coach_response: string | null;
  student: {
    name: string;
    avatar_url: string | null;
    email: string;
  };
}

export default function SessionRequestsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<SessionRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [responding, setResponding] = useState(false);
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
            description: "You need an active subscription to manage session requests.",
            variant: "destructive",
          });
          router.push('/pricing');
          return;
        }

        setCurrentUser(user);
        await fetchSessionRequests(user.id);
      } catch (error: any) {
        console.error('Error checking coach access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkCoachAccess();
  }, [router, toast]);

  async function fetchSessionRequests(coachId: string) {
    try {
      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          *,
          student:student_id (
            name,
            avatar_url,
            email
          )
        `)
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessionRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching session requests:', error);
      toast({
        title: "Error",
        description: "Failed to load session requests. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleRequestResponse(requestId: string, status: 'approved' | 'rejected', response: string) {
    setResponding(true);
    try {
      const { error } = await supabase
        .from('session_requests')
        .update({
          status,
          coach_response: response,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, create a session
      if (status === 'approved' && selectedRequest) {
        const { error: sessionError } = await supabase
          .from('sessions')
          .insert({
            coach_id: currentUser.id,
            student_id: selectedRequest.student_id,
            scheduled_time: selectedRequest.preferred_time,
            duration: selectedRequest.duration,
            status: 'scheduled',
            price: 0, // Will be calculated based on coach's hourly rate
            notes: selectedRequest.topic,
            created_at: new Date().toISOString()
          });

        if (sessionError) throw sessionError;

        // Update request status to scheduled
        await supabase
          .from('session_requests')
          .update({ status: 'scheduled' })
          .eq('id', requestId);
      }

      toast({
        title: status === 'approved' ? "Request Approved" : "Request Rejected",
        description: status === 'approved' 
          ? "The session has been scheduled and the student has been notified."
          : "The student has been notified of your response.",
      });

      setIsResponseDialogOpen(false);
      setSelectedRequest(null);
      setResponseMessage("");
      await fetchSessionRequests(currentUser.id);
    } catch (error: any) {
      console.error('Error responding to request:', error);
      toast({
        title: "Error",
        description: "Failed to respond to request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  }

  const filteredRequests = sessionRequests.filter(request => {
    const matchesSearch = 
      request.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
            <h1 className="text-3xl font-bold">Session Requests</h1>
            <p className="text-muted-foreground">Manage incoming session requests from students</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionRequests.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionRequests.filter(r => r.status === 'approved' || r.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionRequests.filter(r => {
                const requestDate = new Date(r.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return requestDate > weekAgo;
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
            placeholder="Search by student name, topic, or message..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
        </TabsList>

        {["all", "pending", "approved"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {tab === "all" ? "All Session Requests" : 
                   tab === "pending" ? "Pending Requests" : "Approved Requests"}
                </CardTitle>
                <CardDescription>
                  {tab === "all" ? "All session requests from students" :
                   tab === "pending" ? "Requests awaiting your response" :
                   "Approved and scheduled sessions"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequests
                    .filter(request => tab === "all" || 
                      (tab === "pending" && request.status === "pending") ||
                      (tab === "approved" && (request.status === "approved" || request.status === "scheduled")))
                    .map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={request.student.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.student_id}`} 
                              />
                              <AvatarFallback>{request.student.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{request.student.name}</h3>
                              <p className="text-sm text-muted-foreground">{request.student.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.status)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="font-medium mb-1">{request.topic}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                          <p className="text-sm text-muted-foreground">{request.message}</p>
                          {request.learning_goals && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">Learning Goals: </span>
                              <span className="text-sm text-muted-foreground">{request.learning_goals}</span>
                            </div>
                          )}
                        </div>
                        
                        {request.coach_response && (
                          <div className="bg-muted p-3 rounded-md mb-3">
                            <div className="text-sm font-medium mb-1">Your Response:</div>
                            <p className="text-sm">{request.coach_response}</p>
                          </div>
                        )}
                        
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setResponseMessage("");
                                setIsResponseDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Respond
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {filteredRequests
                    .filter(request => tab === "all" || 
                      (tab === "pending" && request.status === "pending") ||
                      (tab === "approved" && (request.status === "approved" || request.status === "scheduled")))
                    .length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No {tab === "all" ? "" : tab} requests found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Session Request</DialogTitle>
            <DialogDescription>
              {selectedRequest && `Respond to ${selectedRequest.student.name}'s request for "${selectedRequest.topic}"`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Response Message</label>
              <Textarea
                placeholder="Write your response to the student..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResponseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && handleRequestResponse(selectedRequest.id, 'rejected', responseMessage)}
              disabled={responding || !responseMessage.trim()}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={() => selectedRequest && handleRequestResponse(selectedRequest.id, 'approved', responseMessage)}
              disabled={responding || !responseMessage.trim()}
              className="gap-2"
            >
              {responding ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}