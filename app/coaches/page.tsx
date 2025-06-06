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
import { CoachProfile } from "@/lib/types";
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

const allExpertiseAreas = [
  "DeFi", "NFTs", "Trading", "Technical Analysis", "Risk Management", "Security", 
  "Technical Analysis", "Market Analysis", "Portfolio Management", "DAOs", "Investing", 
  "Smart Contracts", "Development", "Tax Planning", "Portfolio Management"
];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
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
      const { data, error } = await supabase
        .from('coach_profiles')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq('verification_status', 'verified');

      if (error) throw error;
      
      // Transform snake_case to camelCase
      const transformedData = data?.map(coach => ({
        ...coach,
        hourlyRate: coach.hourly_rate,
        expertiseAreas: coach.expertise_areas,
        totalStudents: coach.total_students,
        availabilitySchedule: coach.availability_schedule,
        verificationStatus: coach.verification_status,
        users: coach.profiles // Map the profiles relation to users for compatibility
      }));
      
      setCoaches(transformedData || []);
    } catch (error) {
      console.error('Error fetching coaches:', error);
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
          coach.users?.name?.toLowerCase().includes(query) ||
          coach.bio?.toLowerCase().includes(query) ||
          coach.expertiseAreas?.some(area => area.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .filter(coach => {
      // Price range filter
      return coach.hourlyRate >= priceRange[0] && coach.hourlyRate <= priceRange[1];
    })
    .filter(coach => {
      // Expertise filter
      if (selectedExpertise.length === 0) return true;
      return selectedExpertise.some(expertise => coach.expertiseAreas.includes(expertise));
    })
    .filter(coach => {
      // Rating filter
      if (minRating === null) return true;
      return coach.rating >= minRating;
    })
    .filter(coach => {
      // Availability filter
      if (!availability) return true;
      return coach.availabilitySchedule.some(slot => slot.day === availability);
    })
    .sort((a, b) => {
      // Sorting
      switch (sortOption) {
        case "rating-desc":
          return b.rating - a.rating;
        case "rating-asc":
          return a.rating - b.rating;
        case "price-desc":
          return b.hourlyRate - a.hourlyRate;
        case "price-asc":
          return a.hourlyRate - b.hourlyRate;
        case "sessions-desc":
          return b.totalStudents - a.totalStudents;
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
                  <h3 className="font-medium mb-2">Availability</h3>
                  <Select
                    value={availability ?? "all"}
                    onValueChange={(value) => setAvailability(value === "all" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any day</SelectItem>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
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
            <h3 className="font-medium mb-3">Availability</h3>
            <Select
              value={availability ?? "all"}
              onValueChange={(value) => setAvailability(value === "all" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any day</SelectItem>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
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
                <Card key={coach.user_id} className="overflow-hidden flex flex-col h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-muted">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${coach.user_id}`} alt={coach.users.name} />
                          <AvatarFallback>{coach.users.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{coach.users.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{coach.rating}</span>
                            <span className="text-sm text-muted-foreground ml-1">({coach.totalStudents} sessions)</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-medium">${coach.hourlyRate}/hr</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{coach.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {coach.expertiseAreas.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button asChild className="w-full">
                      <Link href={`/coaches/${coach.user_id}`}>View Profile</Link>
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