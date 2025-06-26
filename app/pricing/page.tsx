"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, Zap, RefreshCw } from "lucide-react";
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
  getActiveEntitlements,
  cleanup 
} from "@/lib/revenuecat";
import { CustomerInfo, Offering, Package, PurchasesError, ErrorCode } from '@revenuecat/purchases-js';

interface UserProfile {
  id: string;
  role: 'student' | 'coach' | 'admin';
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled';
  email?: string;
}

export default function PricingPage() {
  const [currentOffering, setCurrentOffering] = useState<Offering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const isInitialized = useRef(false);
  const router = useRouter();
  const { toast } = useToast();

  const initializeRevenueCat = useCallback(async () => {
    if (isInitialized.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting RevenueCat initialization...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Failed to get user information');
      }
      
      let userId: string | undefined;
      let userEmail: string | undefined;
      
      if (user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, subscription_status')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        if (profile) {
          const userProfileData = {
            ...profile,
            email: user.email
          } as UserProfile;
          
          setUserProfile(userProfileData);
          userId = user.id;
          userEmail = user.email;
        }
      }

      console.log('Configuring RevenueCat for user:', userId);
      
      // Configure RevenueCat
      await configureRevenueCat(userId);
      
      console.log('Getting customer info and offerings...');
      
      // Get customer info and offerings
      const [customerInfoResult, offeringsResult] = await Promise.all([
        getCustomerInfo(),
        getOfferings()
      ]);

      setCustomerInfo(customerInfoResult);
      
      // Set offering based on user role or default to current
      if (userProfile?.role === 'coach') {
        const coachOffering = offeringsResult.all['coach_plans'] || offeringsResult.current;
        setCurrentOffering(coachOffering);
      } else {
        const studentOffering = offeringsResult.all['student_plans'] || offeringsResult.current;
        setCurrentOffering(studentOffering);
      }

      console.log('✅ RevenueCat initialization complete');
      isInitialized.current = true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to initialize RevenueCat:', error);
      
      setError(errorMessage);
      
      // Show user-friendly error
      toast({
        title: "Loading Error",
        description: "Failed to load pricing information. Please refresh the page or try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, userProfile?.role]);

  useEffect(() => {
    initializeRevenueCat();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initializeRevenueCat]);

  const handlePurchase = async (pkg: Package) => {
    if (!userProfile) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase a subscription.",
      });
      router.push('/sign-up');
      return;
    }

    if (!customerInfo) {
      toast({
        title: "Error",
        description: "Customer information not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(pkg.identifier);

    try {
      console.log('Starting purchase for package:', pkg.identifier);
      
      // Purchase the package with user email
      const updatedCustomerInfo = await purchasePackage(pkg, userProfile.email);
      setCustomerInfo(updatedCustomerInfo);

      // Update subscription status in Supabase
      await updateSubscriptionStatus(updatedCustomerInfo);

      toast({
        title: "Purchase Successful! 🎉",
        description: "Your subscription has been activated. Welcome aboard!",
      });

      // Refresh the page to show updated subscription status
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Purchase error:', error);
      
      // Handle user cancellation gracefully
      if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
        console.log('User cancelled purchase');
        return; // Don't show error for cancellation
      }

      // Show appropriate error message
      let errorMessage = "Unable to complete purchase. Please try again.";
      
      if (error.message) {
        if (error.message.includes('cancelled')) {
          return; // Don't show error for cancellation
        } else if (error.message.includes('timeout')) {
          errorMessage = "Purchase timed out. Please check your payment and try again.";
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes('payment') || error.message.includes('card')) {
          errorMessage = "Payment failed. Please check your payment method and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const updateSubscriptionStatus = async (customerInfo: CustomerInfo) => {
    if (!userProfile) return;

    try {
      const activeEntitlements = getActiveEntitlements(customerInfo);
      const hasActiveSubscription = activeEntitlements.length > 0;

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: hasActiveSubscription ? 'active' : 'none',
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error updating subscription status:', error);
      } else {
        console.log('✅ Subscription status updated in Supabase');
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
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
    if (!product) return { display: 'Contact Sales', period: '', subtitle: null };

    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual');
    
    // Cast product to any to access dynamic properties
    const productAny = product as any;
    
    // Try to get price information from different possible properties
    let priceAmount: number | undefined;
    let formattedPrice: string | undefined;
    let currencyCode = 'USD';
    
    // Check for different possible price property structures
    if (productAny.price) {
      const priceObj = productAny.price;
      if (typeof priceObj === 'object') {
        priceAmount = priceObj.amount;
        formattedPrice = priceObj.formattedPrice;
        currencyCode = priceObj.currencyCode || currencyCode;
      } else {
        priceAmount = priceObj;
      }
    } else if (productAny.currentPrice) {
      const currentPrice = productAny.currentPrice;
      if (typeof currentPrice === 'object') {
        priceAmount = currentPrice.amount;
        formattedPrice = currentPrice.formattedPrice;
        currencyCode = currentPrice.currencyCode || currencyCode;
      } else {
        priceAmount = currentPrice;
      }
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
    
    if (isYearly && priceAmount) {
      // Calculate monthly price for yearly plans
      const yearlyDollarAmount = priceAmount / 100;
      const monthlyPrice = Math.round(yearlyDollarAmount / 12 * 100) / 100;
      
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
      display: formattedPrice || 'Contact Sales',
      period: pkg.identifier.includes('monthly') ? '/month' : '',
      subtitle: null
    };
  };

  const getPlanIcon = (pkg: Package) => {
    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual');
    if (isYearly) {
      return <Crown className="h-6 w-6 text-yellow-500" />;
    }
    return <Zap className="h-6 w-6 text-blue-500" />;
  };

  const getPlanBadge = (pkg: Package) => {
    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual');
    if (isYearly) {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Save 20%</Badge>;
    }
    return null;
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    isInitialized.current = false;
    initializeRevenueCat();
  };

  if (loading) {
    return (
      <div className="container py-16">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">
              {error}
            </p>
          </div>
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!currentOffering) {
    return (
      <div className="container py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pricing Unavailable</h1>
          <p className="text-muted-foreground mb-4">No pricing plans are currently available.</p>
          <Button onClick={handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
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
          <p className="text-primary font-medium flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
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
            const isPurchasingThis = purchasing === pkg.identifier;
            
            return (
              <Card 
                key={pkg.identifier}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isCurrentUserPlan ? 'ring-2 ring-primary bg-primary/5' : ''
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
                    disabled={isPurchasingThis || isCurrentUserPlan}
                    variant={isCurrentUserPlan ? "secondary" : isYearly ? "default" : "outline"}
                  >
                    {isCurrentUserPlan 
                      ? "Current Plan" 
                      : isPurchasingThis 
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