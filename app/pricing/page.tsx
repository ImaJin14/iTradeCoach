"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  role: string;
  features: string[];
}

interface UserProfile {
  role: string;
  subscription_status: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          // Not authenticated - show general pricing
          await fetchPlans('student');
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setUserProfile(profile);
        
        // Fetch plans based on user role
        await fetchPlans(profile.role);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing information. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [toast]);

  async function fetchPlans(role: string) {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('role', role)
        .order('price');

      if (error) throw error;

      const formattedPlans = data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        role: plan.role,
        features: plan.features || []
      })) || [];

      setPlans(formattedPlans);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    }
  }

  async function handleSubscribe(planId: string) {
    if (!userProfile) {
      router.push('/sign-up');
      return;
    }

    setSubscribing(planId);
    try {
      // TODO: Implement actual subscription logic
      toast({
        title: "Coming Soon",
        description: "Subscription functionality will be available soon. Please contact support for now.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('basic') || planName.toLowerCase().includes('monthly')) {
      return <Zap className="h-6 w-6" />;
    }
    if (planName.toLowerCase().includes('pro') || planName.toLowerCase().includes('yearly')) {
      return <Crown className="h-6 w-6" />;
    }
    return <Star className="h-6 w-6" />;
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    if (plan.interval === 'year') {
      return <Badge className="bg-green-500 hover:bg-green-600">Save 20%</Badge>;
    }
    if (plan.name.toLowerCase().includes('pro')) {
      return <Badge variant="secondary">Most Popular</Badge>;
    }
    return null;
  };

  const getButtonText = (plan: SubscriptionPlan) => {
    if (!userProfile) return "Get Started";
    if (userProfile.subscription_status === 'active') return "Current Plan";
    return subscribing === plan.id ? "Processing..." : "Subscribe Now";
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return userProfile?.subscription_status === 'active';
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    if (plan.interval === 'year') {
      return {
        display: `$${Math.round(plan.price / 12)}`,
        period: '/month',
        subtitle: `Billed annually ($${plan.price}/year)`
      };
    }
    return {
      display: `$${plan.price}`,
      period: `/${plan.interval}`,
      subtitle: null
    };
  };

  if (loading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          {userProfile?.role === 'coach' ? 'Coach Subscription Plans' : 'Simple, Transparent Pricing'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {userProfile?.role === 'coach' 
            ? 'Choose the perfect plan to grow your coaching business'
            : 'Choose the perfect plan to accelerate your trading journey'
          }
        </p>
        {userProfile?.role === 'coach' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              <strong>Coach Subscription Required:</strong> To start accepting students and earning on our platform, 
              you need an active subscription. This helps us maintain platform quality and provide you with the best tools.
            </p>
          </div>
        )}
      </div>

      {/* Centered plans container */}
      <div className="flex justify-center">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          {plans.map((plan) => {
            const priceInfo = formatPrice(plan);
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isCurrentPlan(plan) ? 'ring-2 ring-primary' : ''
                } ${plan.interval === 'year' ? 'border-green-200 dark:border-green-800' : ''}`}
              >
                {getPlanBadge(plan) && (
                  <div className="absolute -top-2 -right-2 z-10">
                    {getPlanBadge(plan)}
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{priceInfo.display}</span>
                    <span className="text-muted-foreground">{priceInfo.period}</span>
                    {priceInfo.subtitle && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {priceInfo.subtitle}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id || isCurrentPlan(plan)}
                    variant={isCurrentPlan(plan) ? "secondary" : plan.interval === 'year' ? "default" : "outline"}
                  >
                    {getButtonText(plan)}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {userProfile?.role === 'coach' && (
        <div className="text-center space-y-6 bg-muted/50 py-16 rounded-lg">
          <h2 className="text-3xl font-bold">Why Subscribe as a Coach?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Platform Quality</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Subscriptions help us maintain high platform standards and attract serious students.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Professional Tools</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Access advanced coaching tools, analytics, and student management features.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Verified Status</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Subscription includes profile verification and priority placement in search results.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-4 pt-8">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          <>
            {(userProfile?.role === 'coach' ? [
              {
                q: "Why do coaches need a subscription?",
                a: "Subscriptions help us maintain platform quality, provide professional tools, and ensure serious commitment from coaches."
              },
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes, you can cancel anytime. Your access will continue until the end of your current billing period."
              },
              {
                q: "What happens if I don't subscribe?",
                a: "Without a subscription, you won't be able to accept new students or access coaching features on the platform."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 14-day money-back guarantee if you're not satisfied with our service."
              }
            ] : [
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
            ]).map((faq, i) => (
              <div key={i} className="space-y-2">
                <h3 className="font-medium">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </>
        </div>
      </div>
    </div>
  );
}