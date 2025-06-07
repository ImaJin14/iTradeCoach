"use client";

import { useState } from "react";
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
  ChevronLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CoachProfile } from "@/lib/types";

// Mock data for a single coach (would normally come from your database)
const mockCoach: CoachProfile = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah@example.com",
  role: "coach",
  profileComplete: true,
  createdAt: new Date("2023-01-15"),
  bio: "Former Wall Street analyst specializing in DeFi protocols and NFT markets with 5+ years of experience in the cryptocurrency space. I help students navigate the complex world of decentralized finance with practical strategies and deep market insights. My teaching approach combines technical knowledge with real-world applications, helping you build both understanding and practical skills.",
  expertiseAreas: ["DeFi", "NFTs", "Trading", "Tokenomics"],
  hourlyRate: 85,
  videoIntroUrl: "https://example.com/video1",
  availabilitySchedule: [
    { day: "Monday", startTime: "09:00", endTime: "17:00" },
    { day: "Wednesday", startTime: "09:00", endTime: "17:00" },
    { day: "Friday", startTime: "09:00", endTime: "15:00" },
  ],
  verificationStatus: "verified",
  algorandWallet: "ALGO123456789",
  rating: 4.9,
  totalStudents: 124,
  earnings: 10540,
};

// Mock reviews data
const reviews = [
  {
    id: "r1",
    studentName: "Michael T.",
    studentImage: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
    rating: 5,
    date: "2023-12-10",
    content: "Sarah's deep knowledge of DeFi protocols is incredible. She explained complex concepts in ways that finally clicked for me. After just three sessions, I was able to start participating in liquidity pools with confidence."
  },
  {
    id: "r2",
    studentName: "Jessica L.",
    studentImage: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    rating: 5,
    date: "2023-11-28",
    content: "I was completely new to NFTs and wasn't sure where to start. Sarah created a personalized learning plan that helped me understand both the technology and the market. Now I'm building my own collection!"
  },
  {
    id: "r3",
    studentName: "David W.",
    studentImage: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg",
    rating: 4,
    date: "2023-11-15",
    content: "Sarah's background in traditional finance and crypto gives her a unique perspective. She helped me develop a balanced portfolio strategy that incorporates both DeFi and traditional investments. Very knowledgeable!"
  },
];

// Available time slots (would normally be generated from the coach's availability)
const timeSlots = [
  { day: "Mon, Jun 10", slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
  { day: "Wed, Jun 12", slots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] },
  { day: "Fri, Jun 14", slots: ["10:00 AM", "12:00 PM", "2:00 PM"] },
  { day: "Mon, Jun 17", slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
  { day: "Wed, Jun 19", slots: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"] },
];

export default function CoachProfile({ params }: { params: { id: string } }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  
  // In a real app, you'd fetch the coach data based on the ID
  // For this example, we'll just use the mock data if ID is "1"
  if (params.id !== "1") {
    return notFound();
  }

  const coach = mockCoach;
  
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
                <Image 
                  src="https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg" 
                  alt={coach.name} 
                  fill 
                  className="object-cover"
                />
              </div>
              <Badge className="absolute bottom-2 right-2 bg-primary text-primary-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{coach.name}</h1>
              <div className="flex items-center mb-4">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{coach.rating}</span>
                <span className="text-muted-foreground ml-1">({coach.totalStudents} sessions)</span>
                <Badge variant="outline" className="ml-4">${coach.hourlyRate}/hr</Badge>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {coach.expertiseAreas.map(area => (
                  <Badge key={area} variant="secondary">{area}</Badge>
                ))}
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
                        <span>5+ years in cryptocurrency markets</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Former Wall Street financial analyst</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>DeFi protocol advisor for 2 startups</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 mr-2"></div>
                        <span>Certified Blockchain Professional</span>
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
                        <span>Homework assignments with personal feedback</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.studentImage} alt={review.studentName} />
                            <AvatarFallback>{review.studentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{review.studentName}</CardTitle>
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
                ))}
              </div>
            </TabsContent>
            <TabsContent value="availability" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                  <CardDescription>
                    Sarah's regular availability each week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {coach.availabilitySchedule.map((slot, index) => (
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
                <Button className="w-full" asChild>
                  <Link href={`/coaches/${coach.id}/schedule`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule & Request Session
                  </Link>
                </Button>
                
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
                    <span>Languages</span>
                  </div>
                  <span className="font-medium">English, Spanish</span>
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
                    <span className="text-sm">Session recording for your reference</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span className="text-sm">Follow-up resources and materials</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                    <span className="text-sm">24/7 chat support between sessions</span>
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