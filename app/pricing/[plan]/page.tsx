import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanActions } from "@/components/pricing/plan-actions";

const plans = {
  basic: {
    name: "Basic Plan",
    price: 49,
    description: "Perfect for getting started with crypto trading",
    features: [
      {
        title: "Coaching Sessions",
        description: "2 one-on-one sessions per month with expert traders",
        included: true
      },
      {
        title: "Trading Strategies",
        description: "Learn fundamental analysis and basic technical indicators",
        included: true
      },
      {
        title: "Support",
        description: "Email support with 24-hour response time",
        included: true
      },
      {
        title: "Community Access",
        description: "Join our community of traders and learn together",
        included: true
      },
      {
        title: "Learning Resources",
        description: "Access to our basic library of trading resources",
        included: true
      },
      {
        title: "Market Analysis",
        description: "Weekly market updates and analysis",
        included: false
      },
      {
        title: "Portfolio Review",
        description: "Regular review of your trading portfolio",
        included: false
      }
    ]
  },
  pro: {
    name: "Pro Plan",
    price: 99,
    description: "For serious traders looking to excel",
    features: [
      {
        title: "Coaching Sessions",
        description: "4 one-on-one sessions per month with expert traders",
        included: true
      },
      {
        title: "Trading Strategies",
        description: "Advanced technical analysis and custom strategies",
        included: true
      },
      {
        title: "Priority Support",
        description: "Priority email and chat support with 4-hour response time",
        included: true
      },
      {
        title: "Private Community",
        description: "Access to exclusive pro trader community",
        included: true
      },
      {
        title: "Premium Resources",
        description: "Full access to premium learning materials and tools",
        included: true
      },
      {
        title: "Market Analysis",
        description: "Daily market updates and detailed analysis",
        included: true
      },
      {
        title: "Portfolio Review",
        description: "Weekly portfolio review and optimization",
        included: true
      }
    ]
  },
  enterprise: {
    name: "Enterprise Plan",
    price: "Custom",
    description: "Custom solutions for teams and institutions",
    features: [
      {
        title: "Coaching Sessions",
        description: "Unlimited one-on-one sessions with senior traders",
        included: true
      },
      {
        title: "Custom Strategies",
        description: "Tailored trading strategies for your team",
        included: true
      },
      {
        title: "Dedicated Support",
        description: "24/7 dedicated support team",
        included: true
      },
      {
        title: "Private Community",
        description: "Private community for your team members",
        included: true
      },
      {
        title: "Enterprise Resources",
        description: "Custom learning materials and proprietary tools",
        included: true
      },
      {
        title: "Team Training",
        description: "Regular team training sessions and workshops",
        included: true
      },
      {
        title: "Custom Reporting",
        description: "Detailed performance tracking and custom reports",
        included: true
      }
    ]
  }
};

export default function PlanPage({ params }: { params: { plan: string } }) {
  const plan = plans[params.plan as keyof typeof plans];

  if (!plan) {
    return notFound();
  }

  return (
    <div className="container py-16 space-y-8">
      <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to pricing
      </Link>

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{plan.name}</h1>
          <p className="text-xl text-muted-foreground">{plan.description}</p>
          <div className="flex justify-center items-baseline gap-2">
            {typeof plan.price === "number" ? (
              <>
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </>
            ) : (
              <span className="text-5xl font-bold">Custom Pricing</span>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>
              Detailed breakdown of features and benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1">
                    <Check className={`h-5 w-5 ${feature.included ? "text-primary" : "text-muted"}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <PlanActions planType={params.plan} />
        </Card>
      </div>
    </div>
  );
}