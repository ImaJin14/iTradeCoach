"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface LearningStats {
  completedLessons: number;
  currentLevel: string;
  tokensEarned: number;
}

export default function LearnPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLearningStats() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Not authenticated');
        }

        const { data: studentProfile, error: profileError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        setStats({
          completedLessons: studentProfile.courses_completed?.length || 0,
          currentLevel: studentProfile.current_level || 'beginner',
          tokensEarned: studentProfile.tokens_earned || 0
        });
      } catch (error: any) {
        console.error('Error fetching learning stats:', error);
        toast({
          title: "Error",
          description: "Failed to load learning statistics. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchLearningStats();
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
    <div className="container py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Learning Paths</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose your path and start learning at your own pace
        </p>
      </div>

      {stats && (
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Completed Lessons</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.completedLessons}</div>
              <p className="text-sm text-muted-foreground">Total lessons completed</p>
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
              <p className="text-sm text-muted-foreground">Your learning level</p>
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
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[
          {
            title: "Beginner",
            description: "Master the fundamentals of cryptocurrency and blockchain technology",
            topics: ["Crypto Basics", "Wallet Setup", "Exchange Trading", "Security Fundamentals"],
            color: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
            recommended: stats?.currentLevel === 'beginner'
          },
          {
            title: "Intermediate",
            description: "Dive deeper into DeFi, NFTs, and investment strategies",
            topics: ["DeFi Protocols", "Yield Farming", "NFT Marketplaces", "Technical Analysis"],
            color: "border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10",
            recommended: stats?.currentLevel === 'intermediate'
          },
          {
            title: "Advanced",
            description: "Explore complex topics like tokenomics, DAOs and development",
            topics: ["Smart Contracts", "Tokenomics", "DAO Governance", "Market Analysis"],
            color: "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10",
            recommended: stats?.currentLevel === 'advanced'
          }
        ].map((path, i) => (
          <Card key={i} className={`relative ${path.color}`}>
            {path.recommended && (
              <Badge className="absolute -top-2 -right-2 bg-primary">
                Recommended
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
              <Button className="w-full">
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
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
        <Button asChild size="lg">
          <Link href="/coaches">Find a Coach</Link>
        </Button>
      </div>
    </div>
  );
}