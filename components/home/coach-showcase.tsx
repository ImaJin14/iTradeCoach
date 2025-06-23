"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { StarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

interface CoachData {
  coach_id: string;
  expertise_areas: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  total_students: number | null;
  verification_status: string;
  user_profiles: {
    avatar_url: string | null;
    bio: string | null;
  } | null;
  profiles: {
    name: string | null;
    email: string | null;
  } | null;
}

export default function CoachShowcase() {
  const [hoveredCoach, setHoveredCoach] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedCoaches() {
      try {
        const { data, error } = await supabase
          .from('coach_profiles')
          .select(`
            coach_id,
            expertise_areas,
            hourly_rate,
            rating,
            total_students,
            verification_status,
            user_profiles!coach_id (
              avatar_url,
              bio
            ),
            profiles!coach_id (
              name,
              email
            )
          `)
          .eq('verification_status', 'verified')
          .order('rating', { ascending: false })
          .limit(3);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        if (data) {
          setCoaches(data);
        }
      } catch (error) {
        console.error('Error fetching featured coaches:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedCoaches();
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted"></div>
            <CardHeader className="pt-4 pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded"></div>
                    <div className="h-3 w-16 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-2">
              <div className="h-4 w-full bg-muted rounded mb-3"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (coaches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="font-medium text-lg mb-2">No featured coaches available</h3>
        <p className="text-muted-foreground">Check back soon for our featured coaches</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {coaches.map((coach) => (
        <Card 
          key={coach.coach_id} 
          className={`overflow-hidden transition-all duration-300 ${
            hoveredCoach === coach.coach_id ? 'shadow-lg scale-[1.02]' : 'shadow-md'
          }`}
          onMouseEnter={() => setHoveredCoach(coach.coach_id)}
          onMouseLeave={() => setHoveredCoach(null)}
        >
          <div className="relative h-48 w-full bg-gradient-to-br from-primary/10 to-blue-600/10">
            <Image
              src={coach.user_profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.coach_id}`}
              alt={coach.profiles?.name || 'Coach'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <CardHeader className="pt-4 pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage 
                    src={coach.user_profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.coach_id}`} 
                    alt={coach.profiles?.name || 'Coach'} 
                  />
                  <AvatarFallback>
                    {coach.profiles?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {coach.profiles?.name || 'Unknown Coach'}
                  </CardTitle>
                  <div className="flex items-center mt-1">
                    <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{coach.rating || 0}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                      ({coach.total_students || 0} students)
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="font-medium">
                ${coach.hourly_rate || 0}/hr
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {coach.user_profiles?.bio || 'No bio available'}
            </p>
            <div className="flex flex-wrap gap-1 mt-3">
              {coach.expertise_areas?.map((tag, index) => (
                <Badge key={`${coach.coach_id}-${tag}-${index}`} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              )) || (
                <span className="text-xs text-muted-foreground">No expertise listed</span>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-4">
            <Button asChild className="w-full">
              <Link href={`/coaches/${coach.coach_id}`}>View Profile</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}