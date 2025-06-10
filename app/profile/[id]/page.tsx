"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Mail, Calendar, MapPin, Globe, Twitter, Linkedin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  linkedin: string | null;
  avatar_url: string | null;
  created_at: string;
  subscription_status: string;
  profile_complete: boolean;
}

interface CoachProfile extends UserProfile {
  verification_status: string;
  rating: number;
  total_students: number;
  earnings: number;
  hourly_rate: number;
  expertise_areas: string[];
}

interface StudentProfile extends UserProfile {
  current_level: string;
  tokens_earned: number;
  courses_completed: string[];
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profile, setProfile] = useState<UserProfile | CoachProfile | StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function initializeComponent() {
      // Await the params Promise
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
    }

    initializeComponent();
  }, [params]);

  useEffect(() => {
    if (!userId) return; // Wait for userId to be set

    async function checkAccessAndLoadProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/sign-in');
          return;
        }

        // Check if current user is admin
        const { data: currentProfile, error: currentProfileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (currentProfileError || !currentProfile || currentProfile.role !== 'admin') {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view user profiles.",
            variant: "destructive",
          });
          router.push('/dashboard');
          return;
        }

        setCurrentUser(currentProfile);
        await loadUserProfile();
      } catch (error: any) {
        console.error('Error checking access:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    async function loadUserProfile() {
      try {
        // Get basic profile
        const { data: basicProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        let extendedProfile = basicProfile;

        // Get role-specific data
        if (basicProfile.role === 'coach') {
          const { data: coachData, error: coachError } = await supabase
            .from('coach_profiles')
            .select('*')
            .eq('coach_id', userId)
            .single();

          if (coachError) throw coachError;

          extendedProfile = {
            ...basicProfile,
            ...coachData
          };
        } else if (basicProfile.role === 'student') {
          const { data: studentData, error: studentError } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('student_id', userId)
            .single();

          if (studentError) throw studentError;

          extendedProfile = {
            ...basicProfile,
            ...studentData
          };
        }

        setProfile(extendedProfile);
      } catch (error: any) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
          variant: "destructive",
        });
      }
    }

    checkAccessAndLoadProfile();
  }, [userId, router, toast]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested user profile could not be found.</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCoach = profile.role === 'coach';
  const isStudent = profile.role === 'student';

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
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Overview */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                />
                <AvatarFallback className="text-2xl">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{profile.name}</CardTitle>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                {profile.role}
              </Badge>
              <Badge variant={profile.subscription_status === 'active' ? 'default' : 'outline'}>
                {profile.subscription_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            {profile.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Website
                </a>
              </div>
            )}
            {profile.twitter && (
              <div className="flex items-center gap-2 text-sm">
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <span>{profile.twitter}</span>
              </div>
            )}
            {profile.linkedin && (
              <div className="flex items-center gap-2 text-sm">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  LinkedIn
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profile.bio || "No bio provided."}
              </p>
            </CardContent>
          </Card>

          {/* Role-specific information */}
          {isCoach && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Coach Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Verification</div>
                      <Badge variant={(profile as CoachProfile).verification_status === 'verified' ? 'default' : 'outline'}>
                        {(profile as CoachProfile).verification_status}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                      <div className="font-medium">{(profile as CoachProfile).rating}/5</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Students</div>
                      <div className="font-medium">{(profile as CoachProfile).total_students}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Hourly Rate</div>
                      <div className="font-medium">${(profile as CoachProfile).hourly_rate}/hr</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Expertise Areas</div>
                    <div className="flex flex-wrap gap-2">
                      {(profile as CoachProfile).expertise_areas?.map((area, index) => (
                        <Badge key={index} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                    <div className="text-2xl font-bold">${(profile as CoachProfile).earnings}</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Level</div>
                    <Badge variant="outline" className="capitalize">
                      {(profile as StudentProfile).current_level}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tokens Earned</div>
                    <div className="font-medium">{(profile as StudentProfile).tokens_earned}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Courses Completed</div>
                    <div className="font-medium">{(profile as StudentProfile).courses_completed?.length || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Profile Complete</div>
                  <Badge variant={profile.profile_complete ? 'default' : 'outline'}>
                    {profile.profile_complete ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Subscription Status</div>
                  <Badge variant={profile.subscription_status === 'active' ? 'default' : 'outline'}>
                    {profile.subscription_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}