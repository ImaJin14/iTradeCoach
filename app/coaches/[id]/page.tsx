"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Star,
  MessageCircle, 
  Users, 
  Award, 
  CheckCircle, 
  ChevronLeft, 
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

// Updated interface to match your actual database schema
interface CoachProfile {
  prof_id: string;
  avatar_url: string | null;
  bio: string | null;
  profile_complete: boolean;
  created_at: string;
  coach_profiles: {
    coach_id: string;
    expertise_areas: string[] | null;
    hourly_rate: number | null;
    video_intro_url: string | null; 
    verification_status: "pending" | "verified" | "rejected" | null;
    algorand_wallet: string | null;
    rating: number | null;
    total_students: number | null;
    earnings: number | null;
    subscription_active: boolean | null;
  } | null;
}

// We need to get user info from the profiles table separately
interface UserInfo {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

interface Review {
  id: string;
  student_name: string;
  student_avatar: string | null; 
  rating: number;
  date: string;
  content: string;
}

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

// Updated session interface to match actual database structure
interface SessionWithProfile {
  id: string;
  student_id: string;
  created_at: string;
}

export default function CoachProfile({ params }: { params: { id: string } }) {
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoachData() {
      try {
        setLoading(true);
        
        // First, get basic user info from profiles table
        const { data: userdata, error: userError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .eq('id', params.id)
          .eq('role', 'coach')
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          setError('Coach not found');
          return;
        }

        setUserInfo(userdata);

        // Then get detailed profile info from user_profiles with coach_profiles joined
        const { data: coachData, error: coachError } = await supabase
          .from('user_profiles')
          .select(`
            prof_id,
            avatar_url,
            bio,
            profile_complete,
            created_at,
            coach_profiles (
              coach_id,
              expertise_areas,
              hourly_rate,
              video_intro_url,
              verification_status,
              algorand_wallet,
              rating,
              total_students,
              earnings,
              subscription_active
            )
          `)
          .eq('prof_id', params.id)
          .single();

        if (coachError) {
          console.error('Error fetching coach profile:', coachError);
          setError('Coach profile not found');
          return;
        }

        if (!coachData || !coachData.coach_profiles) {
          setError('Coach profile not found');
          return;
        }

        setCoach(coachData);

        // Fetch reviews/testimonials for this coach - Updated query
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('sessions')
          .select(`
            id,
            student_id,
            created_at,
            user_profiles!sessions_student_id_fkey (
              prof_id,
              avatar_url
            )
          `)
          .eq('coach_id', params.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else {
          // We need to get student names from the profiles table
          const studentIds = reviewsData?.map(session => session.student_id) || [];
          
          if (studentIds.length > 0) {
            const { data: studentNames } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', studentIds);
              const { data: studentAvatars } = await supabase
              .from('user_profiles')
              .select('prof_id, avatar_url')
              .in('prof_id', studentIds);

              const transformedReviews = reviewsData?.map((session): Review => {
                const studentName = studentNames?.find(s => s.id === session.student_id)?.name || 'Anonymous';
                const studentAvatar = studentAvatars?.find(s => s.prof_id === session.student_id)?.avatar_url || null; // Changed to null
                
                return {
                  id: session.id,
                  student_name: studentName,
                  student_avatar: studentAvatar,
                  rating: 5,
                  date: session.created_at,
                  content: 'Great session!'
                };
              }) || [];
            
            setReviews(transformedReviews);
          }
        }

        // For availability, you might want to create a separate table
        // For now, we'll use a default schedule
        setAvailability([
          { day: "Monday", startTime: "09:00", endTime: "17:00" },
          { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
          { day: "Friday", startTime: "09:00", endTime: "15:00" },
        ]);

      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCoachData();
  }, [params.id]);

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

  if (error || !coach || !userInfo) {
    return notFound();
  }

  const coachName = userInfo.name || 'Unknown Coach';
  const coachEmail = userInfo.email || '';

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
              <div className="relative rounded-md overflow-hidden h-40 w-40 md:h-48 md:w-48 bg-muted">
                {coach.avatar_url ? (
                  <Image 
                    src={coach.avatar_url} 
                    alt={coachName} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {coachName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {coach.coach_profiles?.verification_status === 'verified' && (
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
                <span className="font-medium">{(coach.coach_profiles?.rating || 0).toFixed(1)}</span>
                <span className="text-muted-foreground ml-1">({coach.coach_profiles?.total_students || 0} students)</span>
                <Badge variant="outline" className="ml-4">${coach.coach_profiles?.hourly_rate || 0}/hr</Badge>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {coach.coach_profiles?.expertise_areas?.map(area => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                )) || []}
              </div>
              
              <p className="text-muted-foreground">{coach.bio}</p>
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
                        <span>Expertise in {coach.coach_profiles?.expertise_areas?.join(', ') || 'Various areas'}</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>{coach.coach_profiles?.total_students || 0} students taught</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Member since {new Date(coach.created_at).getFullYear()}</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>
                          {coach.coach_profiles?.verification_status === 'verified' 
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
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <Card key={review.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={review.student_avatar ?? undefined}
                                alt={review.student_name}
                              />
                              <AvatarFallback>{review.student_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{review.student_name}</CardTitle>
                              <CardDescription>{new Date(review.date).toLocaleDateString()}</CardDescription>
                            </div>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{review.content}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">No reviews yet. Be the first to book a session!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
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
                  <ul className="space-y-3">
                    {availability.map((slot, index) => (
                      <li key={index} className="flex items-center p-2 rounded-md border bg-background">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="font-medium w-24">{slot.day}:</span>
                        <span className="text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </li>
                    ))}
                  </ul>
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
                {coach.coach_profiles?.subscription_active ? (
                  <Button className="w-full" asChild>
                    <Link href={`/coaches/${coach.prof_id}/schedule`}>
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
                  <span className="font-medium">${coach.coach_profiles?.hourly_rate || 0}/hour</span>
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
                    <span className="text-sm">Expert guidance in {coach.coach_profiles?.expertise_areas?.join(', ') || 'various areas'}</span>
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