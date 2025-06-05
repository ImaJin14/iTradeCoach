import Link from "next/link";
import { ArrowRight, CheckCircle, Users, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorksPage() {
  return (
    <div className="container py-16 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">How iTradeCoach Works</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your journey to becoming a successful trader starts here
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
        {[
          {
            title: "1. Find Your Coach",
            description: "Browse our marketplace of verified trading experts and find the perfect match for your goals.",
            icon: Users,
          },
          {
            title: "2. Schedule Sessions",
            description: "Book one-on-one coaching sessions at times that work best for you.",
            icon: Calendar,
          },
          {
            title: "3. Learn & Grow",
            description: "Get personalized guidance, feedback, and support to accelerate your trading journey.",
            icon: MessageSquare,
          }
        ].map((step, i) => (
          <div key={i} className="relative">
            <Card>
              <CardHeader>
                <step.icon className="h-12 w-12 text-primary mb-4" />
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
            </Card>
            {i < 2 && (
              <div className="hidden md:block absolute top-1/2 -right-4 -translate-x-1/2 -translate-y-1/2">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Why Choose iTradeCoach?</h2>
          <p className="text-muted-foreground">
            We're committed to providing the highest quality trading education
          </p>
        </div>

        <div className="grid gap-6">
          {[
            {
              title: "Verified Experts",
              description: "All our coaches go through a rigorous verification process to ensure they have the expertise and experience to teach."
            },
            {
              title: "Personalized Learning",
              description: "Get customized guidance tailored to your trading goals, experience level, and preferred markets."
            },
            {
              title: "Flexible Scheduling",
              description: "Book sessions at times that work for you, with coaches available across different time zones."
            },
            {
              title: "Secure Platform",
              description: "Our platform provides a secure environment for scheduling, payments, and communication."
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

      <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
        <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join thousands of traders who are accelerating their growth with personalized coaching
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/coaches">Browse Coaches</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}