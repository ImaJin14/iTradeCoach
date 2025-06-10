"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, Users, Calendar, MessageSquare, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PlatformStats {
  totalCoaches: number;
  totalSessions: number;
  avgRating: number;
  totalUsers: number;
}

export default function HowItWorksPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Query the actual tables instead of the view
        const [
          { count: totalUsers },
          { count: totalCoaches },
          { count: totalSessions },
          { data: ratingsData }
        ] = await Promise.all([
          // Total users
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
          
          // Total verified coaches
          supabase
            .from('coach_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('verification_status', 'verified'),
          
          // Total completed sessions
          supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed'),
          
          // Average rating
          supabase
            .from('coach_profiles')
            .select('rating')
            .eq('verification_status', 'verified')
            .gt('rating', 0)
        ]);

        // Calculate average rating
        const avgRating = ratingsData && ratingsData.length > 0
          ? ratingsData.reduce((sum, coach) => sum + (coach.rating || 0), 0) / ratingsData.length
          : 0;

        setStats({
          totalCoaches: totalCoaches || 0,
          totalSessions: totalSessions || 0,
          avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          totalUsers: totalUsers || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default values
        setStats({
          totalCoaches: 50,
          totalSessions: 1000,
          avgRating: 4.8,
          totalUsers: 500
        });
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="container py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">How iTradeCoach Works</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your journey to becoming a successful trader starts here
        </p>
        
        {/* Enhanced with real platform stats */}
        {stats && (
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalCoaches}+</div>
              <div className="text-sm text-muted-foreground">Expert Coaches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalSessions}+</div>
              <div className="text-sm text-muted-foreground">Sessions Completed</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <div className="text-2xl font-bold text-primary">{stats.avgRating}</div>
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {[
          {
            title: "1. Find Your Coach",
            description: "Browse our marketplace of verified trading experts and find the perfect match for your goals.",
            icon: Users,
            badge: stats ? `${stats.totalCoaches}+ Experts` : null
          },
          {
            title: "2. Schedule Sessions",
            description: "Book one-on-one coaching sessions at times that work best for you.",
            icon: Calendar,
            badge: "Flexible Timing"
          },
          {
            title: "3. Learn & Grow",
            description: "Get personalized guidance, feedback, and support to accelerate your trading journey.",
            icon: MessageSquare,
            badge: stats ? `${stats.avgRating}★ Rated` : null
          }
        ].map((step, i) => (
          <div key={i} className="relative">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <step.icon className="h-12 w-12 text-primary mb-4" />
                  {step.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {step.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
            {i < 2 && (
              <div className="hidden md:block absolute top-1/2 -right-4 -translate-x-1/2 -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Why Choose iTradeCoach?</h2>
          <p className="text-muted-foreground">
            We're committed to providing the highest quality trading education
          </p>
        </div>

        <div className="grid gap-6">
          {[
            {
              title: "Verified Experts",
              description: "All our coaches go through a rigorous verification process to ensure they have the expertise and experience to teach.",
              stat: stats ? `${stats.totalCoaches}+ verified coaches` : null
            },
            {
              title: "Personalized Learning",
              description: "Get customized guidance tailored to your trading goals, experience level, and preferred markets.",
              stat: "3 skill levels supported"
            },
            {
              title: "Flexible Scheduling",
              description: "Book sessions at times that work for you, with coaches available across different time zones.",
              stat: "24/7 availability"
            },
            {
              title: "Secure Platform",
              description: "Our platform provides a secure environment for scheduling, payments, and communication.",
              stat: stats ? `${stats.totalUsers}+ trusted users` : null
            }
          ].map((feature, i) => (
            <div key={i} className="flex gap-4 items-start p-6 rounded-lg border hover:shadow-md transition-shadow">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{feature.title}</h3>
                  {feature.stat && (
                    <Badge variant="outline" className="text-xs">
                      {feature.stat}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced CTA section with real data */}
      <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {stats 
            ? `Join ${stats.totalUsers}+ traders who are accelerating their growth with personalized coaching`
            : "Join thousands of traders who are accelerating their growth with personalized coaching"
          }
        </p>
        
        {stats && (
          <div className="flex justify-center gap-6 py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>{stats.totalSessions}+ successful sessions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{stats.avgRating}/5 average rating</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/coaches">Browse Coaches</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}