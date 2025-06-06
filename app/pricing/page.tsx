import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlanCard } from "@/components/pricing/plan-card";
import { planVariants, BILLING_PERIODS } from "@/lib/plans";

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

        {BILLING_PERIODS.map((period) => (
          <TabsContent key={period} value={period} className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
              {planVariants[period].map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  featured={plan.badge === "Most Popular"}
                  period={period}
                />
              ))}
            </div>
          </TabsContent>
        ))}
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