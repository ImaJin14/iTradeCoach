import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanActions } from "@/components/pricing/plan-actions";
import { supabase } from "@/lib/supabase";

// Define the type based on your schema with proper JSON handling
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  role: 'student' | 'coach' | 'admin';
  features: string[]; // We'll transform the Json to string[]
  created_at: string | null;
  updated_at: string | null;
}

// Raw type from Supabase
interface RawSubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  role: 'student' | 'coach' | 'admin';
  features: any; // This is the Json type from Supabase
  created_at: string | null;
  updated_at: string | null;
}

export function generateStaticParams() {
  return [
    { plan: 'student-monthly' },
    { plan: 'student-yearly' },
    { plan: 'coach-monthly' },
    { plan: 'coach-yearly' }
  ];
}

async function getPlanFromDatabase(planId: string): Promise<SubscriptionPlan | null> {
  const { data: rawPlan, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single() as { data: RawSubscriptionPlan | null; error: any };

  if (error) {
    console.error('Error fetching plan:', error);
    return null;
  }

  if (!rawPlan) {
    return null;
  }

  // Transform the raw plan to match our expected type
  const plan: SubscriptionPlan = {
    ...rawPlan,
    features: Array.isArray(rawPlan.features) 
      ? rawPlan.features 
      : rawPlan.features 
        ? [rawPlan.features] 
        : []
  };

  return plan;
}

export default async function PlanPage({ 
  params 
}: { 
  params: Promise<{ plan: string }> 
}) {
  const resolvedParams = await params;
  const plan = await getPlanFromDatabase(resolvedParams.plan);

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
            <span className="text-5xl font-bold">${plan.price}</span>
            <span className="text-muted-foreground">/{plan.interval}</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>
              Detailed breakdown of features and benefits for {plan.role}s
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
          {/* Fixed: Use only planType as expected by the component */}
          <PlanActions planType={plan.id} />
        </Card>
      </div>
    </div>
  );
}