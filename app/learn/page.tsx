"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Star, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface LearningStats {
  completedCourses: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  tokensEarned: number;
  learningGoals: string[];
  selectedPath: string | null;
  selectedCoachId: string | null;
  hasSubscription: boolean;
}

interface UserProfile {
  role: 'student' | 'coach' | 'admin';
  subscription_status: string | null;
}

// Raw database type
interface RawUserProfile {
  role: string | null;
  subscription_status: string | null;
}

export default function LearnPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchLearningData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Not authenticated');
        }

        // First get the user's role and subscription status
        const { data: rawProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', user.id)
          .single() as { data: RawUserProfile | null; error: any };

        if (profileError) throw profileError;

        // Validate and transform the profile data
        if (!rawProfile || !rawProfile.role) {
          throw new Error('Invalid profile data');
        }

        // Type guard to ensure role is valid
        const validRoles = ['student', 'coach', 'admin'] as const;
        if (!validRoles.includes(rawProfile.role as any)) {
          throw new Error('Invalid user role');
        }

        const profile: UserProfile = {
          role: rawProfile.role as 'student' | 'coach' | 'admin',
          subscription_status: rawProfile.subscription_status
        };

        setUserProfile(profile);

        // Only fetch student stats if user is a student
        if (profile.role === 'student') {
          const { data: studentProfile, error: studentError } = await supabase
            .from('student_profiles')
            .select(`
              current_level,
              tokens_earned,
              courses_completed,
              learning_goals,
              selected_path,
              selected_coach_id
            `)
            .eq('student_id', user.id)
            .single();

          if (studentError) {
            // If no student profile exists, create one
            if (studentError.code === 'PGRST116') {
              const { error: insertError } = await supabase
                .from('student_profiles')
                .insert({
                  student_id: user.id,
                  current_level: 'beginner',
                  tokens_earned: 0,
                  courses_completed: [],
                  learning_goals: []
                });

              if (insertError) throw insertError;

              // Set default stats
              setStats({
                completedCourses: 0,
                currentLevel: 'beginner',
                tokensEarned: 0,
                learningGoals: [],
                selectedPath: null,
                selectedCoachId: null,
                hasSubscription: profile.subscription_status === 'active'
              });
            } else {
              throw studentError;
            }
          } else {
            // Validate current_level
            const validLevels = ['beginner', 'intermediate', 'advanced'] as const;
            const currentLevel = validLevels.includes(studentProfile.current_level as any) 
              ? studentProfile.current_level as 'beginner' | 'intermediate' | 'advanced'
              : 'beginner';

            // Transform the data to match our interface
            setStats({
              completedCourses: studentProfile.courses_completed?.length || 0,
              currentLevel,
              tokensEarned: studentProfile.tokens_earned || 0,
              learningGoals: studentProfile.learning_goals || [],
              selectedPath: studentProfile.selected_path,
              selectedCoachId: studentProfile.selected_coach_id,
              hasSubscription: profile.subscription_status === 'active'
            });
          }
        }
      } catch (error: any) {
        console.error('Error fetching learning data:', error);
        toast({
          title: "Error",
          description: "Failed to load learning data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLearningData();
  }, [toast]);

  // Handle learning path selection
  const handlePathAction = (pathLevel: string, isCurrentPath: boolean) => {
    if (stats?.hasSubscription) {
      // Redirect to classroom for subscribed users
      router.push('/classroom');
    } else {
      // For non-subscribed users, redirect to pricing or coach selection
      if (isCurrentPath) {
        router.push('/coaches'); // Continue with current coach
      } else {
        router.push('/pricing'); // Show pricing for new path
      }
    }
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

  // If user is not a student, show different content
  if (userProfile?.role !== 'student') {
    return (
      <div className="container py-16 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Learning Paths</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {userProfile?.role === 'coach' 
              ? 'As a coach, you help students navigate these learning paths'
              : 'Explore our comprehensive learning resources'
            }
          </p>
        </div>

        {userProfile?.role === 'coach' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Coach Dashboard</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              As a coach, you can view your students' progress and customize learning paths. 
              Visit your dashboard to manage your coaching activities.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              title: "Beginner",
              description: "Master the fundamentals of Trading and Crypto",
              topics: ["Basics(Forex Snd Crypto)",  "Trading Sessions(Forex)", "Lot Sizing(Forex)", "Leveraging(Crypto)", "Accounts setups", "Simple Market Structure"],
              color: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
            },
            {
              title: "Intermediate",
              description: "Dive into investment strategies",
              topics: ["Technical Analysis", "Risk Management", "Money Management", "Trade Management", "Basic Trading Strategies"],
              color: "border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10",
            },
            {
              title: "Advanced",
              description: "Explore complex topics like tokenomics, DAOs and development",
              topics: ["Advance Market Structure", "Trading Plan (including a tested strategy)", "Trading Psychology", "Spot Trading (Cryptocurrency)", "Others"],
              color: "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10",
            }
          ].map((path, i) => (
            <Card key={i} className={`${path.color}`}>
              <CardHeader>
                <CardTitle>{path.title}</CardTitle>
                <CardDescription>{path.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {path.topics.map((topic, j) => (
                    <li key={j} className="flex items-center">
                      <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                      {topic}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Student-specific content
  return (
    <div className="container py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Your Learning Journey</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Track your progress and continue learning at your own pace
        </p>
      </div>

      {stats && (
        <div className="grid gap-8 md:grid-cols-4 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Completed Courses</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completedCourses}</div>
              <p className="text-sm text-muted-foreground">Courses finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Current Level</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold capitalize">{stats.currentLevel}</div>
              <p className="text-sm text-muted-foreground">Your skill level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Tokens Earned</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.tokensEarned}</div>
              <p className="text-sm text-muted-foreground">Learning rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Learning Goals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.learningGoals.length}</div>
              <p className="text-sm text-muted-foreground">Active goals</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Status Banner */}
      {stats && (
        <div className={`border rounded-lg p-6 max-w-2xl mx-auto text-center ${
          stats.hasSubscription 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <h3 className={`font-semibold mb-2 ${
            stats.hasSubscription 
              ? 'text-green-900 dark:text-green-100' 
              : 'text-yellow-900 dark:text-yellow-100'
          }`}>
            {stats.hasSubscription ? 'Premium Access Active' : 'Upgrade for Full Access'}
          </h3>
          <p className={`text-sm ${
            stats.hasSubscription 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {stats.hasSubscription 
              ? 'You have access to all courses, live sessions, and premium features in the classroom.'
              : 'Get unlimited access to all courses, live sessions, and 1-on-1 coaching with a premium subscription.'
            }
          </p>
          {stats.hasSubscription && (
            <Button asChild className="mt-4">
              <Link href="/classroom">Go to Classroom</Link>
            </Button>
          )}
        </div>
      )}

      {/* Show selected path if exists */}
      {stats?.selectedPath && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-2xl mx-auto text-center">
          <h3 className="font-semibold text-primary mb-2">Your Selected Path</h3>
          <p className="text-primary/80 capitalize">{stats.selectedPath}</p>
          {stats.selectedCoachId && (
            <p className="text-sm text-muted-foreground mt-2">
              You have a coach assigned to guide your learning
            </p>
          )}
        </div>
      )}

      {/* Learning Goals */}
      {stats?.learningGoals && stats.learningGoals.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Your Learning Goals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.learningGoals.map((goal, i) => (
              <Card key={i} className="border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{goal}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[
          {
            title: "Beginner",
            description: "Master the fundamentals of Trading and Crypto",
            topics: ["Basics(Forex Snd Crypto)",  "Trading Sessions(Forex)", "Lot Sizing(Forex)", "Leveraging(Crypto)", "Accounts setups", "Simple Market Structure"],
            color: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
            recommended: stats?.currentLevel === 'beginner',
            path: 'beginner'
          },
          {
            title: "Intermediate",
            description: "Dive into investment strategies",
            topics: ["Technical Analysis", "Risk Management", "Money Management", "Trade Management", "Basic Trading Strategies"],
            color: "border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10",
            recommended: stats?.currentLevel === 'intermediate',
            path: 'intermediate'
          },
          {
            title: "Advanced",
            description: "Explore complex topics like tokenomics, DAOs and development",
            topics: ["Advance Market Structure", "Trading Plan (including a tested strategy)", "Trading Psychology", "Spot Trading (Cryptocurrency)", "Others"],
            color: "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10",
            recommended: stats?.currentLevel === 'advanced',
            path: 'advanced'
          }
        ].map((path, i) => (
          <Card key={i} className={`relative ${path.color}`}>
            {path.recommended && (
              <Badge className="absolute -top-2 -right-2 bg-primary">
                Recommended
              </Badge>
            )}
            {stats?.selectedPath === path.path && (
              <Badge className="absolute -top-2 -left-2 bg-green-500">
                Current Path
              </Badge>
            )}
            <CardHeader>
              <CardTitle>{path.title}</CardTitle>
              <CardDescription>{path.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {path.topics.map((topic, j) => (
                  <li key={j} className="flex items-center">
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></div>
                    {topic}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={path.recommended ? "default" : "outline"}
                onClick={() => handlePathAction(path.path, stats?.selectedPath === path.path)}
              >
                {stats?.selectedPath === path.path ? "Continue Learning" : "Start Learning"} 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
        <h2 className="text-3xl font-bold">Need Personalized Guidance?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get one-on-one coaching from expert traders to accelerate your learning
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/coaches">Find a Coach</Link>
          </Button>
          {stats?.selectedCoachId && (
            <Button asChild size="lg" variant="outline">
              <Link href="/sessions">View My Sessions</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}