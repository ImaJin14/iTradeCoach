"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronLeft, 
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  UserX,
  Star
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Coach {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  subscription_status: string | null;
  verification_status: string;
  rating: number | null;
  total_students: number | null;
  earnings: number | null;
  hourly_rate: number | null;
  expertise_areas: string[] | null;
  bio: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  website?: string | null;
  total_sessions?: number | null;
  total_live_sessions?: number | null;
  enrolled_students?: number | null;
  subscription_active?: boolean | null;
}

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
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

        await fetchCoaches();
      } catch (error: any) {
        console.error('Error checking admin access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAccess();
  }, [router, toast]);

  async function fetchCoaches() {
    try {
      // Use the coach_statistics view which already has aggregated data
      const { data: coachStatsData, error: coachStatsError } = await supabase
        .from('coach_statistics')
        .select('*')
        .order('coach_id');
  
      if (coachStatsError) throw coachStatsError;

      // Filter out null coach_ids and create array of strings
      const coachIds = coachStatsData?.map(coach => coach.coach_id).filter((id): id is string => id !== null) || [];
  
      // Fetch additional profile and user profile data
      const [profilesResult, userProfilesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, email, subscription_status, created_at')
          .in('id', coachIds),
        supabase
          .from('user_profiles')
          .select('prof_id, avatar_url, bio, linkedin, twitter, website, created_at')
          .in('prof_id', coachIds)
      ]);
  
      if (profilesResult.error) throw profilesResult.error;
      if (userProfilesResult.error) throw userProfilesResult.error;
  
      // Create lookup maps
      const profilesMap = profilesResult.data?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};
  
      const userProfilesMap = userProfilesResult.data?.reduce((acc, userProfile) => {
        acc[userProfile.prof_id] = userProfile;
        return acc;
      }, {} as Record<string, any>) || {};
  
      // Transform and combine the data
      const transformedCoaches = coachStatsData?.map(coachStats => {
        const profile = profilesMap[coachStats.coach_id!];
        const userProfile = userProfilesMap[coachStats.coach_id!];
        
        return {
          id: coachStats.coach_id!,
          name: coachStats.name || profile?.name || 'Unknown',
          email: profile?.email || '',
          avatar_url: userProfile?.avatar_url || null,
          created_at: profile?.created_at || userProfile?.created_at,
          subscription_status: profile?.subscription_status || null,
          verification_status: coachStats.verification_status || 'pending',
          rating: coachStats.rating,
          total_students: coachStats.total_students,
          earnings: coachStats.earnings,
          hourly_rate: coachStats.hourly_rate,
          expertise_areas: [], // This field is not in the view, you might need to fetch it separately if needed
          bio: userProfile?.bio || null,
          linkedin: userProfile?.linkedin,
          twitter: userProfile?.twitter,
          website: userProfile?.website,
          // Additional stats from the view
          total_sessions: coachStats.total_sessions,
          total_live_sessions: coachStats.total_live_sessions,
          enrolled_students: coachStats.enrolled_students,
          subscription_active: coachStats.subscription_active
        };
      }) || [];
  
      setCoaches(transformedCoaches);
    } catch (error: any) {
      console.error('Error fetching coaches:', error);
      toast({
        title: "Error",
        description: "Failed to load coaches. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleSuspendCoach(coachId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'suspended' })
        .eq('id', coachId);

      if (error) throw error;

      toast({
        title: "Coach Suspended",
        description: "The coach has been suspended successfully.",
      });

      await fetchCoaches(); // Refresh data
    } catch (error: any) {
      console.error('Error suspending coach:', error);
      toast({
        title: "Error",
        description: "Failed to suspend coach. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleBanCoach(coachId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'banned' })
        .eq('id', coachId);

      if (error) throw error;

      toast({
        title: "Coach Banned",
        description: "The coach has been banned from the platform.",
      });

      await fetchCoaches(); // Refresh data
    } catch (error: any) {
      console.error('Error banning coach:', error);
      toast({
        title: "Error",
        description: "Failed to ban coach. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteCoach(coachId: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', coachId);

      if (error) throw error;

      toast({
        title: "Coach Deleted",
        description: "The coach has been permanently deleted from the platform.",
      });

      await fetchCoaches(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting coach:', error);
      toast({
        title: "Error",
        description: "Failed to delete coach. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleVerifyCoach(coachId: string) {
    try {
      const { error } = await supabase
        .from('coach_profiles')
        .update({ verification_status: 'verified' })
        .eq('user_id', coachId);

      if (error) throw error;

      toast({
        title: "Coach Verified",
        description: "The coach has been verified successfully.",
      });

      await fetchCoaches(); // Refresh data
    } catch (error: any) {
      console.error('Error verifying coach:', error);
      toast({
        title: "Error",
        description: "Failed to verify coach. Please try again.",
        variant: "destructive",
      });
    }
  }

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = 
      coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coach.expertise_areas && coach.expertise_areas.some(area => area.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesVerification = verificationFilter === "all" || coach.verification_status === verificationFilter;
    const matchesSubscription = subscriptionFilter === "all" || coach.subscription_status === subscriptionFilter;
    
    return matchesSearch && matchesVerification && matchesSubscription;
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
            <h1 className="text-3xl font-bold">Manage Coaches</h1>
            <p className="text-muted-foreground">Manage all coaches on the platform</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coaches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coaches.filter(c => c.verification_status === 'verified').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coaches.filter(c => c.verification_status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${coaches.reduce((sum, coach) => sum + (coach.earnings || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coaches by name, email, or expertise..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Verification status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Subscription status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subscriptions</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="none">No Subscription</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coaches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coaches</CardTitle>
          <CardDescription>
            Complete list of all coaches on the platform with management capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coach</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={coach.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.id}`} 
                        />
                        <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{coach.name}</div>
                        <div className="text-sm text-muted-foreground">{coach.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(coach.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={coach.verification_status === 'verified' ? 'default' : 
                               coach.verification_status === 'pending' ? 'secondary' : 'destructive'}
                    >
                      {coach.verification_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{coach.rating || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{coach.total_students || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${coach.earnings || 0}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${coach.hourly_rate || 0}/hr</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {coach.expertise_areas && coach.expertise_areas.length > 0 ? (
                        <>
                          {coach.expertise_areas.slice(0, 2).map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {coach.expertise_areas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{coach.expertise_areas.length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          No expertise listed
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/profile/${coach.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        {coach.verification_status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleVerifyCoach(coach.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verify Coach
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleSuspendCoach(coach.id)}
                          className="text-orange-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend Coach
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleBanCoach(coach.id)}
                          className="text-red-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Ban Coach
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Coach
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Coach Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {coach.name} from the platform and 
                                cancel all their scheduled sessions. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteCoach(coach.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Coach
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredCoaches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No coaches found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}