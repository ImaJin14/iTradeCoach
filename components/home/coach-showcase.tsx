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

export default function CoachShowcase() {
  const [hoveredCoach, setHoveredCoach] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedCoaches() {
      try {
        const { data, error } = await supabase
          .from('coach_profiles')
          .select(`
            *,
            profiles!coach_profiles_coach_id_fkey (
              name,
              email
            ),
            user_profiles!coach_profiles_coach_id_fkey (
              avatar_url,
              bio
            )
          `)
          .eq('verification_status', 'verified')
          .order('rating', { ascending: false })
          .limit(3);

        if (error) throw error;
        setCoaches(data || []);
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
          <div className="relative h-48 w-full">
            <Image
              src={coach.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.coach_id}`}
              alt={coach.profiles.name}
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
                    src={coach.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.coach_id}`} 
                    alt={coach.profiles.name} 
                  />
                  <AvatarFallback>{coach.profiles.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{coach.profiles.name}</CardTitle>
                  <div className="flex items-center mt-1">
                    <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-sm font-medium">{coach.rating}</span>
                    <span className="text-sm text-muted-foreground ml-1">({coach.total_students} sessions)</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="font-medium">${coach.hourly_rate}/hr</Badge>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <p className="text-sm text-muted-foreground line-clamp-2">{coach.bio}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {coach.expertise_areas?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
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