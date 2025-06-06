import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanActions } from "@/components/pricing/plan-actions";
import { getPlanById } from "@/lib/plans";

export function generateStaticParams() {
  return [
    { plan: 'basic' },
    { plan: 'pro' },
    { plan: 'enterprise' }
  ];
}

export default function PlanPage({ params }: { params: { plan: string } }) {
  const plan = getPlanById(params.plan);

  if (!plan) {
    return notFound();
  }

  return (
    <div className="container py-16 space-y-8">
      <Link 
        href="/pricing" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
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
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p>{feature}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <PlanActions planType={plan.id} />
        </Card>
      </div>
    </div>
  );
}