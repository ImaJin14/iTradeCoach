"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  Star,
  MessageCircle, 
  Users, 
  Award, 
  CheckCircle, 
  ChevronLeft, 
  Database,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

// Updated interface to match your actual database schema
interface CoachProfile {
  // Basic user info
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  // User profile info
  avatar_url: string | null;
  bio: string | null;
  profile_complete: boolean;
  created_at: string;
  // Coach-specific info
  expertise_areas: string[] | null;
  hourly_rate: number | null;
  video_intro_url: string | null; 
  verification_status: "pending" | "verified" | "rejected" | null;
  algorand_wallet: string | null;
  rating: number | null;
  total_students: number | null;
  earnings: number | null;
  subscription_active: boolean | null;
}

interface Review {
  id: string;
  text: string;
  author_name: string;
  author_title: string;
  rating: number;
  approved: boolean;
  created_at: string;
  author_avatar: string | null;
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

interface SessionStats {
  total_sessions: number;
  completed_sessions: number;
  avg_rating: number;
}

interface CoachProfileContentProps {
  coachId: string;
}

export default function CoachProfileContent({ coachId }: CoachProfileContentProps) {
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    async function fetchCoachData() {
      try {
        setLoading(true);
        console.log('=== STARTING COACH DATA FETCH ===');
        console.log('Coach ID:', coachId);
        
        const debug: any = {
          coachId,
          timestamp: new Date().toISOString(),
          steps: {}
        };

        // Test database connection first
        console.log('Testing database connection...');
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        debug.steps.connectionTest = { 
          success: !testError, 
          error: testError ? JSON.stringify(testError) : null,
          data: testData
        };
        
        if (testError) {
          console.error('Database connection test failed:', testError);
          throw new Error(`Database connection failed: ${JSON.stringify(testError)}`);
        }
        
        console.log('Database connection successful');
        
        // Step 1: Get basic user info from profiles table
        console.log('Step 1: Fetching basic profile...');
        const { data: userdata, error: userError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('id', coachId)
          .maybeSingle();

        debug.steps.basicProfile = {
          query: `profiles.select('id, name, email, role').eq('id', '${coachId}')`,
          success: !userError,
          error: userError ? JSON.stringify(userError) : null,
          data: userdata,
          dataExists: !!userdata
        };

        console.log('Basic profile result:', { userdata, userError });

        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error(`Profile query failed: ${JSON.stringify(userError)}`);
        }

        if (!userdata) {
          throw new Error('Coach profile not found in profiles table');
        }

        if (userdata.role !== 'coach') {
          throw new Error(`User is not a coach, role is: ${userdata.role}`);
        }

        // Step 2: Get coach profile with user profile data using JOIN (IMPROVED)
        console.log('Step 2: Fetching coach profile with user profile data...');
        const { data: combinedCoachData, error: combinedError } = await supabase
          .from('coach_profiles')
          .select(`
            expertise_areas,
            hourly_rate,
            video_intro_url,
            verification_status,
            algorand_wallet,
            rating,
            total_students,
            earnings,
            subscription_active,
            user_profiles (
              avatar_url,
              bio,
              profile_complete,
              created_at,
              updated_at
            )
          `)
          .eq('coach_id', coachId)
          .maybeSingle();

        debug.steps.combinedCoachProfile = {
          query: `coach_profiles.select(...with user_profiles join).eq('coach_id', '${coachId}')`,
          success: !combinedError,
          error: combinedError ? JSON.stringify(combinedError) : null,
          data: combinedCoachData,
          dataExists: !!combinedCoachData,
          userProfileJoined: !!(combinedCoachData?.user_profiles)
        };

        console.log('Combined coach profile result:', { combinedCoachData, combinedError });

        if (combinedError) {
          console.error('Error fetching combined coach profile:', combinedError);
          throw new Error(`Combined coach profile query failed: ${JSON.stringify(combinedError)}`);
        }

        if (!combinedCoachData) {
          throw new Error('Coach profile not found in coach_profiles table');
        }

        // Extract user profile data from the join
        const userProfile = combinedCoachData.user_profiles;

        // Combine all the data
        console.log('Step 3: Combining data...');
        const combinedProfile: CoachProfile = {
          // Basic user info
          id: userdata.id,
          name: userdata.name,
          email: userdata.email,
          role: userdata.role,
          // User profile info (from JOIN)
          avatar_url: userProfile?.avatar_url || null,
          bio: userProfile?.bio || null,
          profile_complete: userProfile?.profile_complete || false,
          created_at: userProfile?.created_at || new Date().toISOString(),
          // Coach-specific info
          expertise_areas: combinedCoachData.expertise_areas,
          hourly_rate: combinedCoachData.hourly_rate,
          video_intro_url: combinedCoachData.video_intro_url,
          verification_status: combinedCoachData.verification_status,
          algorand_wallet: combinedCoachData.algorand_wallet,
          rating: combinedCoachData.rating,
          total_students: combinedCoachData.total_students,
          earnings: combinedCoachData.earnings,
          subscription_active: combinedCoachData.subscription_active,
        };

        console.log('=== DATA COMBINATION DEBUG ===');
        console.log('User profile from JOIN:', userProfile);
        console.log('Final combined avatar_url:', combinedProfile.avatar_url);
        console.log('Final combined bio:', combinedProfile.bio);

        debug.steps.finalProfile = {
          success: true,
          data: combinedProfile,
          joinWorked: !!userProfile,
          avatarSource: userProfile?.avatar_url ? 'user_profiles_join' : 'none',
          bioSource: userProfile?.bio ? 'user_profiles_join' : 'none'
        };

        console.log('Final combined profile:', combinedProfile);
        setCoach(combinedProfile);

        // Store debug info
        setDebugInfo(debug);

        // Fetch additional data (non-blocking)
        console.log('Fetching additional data...');
        await Promise.all([
          fetchTestimonials(coachId).catch(e => console.log('Testimonials fetch failed:', e)),
          fetchAvailability(coachId).catch(e => console.log('Availability fetch failed:', e)),
          fetchSessionStats(coachId, combinedProfile).catch(e => console.log('Session stats fetch failed:', e))
        ]);

      } catch (err: any) {
        console.error('=== FETCH ERROR ===');
        console.error('Error type:', typeof err);
        console.error('Error message:', err?.message);
        console.error('Error stack:', err?.stack);
        console.error('Full error object:', err);
        console.error('Error JSON:', JSON.stringify(err, null, 2));
        
        setError(err?.message || 'An unexpected error occurred');
        setDebugInfo((prev: any) => ({ ...prev, finalError: err }));
      } finally {
        setLoading(false);
        console.log('=== FETCH COMPLETE ===');
      }
    }

    async function fetchTestimonials(safeCoachId: string) {
      try {
        console.log('Fetching testimonials...');
        // Simplified testimonials fetch for now
        setReviews([]);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      }
    }

    async function fetchAvailability(safeCoachId: string) {
      try {
        console.log('Fetching availability...');
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('coach_availability')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            status,
            notes
          `)
          .eq('coach_id', safeCoachId)
          .eq('status', 'available')
          .order('day_of_week', { ascending: true });

        if (availabilityError) {
          console.error('Error fetching availability:', availabilityError);
          return;
        }

        if (availabilityData) {
          setAvailability(availabilityData);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      }
    }

    async function fetchSessionStats(safeCoachId: string, currentCoachData: CoachProfile) {
      try {
        console.log('Fetching session stats...');
        setSessionStats({
          total_sessions: 0,
          completed_sessions: 0,
          avg_rating: currentCoachData.rating || 0
        });
      } catch (error) {
        console.error('Error fetching session stats:', error);
      }
    }

    if (coachId) {
      fetchCoachData();
    }
  }, [coachId]);

  // Helper function to convert day number to day name
  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading coach profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Coach Profile Error
          </h1>
          <p className="text-muted-foreground mb-4">{error || "Coach not found"}</p>
          <Button asChild>
            <Link href="/coaches">Back to Coaches</Link>
          </Button>
        </div>

        {/* Debug Information */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Debug Information
            </CardTitle>
            <CardDescription>
              Technical details for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Coach ID</h3>
                <code className="bg-muted p-2 rounded text-sm block">{coachId}</code>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Coach Data</h3>
                <div className="bg-muted p-4 rounded text-sm space-y-2">
                  <div><strong>Name:</strong> {coach?.name || 'N/A'}</div>
                  <div><strong>Email:</strong> {coach?.email || 'N/A'}</div>
                  <div><strong>Role:</strong> {coach?.role || 'N/A'}</div>
                  <div><strong>Avatar URL:</strong> {coach?.avatar_url ? (
                    <a href={coach.avatar_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">
                      {coach.avatar_url}
                    </a>
                  ) : 'None'}</div>
                  <div><strong>Bio:</strong> {coach?.bio || 'None'}</div>
                  <div><strong>JOIN Worked:</strong> {coach ? (debugInfo.steps?.combinedCoachProfile?.userProfileJoined ? 'Yes' : 'No') : 'N/A'}</div>
                  <div><strong>Avatar Source:</strong> {coach ? (debugInfo.steps?.finalProfile?.avatarSource || 'none') : 'N/A'}</div>
                  <div><strong>Bio Source:</strong> {coach ? (debugInfo.steps?.finalProfile?.bioSource || 'none') : 'N/A'}</div>
                  <div><strong>Verification:</strong> {coach?.verification_status || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Query Results</h3>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium mb-2">Troubleshooting Steps</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Check if the coach ID exists in the profiles table</li>
                  <li>Verify the user has role='coach' in profiles table</li>
                  <li>Check if coach_profiles record exists for this ID</li>
                  <li>Verify the JOIN between coach_profiles and user_profiles works</li>
                  <li>Check if user_profiles.prof_id matches coach_profiles.coach_id</li>
                  <li>Verify RLS policies allow reading these tables</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coachName = coach.name || 'Unknown Coach';

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link href="/coaches" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to coaches
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - Coach info */}
        <div className="md:col-span-2">
          <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
            <div className="relative">
              <div className="relative rounded-md overflow-hidden h-40 w-40 md:h-48 md:w-48 bg-muted border">
                {coach.avatar_url ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={coach.avatar_url} 
                      alt={coachName} 
                      fill 
                      className="object-cover"
                      onError={(e) => {
                        console.error('Image failed to load:', coach.avatar_url);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', coach.avatar_url);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {coachName.charAt(0)}
                    </span>
                  </div>
                )}

              </div>
              {coach.verification_status === 'verified' && (
                <Badge className="absolute bottom-2 right-2 bg-primary text-primary-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{coachName}</h1>
              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{(coach.rating || 0).toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">
                  ({coach.total_students || 0} {(coach.total_students || 0) === 1 ? 'student' : 'students'})
                </span>
                <Badge variant="outline" className="ml-4">${coach.hourly_rate || 0}/hr</Badge>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {coach.expertise_areas?.map(area => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                )) || []}
              </div>
              
              <p className="text-muted-foreground">{coach.bio || 'No bio available.'}</p>
            </div>
          </div>
          
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Award className="h-5 w-5 mr-2 text-primary" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Expertise in {coach.expertise_areas?.join(', ') || 'Various areas'}</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>{coach.total_students || 0} students taught</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Member since {new Date(coach.created_at).getFullYear()}</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>
                          {coach.verification_status === 'verified' 
                            ? 'Verified Coach' 
                            : 'Verification Pending'
                          }
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Teaching Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Personalized learning plans for each student</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Practical, hands-on approach with real examples</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Focus on fundamentals before advanced concepts</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Continuous support and feedback</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No reviews yet. Be the first to book a session!</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="availability" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                  <CardDescription>
                    {coachName}'s regular availability each week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availability.length > 0 ? (
                    <ul className="space-y-3">
                      {availability.map((slot) => (
                        <li key={slot.id} className="flex items-center p-2 rounded-md border bg-background">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium w-24">{getDayName(slot.day_of_week)}:</span>
                          <span className="text-muted-foreground">
                            {slot.start_time} - {slot.end_time}
                          </span>
                          {slot.notes && (
                            <span className="text-xs text-muted-foreground ml-2">({slot.notes})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No availability schedule set. Contact the coach to arrange a session.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - Booking */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Book a Session</CardTitle>
              <CardDescription>
                Select a date and time for your coaching session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coach.subscription_active ? (
                  <Button className="w-full" asChild>
                    <Link href={`/coaches/${coach.id}/schedule`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      View Schedule & Request Session
                    </Link>
                  </Button>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground text-center">
                      This coach is currently unavailable for new bookings.
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Session Length</span>
                  </div>
                  <span className="font-medium">60 minutes</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Session Type</span>
                  </div>
                  <span className="font-medium">1-on-1 Video</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Rate</span>
                  </div>
                  <span className="font-medium">${coach.hourly_rate || 0}/hour</span>
                </div>
              </div>
              
              <div className="border-t my-4 pt-4">
                <h3 className="font-medium mb-2">What You'll Get</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span className="text-sm">Personalized coaching tailored to your needs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span className="text-sm">Expert guidance in {coach.expertise_areas?.join(', ') || 'various areas'}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span className="text-sm">Follow-up resources and materials</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span className="text-sm">Professional learning experience</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}