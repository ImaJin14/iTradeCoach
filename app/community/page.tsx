"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Users, MessageSquare, Trophy, Star, Calendar, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CommunityStats {
  activeMembers: number;
  totalSessions: number;
  expertCoaches: number;
  activeBlogPosts: number;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  author: {
    name: string;
    avatar_url: string | null;
  };
  views_count: number;
  published_at: string;
  category: {
    name: string;
  } | null;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  coach: {
    name: string;
    avatar_url: string | null;
  };
  scheduled_time: string;
  current_participants: number;
  max_participants: number;
  price: number;
}

interface Coach {
  coach_id: string;
  name: string;
  avatar_url: string | null;
  expertise_areas: string[];
  rating: number;
  total_students: number;
}

const REDDIT_COMMUNITY_URL = "https://reddit.com/r/iTradeCoach";

export default function CommunityPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [topCoaches, setTopCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCommunityData() {
      try {
        // Fetch stats with simplified queries
        const [
          { count: totalUsers },
          { count: totalSessions },
          { count: expertCoaches },
          { count: activeBlogPosts }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase.from('coach_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
          supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published')
        ]);

        setStats({
          activeMembers: totalUsers || 0,
          totalSessions: totalSessions || 0,
          expertCoaches: expertCoaches || 0,
          activeBlogPosts: activeBlogPosts || 0,
        });

        // Fetch other data
        await fetchBlogPosts();
        await fetchLiveSessions();
        await fetchTopCoaches();

      } catch (error: any) {
        console.error('Error fetching community data:', error);
        toast({
          title: "Error",
          description: "Failed to load community data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    async function fetchBlogPosts() {
      try {
        // Get blog posts first
        const { data: posts, error: postsError } = await supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            excerpt,
            views_count,
            published_at,
            author_id,
            category_id
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(6);

        if (postsError) throw postsError;

        if (!posts || posts.length === 0) {
          setBlogPosts([]);
          return;
        }

        // Get unique author IDs - fix Set iteration
        const authorIds = Array.from(new Set(posts.map(post => post.author_id)));
        
        // Get author profiles and user_profiles separately to avoid relationship issues
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', authorIds);

        const { data: userProfiles, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('prof_id, avatar_url')
          .in('prof_id', authorIds);

        if (profilesError) throw profilesError;
        if (userProfilesError) throw userProfilesError;

        // Get categories - fix Set iteration  
        const categoryIds = Array.from(new Set(posts.map(post => post.category_id).filter(Boolean))) as string[];
        const { data: categories, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('id, name')
          .in('id', categoryIds);

        if (categoriesError) throw categoriesError;

        // Combine the data
        const transformedPosts: BlogPost[] = posts.map(post => {
          const profile = profiles?.find(p => p.id === post.author_id);
          const userProfile = userProfiles?.find(up => up.prof_id === post.author_id);
          const category = categories?.find(c => c.id === post.category_id);
          
          return {
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            views_count: post.views_count || 0,
            published_at: post.published_at || new Date().toISOString(),
            author: {
              name: profile?.name || 'Anonymous',
              avatar_url: userProfile?.avatar_url || null
            },
            category: category ? { name: category.name } : null
          };
        });

        setBlogPosts(transformedPosts);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setBlogPosts([]);
      }
    }

    async function fetchLiveSessions() {
      try {
        // Get live sessions
        const { data: sessions, error: sessionsError } = await supabase
          .from('live_sessions')
          .select(`
            id,
            title,
            description,
            scheduled_time,
            current_participants,
            max_participants,
            price,
            coach_id
          `)
          .eq('status', 'scheduled')
          .gte('scheduled_time', new Date().toISOString())
          .order('scheduled_time', { ascending: true })
          .limit(5);

        if (sessionsError) throw sessionsError;

        if (!sessions || sessions.length === 0) {
          setLiveSessions([]);
          return;
        }

        // Get unique coach IDs - fix Set iteration
        const coachIds = Array.from(new Set(sessions.map(session => session.coach_id)));
        
        // Get coach profiles and user_profiles separately
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', coachIds);

        const { data: userProfiles, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('prof_id, avatar_url')
          .in('prof_id', coachIds);

        if (profilesError) throw profilesError;
        if (userProfilesError) throw userProfilesError;

        // Combine the data
        const transformedSessions: LiveSession[] = sessions.map(session => {
          const profile = profiles?.find(p => p.id === session.coach_id);
          const userProfile = userProfiles?.find(up => up.prof_id === session.coach_id);
          
          return {
            id: session.id,
            title: session.title,
            description: session.description,
            scheduled_time: session.scheduled_time,
            current_participants: session.current_participants,
            max_participants: session.max_participants,
            price: session.price,
            coach: {
              name: profile?.name || 'Coach',
              avatar_url: userProfile?.avatar_url || null
            }
          };
        });

        setLiveSessions(transformedSessions);
      } catch (error) {
        console.error('Error fetching live sessions:', error);
        setLiveSessions([]);
      }
    }

    async function fetchTopCoaches() {
      try {
        // Get top coaches
        const { data: coaches, error: coachesError } = await supabase
          .from('coach_profiles')
          .select(`
            coach_id,
            expertise_areas,
            rating,
            total_students
          `)
          .eq('verification_status', 'verified')
          .order('rating', { ascending: false })
          .limit(6);

        if (coachesError) throw coachesError;

        if (!coaches || coaches.length === 0) {
          setTopCoaches([]);
          return;
        }

        // Get coach user details separately
        const coachIds = coaches.map(coach => coach.coach_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', coachIds);

        const { data: userProfiles, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('prof_id, avatar_url')
          .in('prof_id', coachIds);

        if (profilesError) throw profilesError;
        if (userProfilesError) throw userProfilesError;

        // Combine the data
        const transformedCoaches: Coach[] = coaches.map(coach => {
          const profile = profiles?.find(p => p.id === coach.coach_id);
          const userProfile = userProfiles?.find(up => up.prof_id === coach.coach_id);
          
          return {
            coach_id: coach.coach_id,
            name: profile?.name || 'Coach',
            avatar_url: userProfile?.avatar_url || null,
            expertise_areas: coach.expertise_areas || [],
            rating: coach.rating || 0,
            total_students: coach.total_students || 0
          };
        });

        setTopCoaches(transformedCoaches);
      } catch (error) {
        console.error('Error fetching coaches:', error);
        setTopCoaches([]);
      }
    }

    fetchCommunityData();
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
        <h1 className="text-4xl font-bold">Join Our Trading Community</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect, learn, and grow with fellow traders and expert coaches
        </p>
        <Button asChild size="lg" className="mt-4">
          <a href={REDDIT_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
            Join Community <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>


      {stats && (
        <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
          {[
            {
              title: "Active Members",
              value: `${stats.activeMembers}+`,
              icon: Users,
              description: "Traders worldwide"
            },
            {
              title: "Completed Sessions",
              value: `${stats.totalSessions}+`,
              icon: Trophy,
              description: "Learning milestones"
            },
            {
              title: "Expert Coaches",
              value: `${stats.expertCoaches}+`,
              icon: Award,
              description: "Verified professionals"
            },
            {
              title: "Blog Posts",
              value: `${stats.activeBlogPosts}+`,
              icon: MessageSquare,
              description: "Educational content"
            }
          ].map((stat, i) => (
            <Card key={i}>
              <CardHeader>
                <stat.icon className="h-8 w-8 text-primary mb-4" />
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
                {/* Fix: Use span elements instead of div inside CardDescription */}
                <CardDescription className="space-y-1">
                  <span className="block font-medium text-foreground">{stat.title}</span>
                  <span className="block text-sm text-muted-foreground">{stat.description}</span>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="blog" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blog">Latest Posts</TabsTrigger>
          <TabsTrigger value="sessions">Live Sessions</TabsTrigger>
          <TabsTrigger value="coaches">Top Coaches</TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {blogPosts.length > 0 ? (
              blogPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      {post.category && (
                        <Badge variant="secondary">{post.category.name}</Badge>
                      )}
                    </div>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.author.avatar_url || undefined} />
                          <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{post.author.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {post.views_count} views
                      </div>
                    </div>
                    <Button asChild className="w-full mt-4" variant="outline">
                      <Link href={`/blog/${post.id}`}>
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No blog posts available
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <div className="space-y-4">
            {liveSessions.length > 0 ? (
              liveSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium mb-2">{session.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={session.coach.avatar_url || undefined} />
                              <AvatarFallback>{session.coach.name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{session.coach.name}</span>
                          </div>
                          <Badge variant="outline">
                            {session.current_participants}/{session.max_participants} spots
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(session.scheduled_time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${session.price}</div>
                        <Button asChild size="sm" className="mt-2">
                          <Link href={`/sessions/${session.id}`}>
                            Join Session
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No upcoming live sessions
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="coaches" className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCoaches.length > 0 ? (
              topCoaches.map((coach) => (
                <Card key={coach.coach_id}>
                  <CardHeader className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-4">
                      <AvatarImage src={coach.avatar_url || undefined} />
                      <AvatarFallback>{coach.name[0]}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">{coach.name}</CardTitle>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{coach.rating}/5</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Students:</span>
                        <span>{coach.total_students}</span>
                      </div>
                      <div className="text-muted-foreground">Expertise:</div>
                      <div className="flex flex-wrap gap-1">
                        {coach.expertise_areas.slice(0, 3).map((area, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button asChild className="w-full mt-4" variant="outline">
                      <Link href={`/coaches/${coach.coach_id}`}>
                        View Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No coaches available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Join the Community?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow traders, learn from expert coaches, and accelerate your trading journey
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/coaches">Find a Coach</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={REDDIT_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
              Join Reddit <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}