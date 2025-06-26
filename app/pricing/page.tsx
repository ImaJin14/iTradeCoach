"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Star, Zap, RefreshCw, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  configureRevenueCat, 
  getCustomerInfo, 
  getOfferingsForRole,
  purchasePackage,
  hasEntitlement,
  getActiveEntitlements,
  getSubscriptionDetails,
  cleanup 
} from "@/lib/revenuecat";
import { CustomerInfo, Offering, Package, PurchasesError, ErrorCode } from '@revenuecat/purchases-js';
import { SubscriptionManager } from "@/components/subscription/subscription-manager";

interface UserProfile {
  id: string;
  role: 'student' | 'coach' | 'admin';
  subscription_status: 'none' | 'active' | 'past_due' | 'canceled';
  email?: string;
}

export default function PricingPage() {
  const [currentOffering, setCurrentOffering] = useState<Offering | null>(null);
  const [roleSpecificOffering, setRoleSpecificOffering] = useState<Offering | null>(null);
  const [allOfferings, setAllOfferings] = useState<Record<string, Offering>>({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
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
        setIsLoggedIn(false);
        setUserProfile(null);
      }
      
      let userId: string | undefined;
      let userEmail: string | undefined;
      let userRole: string | undefined;
      
      if (user) {
  setIsLoggedIn(true);
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
    // Explicitly handle the null to undefined conversion
    userRole = profile.role ? profile.role : undefined;
  }
} else {
  setIsLoggedIn(false);
  setUserProfile(null);
}

      console.log('Configuring RevenueCat for user:', userId, 'role:', userRole);
      
      // Configure RevenueCat
      await configureRevenueCat(userId);
      
      console.log('Getting customer info and offerings...');
      
      // Get customer info and role-specific offerings
      const [customerInfoResult, offeringsResult] = await Promise.all([
        getCustomerInfo(),
        getOfferingsForRole(userRole)
      ]);

      setCustomerInfo(customerInfoResult);
      setCurrentOffering(offeringsResult.current);
      setAllOfferings(offeringsResult.all);
      
      // Set the offering to display based on user role
      if (userRole && offeringsResult.roleSpecific) {
        console.log(`✅ Using ${userRole}-specific offering`);
        setRoleSpecificOffering(offeringsResult.roleSpecific);
      } else {
        console.log('✅ Using default offering');
        setRoleSpecificOffering(offeringsResult.current);
      }

      console.log('✅ RevenueCat initialization complete');
      isInitialized.current = true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to initialize RevenueCat:', error);
      
      setError(errorMessage);
      
      toast({
        title: "Loading Error",
        description: "Failed to load pricing information. Please refresh the page or try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    initializeRevenueCat();
    
    return () => {
      cleanup();
    };
  }, [initializeRevenueCat]);

  // Add new plan change handler
  const handlePlanChange = (newPackage: Package) => {
    const subscriptionDetails = getSubscriptionDetails(customerInfo!);
    const currentPlan = subscriptionDetails.currentPlan;
    const newPlan = newPackage.webBillingProduct?.displayName || newPackage.identifier;
    
    // Show confirmation dialog for plan change
    toast({
      title: "Plan Change Required",
      description: `To switch from ${currentPlan} to ${newPlan}, you'll need to manage your current subscription first.`,
      action: (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setShowManagement(true)}
          >
            Manage Subscription
          </Button>
        </div>
      ),
    });
  };

  const handlePurchase = async (pkg: Package) => {
    if (!isLoggedIn) {
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

    const isCurrentUserPlan = isCurrentPlan(pkg);
    const subscriptionDetails = getSubscriptionDetails(customerInfo);
    
    if (isCurrentUserPlan) {
      setShowManagement(true);
      return;
    }

    // If user has an active subscription, show plan change confirmation
    if (subscriptionDetails.hasActiveSubscription) {
      handlePlanChange(pkg);
      return;
    }

    // New subscription for users without active plans
    setPurchasing(pkg.identifier);

    try {
      console.log('Starting purchase for package:', pkg.identifier);
      
      const updatedCustomerInfo = await purchasePackage(pkg, userProfile?.email);
      setCustomerInfo(updatedCustomerInfo);

      await updateSubscriptionStatus(updatedCustomerInfo);

      toast({
        title: "Purchase Successful! 🎉",
        description: "Your subscription has been activated. Welcome aboard!",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Purchase error:', error);
      
      if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
        console.log('User cancelled purchase');
        return;
      }

      let errorMessage = "Unable to complete purchase. Please try again.";
      
      if (error.message && !error.message.includes('cancelled')) {
        if (error.message.includes('already subscribed')) {
          errorMessage = "You already have an active subscription. Use the manage option to change plans.";
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
    
    const subscriptionDetails = getSubscriptionDetails(customerInfo);
    return subscriptionDetails.productIdentifier === pkg.webBillingProduct?.identifier;
  };

  const getButtonText = (pkg: Package): string => {
    if (!isLoggedIn) return "Subscribe Now";
    
    const isCurrentUserPlan = isCurrentPlan(pkg);
    const isPurchasingThis = purchasing === pkg.identifier;
    const isHovered = hoveredCard === pkg.identifier;
    const subscriptionDetails = customerInfo ? getSubscriptionDetails(customerInfo) : null;
    
    if (isPurchasingThis) return "Processing...";
    if (isCurrentUserPlan) return "Current Plan";
    
    // If user has active subscription and this isn't their current plan
    if (subscriptionDetails?.hasActiveSubscription && !isCurrentUserPlan) {
      if (isHovered) return "Change Plan";
      return "Subscribe Now";
    }
    
    return "Subscribe Now";
  };

  const getButtonVariant = (pkg: Package): "default" | "secondary" | "outline" => {
    const isCurrentUserPlan = isCurrentPlan(pkg);
    const isYearly = pkg.identifier.includes('annual');
    
    if (isCurrentUserPlan) return "secondary";
    if (isYearly) return "default";
    return "outline";
  };

  // Use role-specific offering for filtering
  const getFilteredAndSortedPackages = (): Package[] => {
    const offeringToUse = roleSpecificOffering || currentOffering;
    if (!offeringToUse) return [];
    
    let packages = [...offeringToUse.availablePackages];
    
    console.log('Available packages for role:', packages.map(p => ({
      identifier: p.identifier,
      displayName: p.webBillingProduct?.displayName
    })));
    
    // Sort: monthly plans first, then yearly
    packages.sort((a, b) => {
      const aIsYearly = a.identifier.includes('annual');
      const bIsYearly = b.identifier.includes('annual');
      
      if (aIsYearly && !bIsYearly) return 1;
      if (!aIsYearly && bIsYearly) return -1;
      return 0;
    });
    
    return packages;
  };

  const formatPrice = (pkg: Package) => {
    const product = pkg.webBillingProduct;
    if (!product) return { display: 'Contact Sales', period: '', subtitle: null };

    const isYearly = pkg.identifier.includes('annual');
    const productAny = product as any;
    
    let priceAmount: number | undefined;
    let formattedPrice: string | undefined;
    let currencyCode = 'USD';
    
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
    
    if (priceAmount && !formattedPrice) {
      const dollarAmount = priceAmount / 100;
      formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(dollarAmount);
    }
    
    if (isYearly && priceAmount) {
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
    const isYearly = pkg.identifier.includes('annual');
    if (isYearly) {
      return <Crown className="h-6 w-6 text-yellow-500" />;
    }
    return <Zap className="h-6 w-6 text-blue-500" />;
  };

  const getPlanBadge = (pkg: Package) => {
    const isYearly = pkg.identifier.includes('annual');
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

  const offeringToDisplay = roleSpecificOffering || currentOffering;
  if (!offeringToDisplay) {
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

  const filteredPackages = getFilteredAndSortedPackages();
  const subscriptionDetails = customerInfo ? getSubscriptionDetails(customerInfo) : null;

  // Show subscription management view ONLY when explicitly requested
  if (showManagement && isLoggedIn && customerInfo) {
    return (
      <div className="container py-16 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowManagement(false)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <SubscriptionManager
            customerInfo={customerInfo}
            currentOffering={offeringToDisplay}
            allOfferings={allOfferings}
            userProfile={userProfile}
            onSubscriptionChange={() => {
              isInitialized.current = false;
              initializeRevenueCat();
              setShowManagement(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-16 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          {isLoggedIn && userProfile?.role === 'coach' 
            ? 'Coach Subscription Plans' 
            : isLoggedIn && userProfile?.role === 'student'
            ? 'Student Subscription Plans'
            : 'Simple, Transparent Pricing'
          }
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {isLoggedIn && userProfile?.role === 'coach' 
            ? 'Choose the perfect plan to grow your coaching business'
            : isLoggedIn && userProfile?.role === 'student'
            ? 'Choose the perfect plan to accelerate your trading journey'
            : 'Choose the perfect plan for your role - student or coach'
          }
        </p>
        
        {!isLoggedIn && (
          <p className="text-sm text-muted-foreground">
            Sign in to see plans customized for your role
          </p>
        )}
      </div>

      {/* Show current subscription status */}
      {isLoggedIn && subscriptionDetails?.hasActiveSubscription && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <p className="text-primary font-medium flex items-center gap-2">
              <Check className="h-5 w-5" />
              Active Subscription: {subscriptionDetails.currentPlan}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManagement(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage
            </Button>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="flex justify-center">
        {filteredPackages.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            {filteredPackages.map((pkg) => {
              const priceInfo = formatPrice(pkg);
              const isCurrentUserPlan = isCurrentPlan(pkg);
              const isYearly = pkg.identifier.includes('annual');
              const isPurchasingThis = purchasing === pkg.identifier;
              
              return (
                <Card 
                  key={pkg.identifier}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    isCurrentUserPlan ? 'ring-2 ring-primary bg-primary/5' : ''
                  } ${isYearly ? 'border-green-200 dark:border-green-800' : ''}`}
                  onMouseEnter={() => setHoveredCard(pkg.identifier)}
                  onMouseLeave={() => setHoveredCard(null)}
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
                      disabled={isPurchasingThis}
                      variant={getButtonVariant(pkg)}
                    >
                      {getButtonText(pkg)}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">No pricing plans available for your role.</p>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Plans
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Update features function to handle actual package identifiers
function getFeaturesByPackage(packageId: string): string[] {
  const featureMap: Record<string, string[]> = {
    'student_monthly': [
      '2 coaching sessions per month',
      'Basic trading strategies', 
      'Email support',
      'Community access',
      'Learning resources library'
    ],
    'student_annual': [
      '2 coaching sessions per month',
      'Basic trading strategies',
      'Email support', 
      'Community access',
      'Learning resources library',
      'Save 20% with annual billing'
    ],
    'coach_monthly': [
      'Accept unlimited students',
      'Advanced coaching tools',
      'Priority support',
      'Analytics dashboard',
      'Revenue tracking',
      'Custom branding'
    ],
    'coach_annual': [
      'Accept unlimited students',
      'Advanced coaching tools', 
      'Priority support',
      'Analytics dashboard',
      'Revenue tracking',
      'Custom branding',
      'Save 20% with annual billing'
    ],
    // Fallback for generic packages
    '$rc_monthly': [
      'Monthly subscription',
      'Full platform access',
      'Basic support',
      'Community access'
    ],
    '$rc_annual': [
      'Annual subscription',
      'Full platform access',
      'Priority support',
      'Community access',
      'Save 20% vs monthly'
    ]
  };

  return featureMap[packageId] || [
    'Premium features included',
    'Full platform access',
    'Customer support'
  ];
}