import Link from "next/link";
import { ArrowRight, Award, Calendar, Shield, BarChart4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CoachShowcase from "@/components/home/coach-showcase";
import TestimonialCarousel from "@/components/home/testimonial-carousel";
import PlatformStats from "@/components/home/platform-stats";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <section className="relative w-full pt-20 md:pt-24 lg:pt-32 pb-16 md:pb-20 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background -z-10" />
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Elevate Your Trading Knowledge with Expert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">Coaches</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with verified trading experts for personalized 1-on-1 coaching sessions tailored to your learning goals and experience level.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/coaches">Find a Coach</Link>
            </Button>
          </div>
          
          <div className="mt-16 md:mt-24">
            <PlatformStats />
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section className="py-16 md:py-24 bg-muted/50 w-full">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-muted-foreground">Three simple steps to start your crypto learning journey</p>
          </div>
          
          <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Find Your Coach",
                description: "Browse our marketplace of verified crypto experts and find the perfect match for your goals and budget.",
                icon: "🔍",
                color: "from-blue-500/20 to-blue-500/5"
              },
              {
                title: "Book a Session",
                description: "Schedule a 1-on-1 coaching session at a time that works for you, with secure payment handling.",
                icon: "📅",
                color: "from-teal-500/20 to-teal-500/5"
              },
              {
                title: "Learn & Grow",
                description: "Connect with your coach, receive personalized guidance, and track your progress over time.",
                icon: "🚀",
                color: "from-violet-500/20 to-violet-500/5"
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className={`rounded-lg p-6 bg-gradient-to-br ${step.color} border border-border h-full`}>
                  <div className="text-3xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-medium mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-muted-foreground">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Coaches */}
      <section className="py-16 md:py-24 w-full">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Featured Coaches</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Learn from industry professionals with proven track records
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/coaches">View All Coaches</Link>
            </Button>
          </div>
          
          <div className="max-w-7xl mx-auto">
            <CoachShowcase />
          </div>
          
          <div className="mt-12 text-center">
            <Button asChild size="lg">
              <Link href="/coaches">Find Your Coach <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-muted/50 w-full">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">What Our Students Say</h2>
            <p className="mt-4 text-muted-foreground">
              Real stories from people who transformed their crypto knowledge
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <TestimonialCarousel />
          </div>
        </div>
      </section>
      
      {/* Learning Paths */}
      <section className="py-16 md:py-24 w-full">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Learning Paths</h2>
            <p className="mt-4 text-muted-foreground">
              Structured curriculums designed for every experience level
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                title: "Beginner",
                description: "Master the fundamentals of cryptocurrency and blockchain technology",
                topics: ["Crypto Basics", "Wallet Setup", "Exchange Trading", "Security Fundamentals"],
                color: "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10"
              },
              {
                title: "Intermediate",
                description: "Dive deeper into DeFi, NFTs, and investment strategies",
                topics: ["DeFi Protocols", "Yield Farming", "NFT Marketplaces", "Technical Analysis"],
                color: "border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10"
              },
              {
                title: "Advanced",
                description: "Explore complex topics like tokenomics, DAOs and development",
                topics: ["Smart Contracts", "Tokenomics", "DAO Governance", "Market Analysis"],
                color: "border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
              }
            ].map((path, i) => (
              <Card key={i} className={`transition-colors ${path.color}`}>
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
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/learn/${path.title.toLowerCase()}`}>
                      Explore Path
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground w-full">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Master Cryptocurrency?</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
            Join thousands of students who are accelerating their crypto journey with personalized coaching
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/sign-up">Get Started Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}