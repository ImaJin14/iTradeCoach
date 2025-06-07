'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface PlatformStats {
  totalUsers: number;
  expertCount: number;
  sessionCount: number;
  satisfactionRate: number;
  topicCount: number;
}

export default function PlatformStats() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    expertCount: 0,
    sessionCount: 0,
    satisfactionRate: 0,
    topicCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Get verified experts count
        const { count: expertCount, error: expertsError } = await supabase
          .from('coach_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'verified');

        if (expertsError) throw expertsError;

        // Get completed sessions count
        const { count: sessionCount, error: sessionsError } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');

        if (sessionsError) throw sessionsError;

        // Get average rating (satisfaction rate)
        const { data: ratingData, error: ratingError } = await supabase
          .from('coach_profiles')
          .select('rating')
          .eq('verification_status', 'verified')
          .gt('rating', 0);

        if (ratingError) throw ratingError;

        const avgRating = ratingData?.length 
          ? (ratingData.reduce((acc, curr) => acc + curr.rating, 0) / ratingData.length) 
          : 0;

        // Get unique expertise areas count
        const { data: expertiseData, error: expertiseError } = await supabase
          .from('coach_profiles')
          .select('expertise_areas')
          .eq('verification_status', 'verified');

        if (expertiseError) throw expertiseError;

        const uniqueTopics = new Set(
          expertiseData?.flatMap(coach => coach.expertise_areas || []) || []
        );

        setStats({
          totalUsers: totalUsers || 0,
          expertCount: expertCount || 0,
          sessionCount: sessionCount || 0,
          satisfactionRate: Math.round((avgRating / 5) * 100),
          topicCount: uniqueTopics.size
        });
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 w-full max-w-4xl mx-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted mb-2"></div>
            <div className="h-8 w-24 bg-muted rounded mb-1"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8 w-full max-w-4xl mx-auto">
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-bold">{stats.totalUsers}+</div>
        <p className="text-sm text-muted-foreground">Total Users</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-bold">{stats.expertCount}+</div>
        <p className="text-sm text-muted-foreground">Verified Experts</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-bold">{stats.sessionCount}+</div>
        <p className="text-sm text-muted-foreground">Sessions Completed</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-bold">{stats.satisfactionRate}%</div>
        <p className="text-sm text-muted-foreground">Student Satisfaction</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="text-2xl md:text-3xl font-bold">{stats.topicCount}+</div>
        <p className="text-sm text-muted-foreground">Learning Topics</p>
      </div>
    </div>
  );
}