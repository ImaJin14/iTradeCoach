"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, DollarSign, Users, Award, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface PlatformStats {
  averageRate: number;
  activeStudents: number;
  coachSatisfaction: number;
  averageRating: number;
}

export default function BecomeACoachPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        // Get verified coaches
        const { data: coaches, error: coachError } = await supabase
          .from('coach_profiles')
          .select('hourly_rate, total_students, rating')
          .eq('verification_status', 'verified');

        if (coachError) throw coachError;

        // Calculate platform stats
        const stats = coaches?.reduce((acc, coach) => {
          return {
            totalRate: acc.totalRate + (coach.hourly_rate || 0),
            totalStudents: acc.totalStudents + (coach.total_students || 0),
            totalRating: acc.totalRating + (coach.rating || 0),
            coachCount: acc.coachCount + 1
          };
        }, { totalRate: 0, totalStudents: 0, totalRating: 0, coachCount: 0 });

        setStats({
          averageRate: Math.round(stats?.totalRate / (stats?.coachCount || 1)),
          activeStudents: stats?.totalStudents || 0,
          coachSatisfaction: 90, // This could be calculated from other metrics
          averageRating: Number((stats?.totalRating / (stats?.coachCount || 1)).toFixed(1))
        });
      } catch (error: any) {
        console.error('Error fetching platform stats:', error);
        toast({
          title: "Error",
          description: "Failed to load platform statistics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchPlatformStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Become a Trading Coach</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Share your expertise and earn by helping others succeed in their trading journey
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href="/sign-up">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
        {[
          {
            title: "Earn More",
            description: "Set your own rates and earn from sharing your expertise",
            icon: DollarSign,
            value: `$${stats?.averageRate}/hr`,
            label: "Average Rate"
          },
          {
            title: "Grow Network",
            description: "Connect with dedicated students worldwide",
            icon: Users,
            value: `${stats?.activeStudents}+`,
            label: "Active Students"
          },
          {
            title: "Build Brand",
            description: "Establish yourself as a trusted trading expert",
            icon: Award,
            value: `${stats?.coachSatisfaction}%`,
            label: "Coach Satisfaction"
          },
          {
            title: "Track Progress",
            description: "Monitor your impact with detailed analytics",
            icon: BarChart,
            value: `${stats?.averageRating}/5`,
            label: "Average Rating"
          }
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader>
              <stat.icon className="h-8 w-8 text-primary mb-4" />
              <CardTitle>{stat.title}</CardTitle>
              <CardDescription>{stat.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Why Coach with Us?</h2>
          <p className="text-muted-foreground">
            Join our platform and focus on what you do best - teaching trading
          </p>
        </div>

        <div className="grid gap-6">
          {[
            {
              title: "Complete Platform",
              description: "We handle scheduling, payments, and communication so you can focus on coaching."
            },
            {
              title: "Flexible Schedule",
              description: "Set your own availability and work when it suits you best."
            },
            {
              title: "Professional Growth",
              description: "Access resources and tools to enhance your coaching skills."
            },
            {
              title: "Global Reach",
              description: "Connect with students from around the world interested in your expertise."
            }
          ].map((feature, i) => (
            <div key={i} className="flex gap-4 items-start p-6 rounded-lg border">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>How to Get Started</CardTitle>
            <CardDescription>Follow these steps to become a coach on our platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              {
                title: "Create Your Profile",
                description: "Sign up and complete your professional profile with your trading experience and expertise."
              },
              {
                title: "Verification Process",
                description: "Submit required documentation to verify your trading experience and credentials."
              },
              {
                title: "Set Your Schedule",
                description: "Define your availability and coaching rates on the platform."
              },
              {
                title: "Start Coaching",
                description: "Once verified, start accepting students and conducting sessions."
              }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-medium mb-1">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Share Your Expertise?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join our community of trading coaches and help others succeed in their trading journey
        </p>
        <Button asChild size="lg">
          <Link href="/sign-up">Apply as a Coach <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}