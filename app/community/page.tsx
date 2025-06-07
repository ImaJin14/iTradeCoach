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
  dailyChallenges: number;
  monthlyEvents: number;
  expertCoaches: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  prize: string;
  endDate: string;
  redditUrl: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  host: {
    name: string;
    avatar_url: string | null;
  };
  type: string;
  redditUrl: string;
}

interface Discussion {
  id: string;
  title: string;
  author: {
    name: string;
    avatar_url: string | null;
  };
  replies: number;
  category: string;
  redditUrl: string;
}

const REDDIT_COMMUNITY_URL = "https://reddit.com/r/iTradeCoach";

export default function CommunityPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCommunityData() {
      try {
        // Fetch community stats
        const { data: coaches } = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('verification_status', 'verified');

        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('status', 'completed');

        const { data: challenges } = await supabase
          .from('challenges')
          .select(`
            id,
            title,
            description,
            participants,
            prize,
            end_date,
            reddit_url
          `)
          .eq('active', true)
          .order('created_at', { ascending: false });

        const { data: events } = await supabase
          .from('events')
          .select(`
            id,
            title,
            date,
            time,
            host:host_id (
              name,
              avatar_url
            ),
            type,
            reddit_url
          `)
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true });

        const { data: discussions } = await supabase
          .from('discussions')
          .select(`
            id,
            title,
            author:author_id (
              name,
              avatar_url
            ),
            replies,
            category,
            reddit_url
          `)
          .eq('active', true)
          .order('replies', { ascending: false });

        setStats({
          activeMembers: sessions?.length || 0,
          dailyChallenges: challenges?.length || 0,
          monthlyEvents: events?.length || 0,
          expertCoaches: coaches?.length || 0,
        });

        setChallenges(challenges || []);
        setEvents(events || []);
        setDiscussions(discussions || []);
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
          Connect, learn, and have fun with fellow traders
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
              title: "Daily Challenges",
              value: `${stats.dailyChallenges}+`,
              icon: Trophy,
              description: "Fun trading games"
            },
            {
              title: "Monthly Events",
              value: `${stats.monthlyEvents}+`,
              icon: Calendar,
              description: "Webinars & contests"
            },
            {
              title: "Expert Coaches",
              value: `${stats.expertCoaches}+`,
              icon: Award,
              description: "Verified professionals"
            }
          ].map((stat, i) => (
            <Card key={i}>
              <CardHeader>
                <stat.icon className="h-8 w-8 text-primary mb-4" />
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
                <CardDescription>
                  <div className="font-medium text-foreground">{stat.title}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="challenges" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges">Trading Challenges</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          <TabsTrigger value="discussions">Active Discussions</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <Card key={challenge.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{challenge.title}</CardTitle>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Participants</div>
                        <div className="font-medium">{challenge.participants}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Prize</div>
                        <div className="font-medium">{challenge.prize}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Ends</div>
                        <div className="font-medium">{new Date(challenge.endDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <Button asChild className="w-full mt-4">
                      <a href={challenge.redditUrl} target="_blank" rel="noopener noreferrer">
                        Join Challenge <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No active challenges at the moment
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {events.length > 0 ? (
              events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{event.title}</h3>
                          <Badge>{event.type}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {event.date} at {event.time}
                        </div>
                        <div className="flex items-center mt-2">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage 
                              src={event.host.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id}`} 
                            />
                            <AvatarFallback>{event.host.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">Hosted by {event.host.name}</span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={event.redditUrl} target="_blank" rel="noopener noreferrer">
                          Join Event <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No upcoming events at the moment
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="mt-6">
          <div className="space-y-4">
            {discussions.length > 0 ? (
              discussions.map((discussion) => (
                <Card key={discussion.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium mb-2">{discussion.title}</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage 
                                src={discussion.author.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${discussion.id}`} 
                              />
                              <AvatarFallback>{discussion.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{discussion.author.name}</span>
                          </div>
                          <Badge variant="secondary">{discussion.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {discussion.replies} replies
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <a href={discussion.redditUrl} target="_blank" rel="noopener noreferrer">
                          View Thread <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No active discussions at the moment
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Join the Fun?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow traders, participate in challenges, and learn while having fun
        </p>
        <Button asChild size="lg">
          <a href={REDDIT_COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
            Join Our Reddit Community <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}