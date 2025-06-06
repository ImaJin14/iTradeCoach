import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/plans";

interface PlanCardProps {
  plan: Plan;
  featured?: boolean;
  period?: "monthly" | "yearly";
}

export function PlanCard({ plan, featured = false, period = "monthly" }: PlanCardProps) {
  return (
    <Card className="relative flex flex-col">
      {plan.badge && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge 
            variant={plan.badge === "Most Popular" ? "default" : "secondary"} 
            className="px-3 py-1"
          >
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
          {typeof plan.price === "number" ? (
            <>
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground">/{period === "yearly" ? "mo" : "month"}</span>
              {period === "yearly" && (
                <div className="text-sm text-muted-foreground mt-1">
                  Billed annually
                </div>
              )}
            </>
          ) : (
            <span className="text-4xl font-bold">Custom Pricing</span>
          )}
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
        <Button 
          asChild 
          className="w-full" 
          variant={featured ? "default" : "outline"}
        >
          <Link href={`/pricing/${plan.id}`}>
            {plan.id === "enterprise" ? "Contact Sales" : "Get Started"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}