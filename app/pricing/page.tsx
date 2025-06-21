"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  configureRevenueCat, 
  getCustomerInfo, 
  getOfferings, 
  purchasePackage,
  hasEntitlement,
  getActiveEntitlements 
} from "@/lib/revenuecat";
import { CustomerInfo, Offering, Package, PurchasesError, ErrorCode } from '@revenuecat/purchases-js';

interface UserProfile {
  id: string;
  role: 'student' | 'coach' | 'admin';
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled';
}

export default function PricingPage() {
  const [currentOffering, setCurrentOffering] = useState<Offering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function initializeRevenueCat() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        let userId: string | undefined;
        
        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, subscription_status')
            .eq('id', user.id)
            .single();

          if (profile) {
            setUserProfile(profile as UserProfile);
            userId = user.id;
          }
        }

        // Configure RevenueCat
        await configureRevenueCat(userId);
        
        // Get customer info and offerings
        const [customerInfoResult, offeringsResult] = await Promise.all([
          getCustomerInfo(),
          getOfferings()
        ]);

        setCustomerInfo(customerInfoResult);
        
        // Set offering based on user role or default to current
        if (userProfile?.role === 'coach') {
          setCurrentOffering(offeringsResult.all['coach_plans'] || offeringsResult.current);
        } else {
          setCurrentOffering(offeringsResult.all['student_plans'] || offeringsResult.current);
        }

      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing information. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    initializeRevenueCat();
  }, [toast, userProfile?.role]);

  const handlePurchase = async (pkg: Package) => {
    if (!userProfile) {
      router.push('/sign-up');
      return;
    }

    setPurchasing(pkg.identifier);

    try {
      // Purchase the package
      const updatedCustomerInfo = await purchasePackage(pkg, userProfile.id);
      setCustomerInfo(updatedCustomerInfo);

      // Update subscription status in Supabase
      await updateSubscriptionStatus(updatedCustomerInfo);

      toast({
        title: "Purchase Successful!",
        description: "Your subscription has been activated. Welcome aboard!",
      });

    } catch (error: any) {
      console.error('Purchase error:', error);
      
      // Handle user cancellation gracefully
      if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
        return; // Don't show error for cancellation
      }

      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to complete purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const updateSubscriptionStatus = async (customerInfo: CustomerInfo) => {
    if (!userProfile) return;

    const activeEntitlements = getActiveEntitlements(customerInfo);
    const hasActiveSubscription = activeEntitlements.length > 0;

    await supabase
      .from('profiles')
      .update({
        subscription_status: hasActiveSubscription ? 'active' : 'none',
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id);
  };

  const isCurrentPlan = (pkg: Package): boolean => {
    if (!customerInfo) return false;
    
    // Check if user has active entitlements from this package
    return Object.values(customerInfo.entitlements.active).some(
      entitlement => entitlement.productIdentifier === pkg.webBillingProduct?.identifier
    );
  };

  const formatPrice = (pkg: Package) => {
    const product = pkg.webBillingProduct;
    if (!product) return { display: 'N/A', period: '', subtitle: null };

    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual');
    
    // Cast product to any to access dynamic properties
    const productAny = product as any;
    
    // Debug logging - remove this in production
    console.log('Package data:', {
      identifier: pkg.identifier,
      webBillingProduct: pkg.webBillingProduct,
      price: productAny?.price,
      currentPrice: productAny?.currentPrice
    });
    
    // Try to get price information from different possible properties
    let priceAmount: number | undefined;
    let formattedPrice: string | undefined;
    let currencyCode = 'USD'; // Default currency
    
    // Check for different possible price property structures
    if (productAny.price) {
      const priceObj = productAny.price;
      priceAmount = priceObj.amount || priceObj;
      formattedPrice = priceObj.formattedPrice;
      currencyCode = priceObj.currencyCode || currencyCode;
    } else if (productAny.currentPrice) {
      const currentPrice = productAny.currentPrice;
      priceAmount = currentPrice.amount || currentPrice;
      formattedPrice = currentPrice.formattedPrice;
      currencyCode = currentPrice.currencyCode || currencyCode;
    } else if (productAny.priceString) {
      formattedPrice = productAny.priceString;
    }
    
    // If we have a raw price amount but no formatted price, format it ourselves
    if (priceAmount && !formattedPrice) {
      // Convert from cents to dollars (assuming price is in cents)
      const dollarAmount = priceAmount / 100;
      formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(dollarAmount);
    }
    
    // If we still don't have a formatted price, use the raw amount with currency symbol
    if (priceAmount && !formattedPrice) {
      const dollarAmount = priceAmount / 100;
      formattedPrice = `${dollarAmount}`;
    }
    
    if (isYearly && priceAmount) {
      // Calculate monthly price for yearly plans (convert from cents first)
      const yearlyDollarAmount = priceAmount / 100;
      const monthlyPrice = Math.round(yearlyDollarAmount / 12 * 100) / 100; // Round to 2 decimal places
      
      const monthlyFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(monthlyPrice);
      
      return {
        display: monthlyFormatted,
        period: '/month',
        subtitle: `Billed annually (${formattedPrice}/year)`
      };
    }

    return {
      display: formattedPrice || 'Contact for pricing',
      period: pkg.identifier.includes('monthly') ? '/month' : '',
      subtitle: null
    };
  };

  const getPlanIcon = (pkg: Package) => {
    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual');
    if (isYearly) {
      return <Crown className="h-6 w-6" />;
    }
    return <Zap className="h-6 w-6" />;
  };

  const getPlanBadge = (pkg: Package) => {
    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual');
    if (isYearly) {
      return <Badge className="bg-green-500 hover:bg-green-600">Save 20%</Badge>;
    }
    return null;
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

  if (!currentOffering) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pricing Unavailable</h1>
          <p className="text-muted-foreground">Please try again later.</p>
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
      </div>

      {/* Show current subscription status */}
      {customerInfo && getActiveEntitlements(customerInfo).length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto text-center">
          <p className="text-primary font-medium">
            Active Subscription: {getActiveEntitlements(customerInfo).join(', ')}
          </p>
        </div>
      )}

      {/* Pricing cards */}
      <div className="flex justify-center">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          {currentOffering.availablePackages.map((pkg) => {
            const priceInfo = formatPrice(pkg);
            const isCurrentUserPlan = isCurrentPlan(pkg);
            const isYearly = pkg.identifier.includes('yearly');
            
            return (
              <Card 
                key={pkg.identifier}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isCurrentUserPlan ? 'ring-2 ring-primary' : ''
                } ${isYearly ? 'border-green-200 dark:border-green-800' : ''}`}
              >
                {getPlanBadge(pkg) && (
                  <div className="absolute -top-2 -right-2 z-10">
                    {getPlanBadge(pkg)}
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(pkg)}
                  </div>
                  <CardTitle className="text-2xl">
                    {pkg.webBillingProduct?.displayName || pkg.identifier}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {pkg.webBillingProduct?.description || 'Subscription plan'}
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
                    {/* You can add features here based on the package type */}
                    {getFeaturesByPackage(pkg.identifier).map((feature, i) => (
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
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing === pkg.identifier || isCurrentUserPlan}
                    variant={isCurrentUserPlan ? "secondary" : isYearly ? "default" : "outline"}
                  >
                    {isCurrentUserPlan 
                      ? "Current Plan" 
                      : purchasing === pkg.identifier 
                        ? "Processing..." 
                        : "Subscribe Now"
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper function to get features by package identifier
function getFeaturesByPackage(packageId: string): string[] {
  const featureMap: Record<string, string[]> = {
    'student_monthly_package': [
      '2 coaching sessions per month',
      'Basic trading strategies', 
      'Email support',
      'Community access',
      'Learning resources library'
    ],
    'student_yearly_package': [
      '2 coaching sessions per month',
      'Basic trading strategies',
      'Email support', 
      'Community access',
      'Learning resources library',
      'Save 20% with annual billing'
    ],
    'coach_monthly_package': [
      'Accept unlimited students',
      'Advanced coaching tools',
      'Priority support',
      'Analytics dashboard',
      'Revenue tracking',
      'Custom branding'
    ],
    'coach_yearly_package': [
      'Accept unlimited students',
      'Advanced coaching tools', 
      'Priority support',
      'Analytics dashboard',
      'Revenue tracking',
      'Custom branding',
      'Save 20% with annual billing'
    ]
  };

  return featureMap[packageId] || [
    'Premium features included',
    'Full platform access',
    'Customer support'
  ];
}

