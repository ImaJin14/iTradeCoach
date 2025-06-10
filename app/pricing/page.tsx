"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Updated interface to match schema with nullable fields
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  role: 'student' | 'coach' | 'admin';
  features: string[];
  created_at: string | null;
  updated_at: string | null;
}

// Updated to handle nullable fields from database
interface UserProfile {
  id: string;
  role: 'student' | 'coach' | 'admin';
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled';
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string;
}

// Raw database types (with nullable fields)
interface RawUserProfile {
  id: string;
  role: string | null;
  subscription_status: string | null;
}

interface RawUserSubscription {
  id: string;
  plan_id: string | null;
  status: string;
  current_period_end: string;
}

// ✅ FIXED: Helper function to safely extract strings from Json array
function extractStringArray(jsonArray: any): string[] {
  if (!Array.isArray(jsonArray)) {
    return [];
  }
  
  return jsonArray
    .filter(item => typeof item === 'string' && item !== null)
    .map(item => String(item));
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
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
        const { data: rawProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, subscription_status')
          .eq('id', user.id)
          .single() as { data: RawUserProfile | null; error: any };

        if (profileError) throw profileError;

        // Validate and transform the profile data
        if (!rawProfile || !rawProfile.role) {
          throw new Error('Invalid profile data');
        }

        // Type guard to ensure role is valid
        const validRoles = ['student', 'coach', 'admin'] as const;
        if (!validRoles.includes(rawProfile.role as any)) {
          throw new Error('Invalid user role');
        }

        // Type guard to ensure subscription_status is valid
        const validStatuses = ['none', 'active', 'past_due', 'canceled'] as const;
        const subscriptionStatus = validStatuses.includes(rawProfile.subscription_status as any) 
          ? rawProfile.subscription_status as 'none' | 'active' | 'past_due' | 'canceled'
          : 'none';

        const profile: UserProfile = {
          id: rawProfile.id,
          role: rawProfile.role as 'student' | 'coach' | 'admin',
          subscription_status: subscriptionStatus
        };

        setUserProfile(profile);

        // Get user's current subscription
        const { data: rawSubscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('id, plan_id, status, current_period_end')
          .eq('prof_id', user.id)
          .eq('status', 'active')
          .maybeSingle() as { data: RawUserSubscription | null; error: any };

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          throw subscriptionError;
        }

        // Transform subscription data if it exists
        if (rawSubscription && rawSubscription.plan_id) {
          const validSubscriptionStatuses = ['active', 'canceled', 'past_due'] as const;
          const subscriptionStatus = validSubscriptionStatuses.includes(rawSubscription.status as any)
            ? rawSubscription.status as 'active' | 'canceled' | 'past_due'
            : 'active';

          const subscription: UserSubscription = {
            id: rawSubscription.id,
            plan_id: rawSubscription.plan_id,
            status: subscriptionStatus,
            current_period_end: rawSubscription.current_period_end
          };

          setUserSubscription(subscription);
        }
        
        // Fetch plans based on user role
        await fetchPlans(profile.role);
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing information. Please try again.",
          variant: "destructive",
        });
        // Fallback to student plans if there's an error
        await fetchPlans('student');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [toast]);

  async function fetchPlans(role: 'student' | 'coach' | 'admin') {
    try {
      // Raw type from database
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('role', role)
        .order('price');

      if (error) throw error;

      // ✅ FIXED: Transform raw data to properly typed plans with correct features handling
      const formattedPlans: SubscriptionPlan[] = data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        role: plan.role,
        // ✅ FIXED: Properly handle JSONB features field
        features: extractStringArray(plan.features),
        created_at: plan.created_at,
        updated_at: plan.updated_at
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
      // TODO: Implement actual subscription logic with Stripe/payment processing
      // This should create a new subscription record in the database
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
    const name = planName.toLowerCase();
    if (name.includes('monthly') || name.includes('basic')) {
      return <Zap className="h-6 w-6" />;
    }
    if (name.includes('yearly') || name.includes('annual')) {
      return <Crown className="h-6 w-6" />;
    }
    return <Star className="h-6 w-6" />;
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    if (plan.interval === 'year') {
      return <Badge className="bg-green-500 hover:bg-green-600">Save 20%</Badge>;
    }
    if (plan.name.toLowerCase().includes('yearly')) {
      return <Badge className="bg-green-500 hover:bg-green-600">Best Value</Badge>;
    }
    return null;
  };

  const getButtonText = (plan: SubscriptionPlan) => {
    if (!userProfile) return "Get Started";
    if (isCurrentPlan(plan)) return "Current Plan";
    if (subscribing === plan.id) return "Processing...";
    return "Subscribe Now";
  };

  // Fixed: Properly check if this is the user's current plan
  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return userSubscription?.plan_id === plan.id && userSubscription?.status === 'active';
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

      {/* Show current subscription info if user has one */}
      {userSubscription && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto text-center">
          <p className="text-primary font-medium">
            Current Plan: {plans.find(p => p.id === userSubscription.plan_id)?.name}
          </p>
          <p className="text-sm text-muted-foreground">
            Next billing: {new Date(userSubscription.current_period_end).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Centered plans container */}
      <div className="flex justify-center">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          {plans.map((plan) => {
            const priceInfo = formatPrice(plan);
            const isCurrentUserPlan = isCurrentPlan(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isCurrentUserPlan ? 'ring-2 ring-primary' : ''
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
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
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
                    disabled={subscribing === plan.id || isCurrentUserPlan}
                    variant={isCurrentUserPlan ? "secondary" : plan.interval === 'year' ? "default" : "outline"}
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
        </div>
      </div>
    </div>
  );
}