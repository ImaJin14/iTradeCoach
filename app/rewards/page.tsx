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

        // Check if user is a student
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile || profile.role !== 'student') {
          throw new Error('Access denied - not a student');
        }

        // Get student profile with proper error handling
        const { data: studentProfile, error: studentProfileError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('student_id', user.id)
          .maybeSingle();

        if (studentProfileError) {
          console.error('Student profile error:', studentProfileError);
          throw studentProfileError;
        }

        // Get completed sessions count
        const { count: sessionsCount, error: sessionsError } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed');

        if (sessionsError) {
          console.error('Sessions count error:', sessionsError);
          throw sessionsError;
        }

        // Get completed courses count from the courses table where student_id matches
        // Note: courses table has optional student_id field
        const { count: coursesCount, error: coursesError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'published'); // Assuming completed courses are marked as published

        if (coursesError) {
          console.error('Courses count error:', coursesError);
          // Don't throw here, just log and use 0
        }

        // Calculate rewards data with fallbacks
        setRewards({
          tokens: studentProfile?.tokens_earned || 0,
          completedSessions: sessionsCount || 0,
          completedLessons: coursesCount || studentProfile?.courses_completed?.length || 0,
          currentLevel: studentProfile?.current_level || 'beginner',
          learningGoals: studentProfile?.learning_goals || [],
          selectedCoach: studentProfile?.selected_coach_id || null
        });
      } catch (error: any) {
        console.error('Error loading rewards:', error);
        toast({
          title: "Error",
          description: error.message === 'Access denied - not a student' 
            ? "This page is only available to students."
            : "Failed to load rewards data. Please try again.",
          variant: "destructive",
        });
        
        // Set default values on error
        setRewards({
          tokens: 0,
          completedSessions: 0,
          completedLessons: 0,
          currentLevel: 'beginner',
          learningGoals: [],
          selectedCoach: null
        });
      } finally {
        setLoading(false);
      }
    }

    loadRewards();
  }, [toast]);

  // Calculate progress percentages
  const getSessionProgress = () => {
    const sessions = rewards?.completedSessions || 0;
    // Each session worth 10%, max 100%
    return Math.min(sessions * 10, 100);
  };

  const getLessonProgress = () => {
    const lessons = rewards?.completedLessons || 0;
    // Each lesson worth 20%, max 100%
    return Math.min(lessons * 20, 100);
  };

  // Calculate next milestone
  const getNextSessionMilestone = () => {
    const sessions = rewards?.completedSessions || 0;
    const nextMilestone = Math.ceil(sessions / 5) * 5;
    return nextMilestone === sessions ? sessions + 5 : nextMilestone;
  };

  const getNextLessonMilestone = () => {
    const lessons = rewards?.completedLessons || 0;
    const nextMilestone = Math.ceil(lessons / 3) * 3;
    return nextMilestone === lessons ? lessons + 3 : nextMilestone;
  };

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

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Rewards & Progress</h1>
        <p className="text-muted-foreground">Track your learning journey and redeem rewards</p>
      </div>
      
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
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Current Level</div>
              <div className="font-medium capitalize">{rewards?.currentLevel}</div>
            </div>
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
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">1-on-1 Session</div>
                  <div className="text-sm text-muted-foreground">30 minutes with any coach</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">500</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Premium Course Access</div>
                  <div className="text-sm text-muted-foreground">Unlock advanced courses</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">1000</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Live Session Priority</div>
                  <div className="text-sm text-muted-foreground">First access to new sessions</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">250</span>
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
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Completed Sessions</span>
                  <span className="text-sm text-muted-foreground">
                    {rewards?.completedSessions || 0} / {getNextSessionMilestone()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-300" 
                    style={{ width: `${getSessionProgress()}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getNextSessionMilestone() - (rewards?.completedSessions || 0)} more sessions to next milestone
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Learning Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {rewards?.completedLessons || 0} / {getNextLessonMilestone()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300" 
                    style={{ width: `${getLessonProgress()}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getNextLessonMilestone() - (rewards?.completedLessons || 0)} more lessons to next milestone
                </div>
              </div>

              {rewards?.learningGoals?.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Learning Goals</div>
                  <div className="text-xs text-muted-foreground">
                    {rewards.learningGoals.slice(0, 2).join(', ')}
                    {rewards.learningGoals.length > 2 && ` +${rewards.learningGoals.length - 2} more`}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Achievement Badges</CardTitle>
          <CardDescription>Milestones you've unlocked on your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border-2 text-center ${
              (rewards?.completedSessions || 0) >= 1 ? 'border-green-500 bg-green-50' : 'border-muted bg-muted/50'
            }`}>
              <Trophy className={`h-6 w-6 mx-auto mb-2 ${
                (rewards?.completedSessions || 0) >= 1 ? 'text-green-500' : 'text-muted-foreground'
              }`} />
              <div className="text-sm font-medium">First Session</div>
            </div>
            
            <div className={`p-4 rounded-lg border-2 text-center ${
              (rewards?.completedSessions || 0) >= 5 ? 'border-blue-500 bg-blue-50' : 'border-muted bg-muted/50'
            }`}>
              <Star className={`h-6 w-6 mx-auto mb-2 ${
                (rewards?.completedSessions || 0) >= 5 ? 'text-blue-500' : 'text-muted-foreground'
              }`} />
              <div className="text-sm font-medium">Dedicated Learner</div>
            </div>
            
            <div className={`p-4 rounded-lg border-2 text-center ${
              (rewards?.tokens || 0) >= 500 ? 'border-yellow-500 bg-yellow-50' : 'border-muted bg-muted/50'
            }`}>
              <Gift className={`h-6 w-6 mx-auto mb-2 ${
                (rewards?.tokens || 0) >= 500 ? 'text-yellow-500' : 'text-muted-foreground'
              }`} />
              <div className="text-sm font-medium">Token Collector</div>
            </div>
            
            <div className={`p-4 rounded-lg border-2 text-center ${
              (rewards?.completedLessons || 0) >= 3 ? 'border-purple-500 bg-purple-50' : 'border-muted bg-muted/50'
            }`}>
              <Trophy className={`h-6 w-6 mx-auto mb-2 ${
                (rewards?.completedLessons || 0) >= 3 ? 'text-purple-500' : 'text-muted-foreground'
              }`} />
              <div className="text-sm font-medium">Course Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}