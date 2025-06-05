"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PACKAGE_IDS = {
  basic: "basic_monthly",
  pro: "pro_monthly",
  enterprise: "enterprise_monthly"
};

export function PlanActions({ planType }: { planType: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (planType === "enterprise") {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement web-compatible subscription flow
      toast({
        title: "Coming Soon",
        description: "Online subscription functionality will be available soon. Please contact sales for now.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardFooter>
        {planType === "enterprise" ? (
          <Button asChild className="w-full\" size="lg">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        ) : (
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Subscribe Now"}
          </Button>
        )}
      </CardFooter>

      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground">
            Our team is here to help you find the perfect plan for your needs.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/faq">View FAQ</Link>
          </Button>
        </div>
      </div>
    </>
  );
}