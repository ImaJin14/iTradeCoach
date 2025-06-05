"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const plans = {
  monthly: [
    {
      id: "basic",
      name: "Basic",
      description: "Perfect for getting started with trading",
      price: 49,
      features: [
        "2 coaching sessions per month",
        "Basic trading strategies",
        "Email support",
        "Community access",
        "Learning resources library"
      ],
      badge: null
    },
    {
      id: "pro",
      name: "Pro",
      description: "For serious traders looking to excel",
      price: 99,
      features: [
        "4 coaching sessions per month",
        "Advanced trading strategies",
        "Priority email & chat support",
        "Private community access",
        "Premium learning resources",
        "Weekly market analysis",
        "Trading journal review"
      ],
      badge: "Most Popular"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Custom solutions for teams and institutions",
      price: 299,
      features: [
        "Unlimited coaching sessions",
        "Custom trading strategies",
        "24/7 dedicated support",
        "Private community",
        "Enterprise resources",
        "Daily market analysis",
        "Portfolio review",
        "Team training",
        "Custom reporting"
      ],
      badge: "Custom"
    }
  ],
  yearly: [
    {
      id: "basic",
      name: "Basic",
      description: "Perfect for getting started with trading",
      price: 39,
      features: [
        "2 coaching sessions per month",
        "Basic trading strategies",
        "Email support",
        "Community access",
        "Learning resources library"
      ],
      badge: "Save 20%"
    },
    {
      id: "pro",
      name: "Pro",
      description: "For serious traders looking to excel",
      price: 79,
      features: [
        "4 coaching sessions per month",
        "Advanced trading strategies",
        "Priority email & chat support",
        "Private community access",
        "Premium learning resources",
        "Weekly market analysis",
        "Trading journal review"
      ],
      badge: "Most Popular"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Custom solutions for teams and institutions",
      price: 239,
      features: [
        "Unlimited coaching sessions",
        "Custom trading strategies",
        "24/7 dedicated support",
        "Private community",
        "Enterprise resources",
        "Daily market analysis",
        "Portfolio review",
        "Team training",
        "Custom reporting"
      ],
      badge: "Custom"
    }
  ]
};

export default function PricingPage() {
  return (
    <div className="container py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan to accelerate your trading journey
        </p>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="space-y-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.monthly.map((plan) => (
              <Card key={plan.id} className="relative flex flex-col">
                {plan.badge && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge variant={plan.badge === "Most Popular" ? "default" : "secondary"} className="px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant={plan.badge === "Most Popular" ? "default" : "outline"}>
                    <Link href={`/pricing/${plan.id}`}>
                      {plan.id === "enterprise" ? "Contact Sales" : "Get Started"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.yearly.map((plan) => (
              <Card key={plan.id} className="relative flex flex-col">
                {plan.badge && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <Badge variant={plan.badge === "Most Popular" ? "default" : "secondary"} className="px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" variant={plan.badge === "Most Popular" ? "default" : "outline"}>
                    <Link href={`/pricing/${plan.id}`}>
                      {plan.id === "enterprise" ? "Contact Sales" : "Get Started"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-center space-y-4 pt-8">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {[
            {
              q: "Can I switch plans later?",
              a: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards, cryptocurrency payments, and bank transfers for enterprise plans."
            },
            {
              q: "Is there a refund policy?",
              a: "Yes, we offer a 14-day money-back guarantee if you're not satisfied with our service."
            },
            {
              q: "Do you offer custom plans?",
              a: "Yes, our enterprise plan can be customized to meet your specific needs. Contact our sales team for details."
            }
          ].map((faq, i) => (
            <div key={i} className="space-y-2">
              <h3 className="font-medium">{faq.q}</h3>
              <p className="text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}