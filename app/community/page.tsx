import Link from "next/link";
import { ArrowRight, Users, MessageSquare, Trophy, Star, Calendar, Award, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const REDDIT_COMMUNITY_URL = "https://reddit.com/r/iTradeCoach";

export default function CommunityPage() {
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

      <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
        {[
          {
            title: "Active Members",
            value: "5,000+",
            icon: Users,
            description: "Traders worldwide"
          },
          {
            title: "Daily Challenges",
            value: "10+",
            icon: Trophy,
            description: "Fun trading games"
          },
          {
            title: "Monthly Events",
            value: "20+",
            icon: Calendar,
            description: "Webinars & contests"
          },
          {
            title: "Expert Coaches",
            value: "50+",
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

      <Tabs defaultValue="challenges" className="max-w-5xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges">Trading Challenges</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          <TabsTrigger value="discussions">Active Discussions</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "My Worst Trade Ever Tournament",
                description: "Share your biggest trading mishap and the lessons learned. Weekly winners get free coaching sessions!",
                participants: 234,
                prize: "2 Coaching Sessions",
                endDate: "June 15, 2025",
                redditUrl: `${REDDIT_COMMUNITY_URL}/worst-trade-tournament`
              },
              {
                title: "Fake Guru Bingo",
                description: "Spot and report common trading scams. Help protect the community while earning rewards!",
                participants: 156,
                prize: "Community Badge",
                endDate: "June 18, 2025",
                redditUrl: `${REDDIT_COMMUNITY_URL}/fake-guru-bingo`
              },
              {
                title: "Trading Strategy Mad Libs",
                description: "Create hilarious (but educational) trading strategies. Best ones get featured in our newsletter!",
                participants: 189,
                prize: "Featured Strategy",
                endDate: "June 20, 2025",
                redditUrl: `${REDDIT_COMMUNITY_URL}/trading-mad-libs`
              },
              {
                title: "Crypto Crystal Ball",
                description: "Make the most creative (and surprisingly accurate) price predictions. Monthly winners announced!",
                participants: 312,
                prize: "Premium Access",
                endDate: "June 30, 2025",
                redditUrl: `${REDDIT_COMMUNITY_URL}/crypto-crystal-ball`
              }
            ].map((challenge, i) => (
              <Card key={i}>
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
                      <div className="font-medium">{challenge.endDate}</div>
                    </div>
                  </div>
                  <Button asChild className="w-full mt-4">
                    <a href={challenge.redditUrl} target="_blank" rel="noopener noreferrer">
                      Join Challenge <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {[
              {
                title: "Market Analysis Workshop",
                date: "June 15, 2025",
                time: "2:00 PM UTC",
                host: "Sarah Johnson",
                hostImage: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg",
                type: "Workshop",
                redditUrl: `${REDDIT_COMMUNITY_URL}/market-analysis-workshop`
              },
              {
                title: "Trading Memes Contest",
                date: "June 16, 2025",
                time: "All Day",
                host: "Community Team",
                hostImage: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
                type: "Contest",
                redditUrl: `${REDDIT_COMMUNITY_URL}/meme-contest`
              },
              {
                title: "Technical Trading Masterclass",
                date: "June 18, 2025",
                time: "3:00 PM UTC",
                host: "Mark Chen",
                hostImage: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
                type: "Masterclass",
                redditUrl: `${REDDIT_COMMUNITY_URL}/technical-masterclass`
              }
            ].map((event, i) => (
              <Card key={i}>
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
                          <AvatarImage src={event.hostImage} />
                          <AvatarFallback>{event.host[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">Hosted by {event.host}</span>
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="mt-6">
          <div className="space-y-4">
            {[
              {
                title: "Share your funniest trading mistake",
                author: "Michael T.",
                authorImage: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
                replies: 45,
                category: "Community",
                redditUrl: `${REDDIT_COMMUNITY_URL}/funny-mistakes`
              },
              {
                title: "Technical analysis tools comparison",
                author: "Jessica L.",
                authorImage: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
                replies: 15,
                category: "Analysis",
                redditUrl: `${REDDIT_COMMUNITY_URL}/ta-tools`
              },
              {
                title: "Best trading memes of the week",
                author: "David W.",
                authorImage: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg",
                replies: 67,
                category: "Fun",
                redditUrl: `${REDDIT_COMMUNITY_URL}/weekly-memes`
              }
            ].map((discussion, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium mb-2">{discussion.title}</h3>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={discussion.authorImage} />
                            <AvatarFallback>{discussion.author[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{discussion.author}</span>
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
            ))}
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