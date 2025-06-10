import { z } from "zod";

export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.union([z.number(), z.literal("Custom")]),
  features: z.array(z.string()),
  badge: z.string().nullable(),
});

export type Plan = z.infer<typeof planSchema>;

export const BILLING_PERIODS = ["monthly", "yearly"] as const;
export type BillingPeriod = typeof BILLING_PERIODS[number];

const createPlanVariants = (plans: Record<string, Plan>): Record<BillingPeriod, Plan[]> => {
  return {
    monthly: Object.values(plans),
    yearly: Object.values(plans).map(plan => ({
      ...plan,
      price: typeof plan.price === "number" ? Math.round(plan.price * 0.8) : plan.price,
      badge: plan.id === "basic" ? "Save 20%" : plan.badge,
    })),
  };
};

export const plans: Record<string, Plan> = {
  basic: {
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
    badge: null,
  },
  pro: {
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
    badge: "Most Popular",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for teams and institutions",
    price: "Custom",
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
    badge: "Custom",
  },
};

export const planVariants = createPlanVariants(plans);

export const getPlanById = (id: string): Plan | undefined => {
  return plans[id as keyof typeof plans];
};

export const formatPrice = (price: number | string, period?: BillingPeriod): string => {
  if (typeof price === "string") return price;
  return period === "yearly" 
    ? `$${price}/mo billed annually` 
    : `$${price}/month`;
};