"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Gift, Star, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadRewards() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Not authenticated');
        }

        // Get student profile
        const { data: studentProfile, error: profileError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get completed sessions count
        const { count: sessionsCount, error: sessionsError } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed');

        if (sessionsError) throw sessionsError;

        setRewards({
          tokens: studentProfile.tokens_earned,
          completedSessions: sessionsCount || 0,
          completedLessons: studentProfile.courses_completed?.length || 0
        });
      } catch (error: any) {
        console.error('Error loading rewards:', error);
        toast({
          title: "Error",
          description: "Failed to load rewards data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadRewards();
  }, [toast]);

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
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          asChild
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Rewards</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Knowledge Tokens</CardTitle>
            </div>
            <CardDescription>Earn tokens by completing lessons and sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{rewards?.tokens || 0}</div>
            <p className="text-sm text-muted-foreground">
              Tokens available to spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              <CardTitle>Available Rewards</CardTitle>
            </div>
            <CardDescription>Redeem your tokens for exclusive rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">1-on-1 Session</div>
                  <div className="text-sm text-muted-foreground">30 minutes with any coach</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">500</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Premium Course</div>
                  <div className="text-sm text-muted-foreground">Any course from our catalog</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">1000</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <CardTitle>Achievement Progress</CardTitle>
            </div>
            <CardDescription>Track your learning milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Completed Sessions</span>
                  <span className="text-sm text-muted-foreground">{rewards?.completedSessions || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${Math.min((rewards?.completedSessions || 0) * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Completed Lessons</span>
                  <span className="text-sm text-muted-foreground">{rewards?.completedLessons || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${Math.min((rewards?.completedLessons || 0) * 20, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}