"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Star, Clock, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Fixed: Removed duplicates and made unique
const allExpertiseAreas = [
  "DeFi", "NFTs", "Trading", "Technical Analysis", "Risk Management", "Security", 
  "Market Analysis", "Portfolio Management", "DAOs", "Investing", 
  "Smart Contracts", "Development", "Tax Planning", "Options Trading"
];

interface CoachData {
  coach_id: string;
  expertise_areas: string[] | null;
  hourly_rate: number | null;
  rating: number | null;
  total_students: number | null;
  verification_status: "pending" | "verified" | "rejected" | null;
  user_profiles: {
    prof_id: string;
    bio: string | null;
    avatar_url: string | null;
  } | null;
  profiles: {
    name: string | null;
    email: string | null;
  } | null;
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<CoachData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState("rating-desc");
  const [availability, setAvailability] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCoaches();
  }, []);

 async function fetchCoaches() {
  try {
    // Step 1: Fetch coach_profiles data
    const { data: coachProfilesData, error: coachProfilesError } = await supabase
      .from('coach_profiles')
      .select(`
        coach_id,
        expertise_areas,
        hourly_rate,
        rating,
        total_students,
        verification_status
      `)
      .eq('verification_status', 'verified');

    if (coachProfilesError) {
      console.error('Supabase error fetching coach profiles:', coachProfilesError);
      throw coachProfilesError;
    }

    // Filter out null coach_ids and create array of strings
    const coachIds = coachProfilesData?.map(coach => coach.coach_id).filter((id): id is string => id !== null) || [];

    // Step 2: Fetch additional profile (name, email) and user profile (avatar, bio, etc.) data separately
    const [profilesResult, userProfilesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', coachIds),
      supabase
        .from('user_profiles')
        .select('prof_id, avatar_url, bio') // Only select necessary fields
        .in('prof_id', coachIds)
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (userProfilesResult.error) throw userProfilesResult.error;

    // Step 3: Create lookup maps for efficient merging
    const profilesMap = profilesResult.data?.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>) || {};

    const userProfilesMap = userProfilesResult.data?.reduce((acc, userProfile) => {
      acc[userProfile.prof_id] = userProfile;
      return acc;
    }, {} as Record<string, any>) || {};

    // Step 4: Transform and combine the data
    const transformedCoaches = coachProfilesData?.map(coachProfile => {
      const profile = profilesMap[coachProfile.coach_id];
      const userProfile = userProfilesMap[coachProfile.coach_id];
      
      return {
        coach_id: coachProfile.coach_id,
        expertise_areas: coachProfile.expertise_areas,
        hourly_rate: coachProfile.hourly_rate,
        rating: coachProfile.rating,
        total_students: coachProfile.total_students,
        verification_status: coachProfile.verification_status,
        user_profiles: userProfile ? {
          prof_id: userProfile.prof_id,
          bio: userProfile.bio,
          avatar_url: userProfile.avatar_url
        } : null,
        profiles: profile ? {
          name: profile.name,
          email: profile.email
        } : null,
      };
    }) || [];

    setCoaches(transformedCoaches);
  } catch (error: any) {
    console.error('Error fetching coaches:', error);
    // Keep coaches as empty array on error
    setCoaches([]);
  } finally {
    setLoading(false);
  }
}


  
  // Filter coaches based on search and filters
  const filteredCoaches = coaches
    .filter(coach => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          coach.profiles?.name?.toLowerCase().includes(query) ||
          coach.user_profiles?.bio?.toLowerCase().includes(query) ||
          coach.expertise_areas?.some(area => area.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(coach => {
      // Price range filter
      const hourlyRate = coach.hourly_rate || 0;
      return hourlyRate >= priceRange[0] && hourlyRate <= priceRange[1];
    })
    .filter(coach => {
      // Expertise filter
      if (selectedExpertise.length === 0) return true;
      return coach.expertise_areas && selectedExpertise.some(expertise => coach.expertise_areas!.includes(expertise));
    })
    .filter(coach => {
      // Rating filter
      if (minRating === null) return true;
      return (coach.rating || 0) >= minRating;
    })
    .sort((a, b) => {
      // Sorting
      switch (sortOption) {
        case "rating-desc":
          return (b.rating || 0) - (a.rating || 0);
        case "rating-asc":
          return (a.rating || 0) - (b.rating || 0);
        case "price-desc":
          return (b.hourly_rate || 0) - (a.hourly_rate || 0);
        case "price-asc":
          return (a.hourly_rate || 0) - (b.hourly_rate || 0);
        case "sessions-desc":
          return (b.total_students || 0) - (a.total_students || 0);
        default:
          return 0;
      }
    });

  function toggleExpertise(expertise: string) {
    setSelectedExpertise(prev => 
      prev.includes(expertise)
        ? prev.filter(e => e !== expertise)
        : [...prev, expertise]
    );
  }

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Find Your Coach</h1>
          <p className="text-muted-foreground mt-1">
            Connect with expert trading coaches for personalized guidance
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                All coaches are verified
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Our coaches go through a rigorous verification process</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, expertise, or keywords..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Mobile filters */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Coaches</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect coach
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4 space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Price Range</h3>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      min={0}
                      max={200}
                      step={5}
                      onValueChange={setPriceRange}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}/hr</span>
                      <span>${priceRange[1]}/hr</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Minimum Rating</h3>
                  <Select
                    value={minRating?.toString() ?? "all"}
                    onValueChange={(value) => setMinRating(value === "all" ? null : Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+</SelectItem>
                      <SelectItem value="4">4.0+</SelectItem>
                      <SelectItem value="3.5">3.5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {allExpertiseAreas.map((expertise) => (
                      <Badge
                        key={expertise}
                        variant={selectedExpertise.includes(expertise) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleExpertise(expertise)}
                      >
                        {expertise}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Sort dropdown */}
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating-desc">Highest Rated</SelectItem>
            <SelectItem value="rating-asc">Lowest Rated</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="sessions-desc">Most Sessions</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Desktop layout */}
      <div className="flex gap-8">
        {/* Filters - Desktop only */}
        <div className="hidden md:block w-64 space-y-6">
          <div>
            <h3 className="font-medium mb-3">Price Range</h3>
            <div className="px-2">
              <Slider
                value={priceRange}
                min={0}
                max={200}
                step={5}
                onValueChange={setPriceRange}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${priceRange[0]}/hr</span>
                <span>${priceRange[1]}/hr</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-3">Minimum Rating</h3>
            <Select
              value={minRating?.toString() ?? "all"}
              onValueChange={(value) => setMinRating(value === "all" ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any rating</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
                <SelectItem value="3.5">3.5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium mb-3">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {allExpertiseAreas.map((expertise) => (
                <Badge
                  key={expertise}
                  variant={selectedExpertise.includes(expertise) ? "default" : "outline"}
                  className="cursor-pointer mb-2"
                  onClick={() => toggleExpertise(expertise)}
                >
                  {expertise}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Coach listings */}
        <div className="flex-1">
          {filteredCoaches.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <h3 className="font-medium text-lg mb-2">No coaches found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCoaches.map((coach) => (
                <Card key={coach.coach_id} className="overflow-hidden flex flex-col h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-muted">
                          <AvatarImage 
                            src={coach.user_profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.coach_id}`} 
                            alt={coach.profiles?.name || 'Coach'} 
                          />
                          <AvatarFallback>
                            {coach.profiles?.name?.substring(0, 2) || 'CO'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {coach.profiles?.name || 'Unknown Coach'}
                          </CardTitle>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{coach.rating || 0}</span>
                            <span className="text-sm text-muted-foreground ml-1">({coach.total_students || 0} students)</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-medium">${coach.hourly_rate || 0}/hr</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                      {coach.user_profiles?.bio || 'No bio available'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {coach.expertise_areas?.map((tag, index) => (
                        <Badge key={`${coach.coach_id}-${tag}-${index}`} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      )) || (
                        <span className="text-xs text-muted-foreground">No expertise areas listed</span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={`/coaches/${coach.coach_id}`}>View Profile</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}