"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Check, CreditCard, ArrowUpDown, Loader2 } from "lucide-react";
import { CustomerInfo, Package, Offering } from '@revenuecat/purchases-js';
import { getSubscriptionDetails, cancelSubscriptionInPlatform, purchasePackage } from "@/lib/revenuecat";

interface SubscriptionManagerProps {
  customerInfo: CustomerInfo;
  currentOffering: Offering | null;
  allOfferings: Record<string, Offering>;
  userProfile: any;
  onSubscriptionChange: () => void;
}

export function SubscriptionManager({ 
  customerInfo, 
  currentOffering,
  allOfferings,
  userProfile, 
  onSubscriptionChange 
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [changingToPlan, setChangingToPlan] = useState<Package | null>(null);
  const { toast } = useToast();

  const subscriptionDetails = getSubscriptionDetails(customerInfo);

  const handleCancelSubscription = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      const success = await cancelSubscriptionInPlatform(userProfile.id);
      
      if (success) {
        toast({
          title: "Subscription Cancelled ✅",
          description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        });
        onSubscriptionChange();
      } else {
        throw new Error('Cancellation was not successful');
      }

      setShowCancelConfirm(false);
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlan: Package) => {
    if (!userProfile?.id) return;

    setLoading(true);
    setChangingToPlan(newPlan);

    try {
      // Step 1: Cancel current subscription
      toast({
        title: "Processing Plan Change...",
        description: "Step 1: Cancelling current subscription",
      });

      const cancelSuccess = await cancelSubscriptionInPlatform(userProfile.id);
      
      if (!cancelSuccess) {
        throw new Error('Failed to cancel current subscription');
      }

      // Step 2: Wait a moment for the cancellation to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Purchase new plan
      toast({
        title: "Processing Plan Change...",
        description: "Step 2: Activating new subscription",
      });

      await purchasePackage(newPlan, userProfile.email);

      toast({
        title: "Plan Changed Successfully! 🎉",
        description: `You've successfully switched to ${newPlan.webBillingProduct?.displayName || newPlan.identifier}`,
      });

      onSubscriptionChange();
      setShowPlanChange(false);

    } catch (error: any) {
      console.error('Plan change error:', error);
      
      let errorMessage = "Failed to change plan. Please try again.";
      
      if (error.message?.includes('already subscribed')) {
        errorMessage = "Please wait a moment and try again. The previous subscription may still be processing.";
      } else if (error.message?.includes('cancelled')) {
        errorMessage = "Plan change was cancelled.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Plan Change Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setChangingToPlan(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Check if current subscription matches user's current role
  const isSubscriptionRoleMismatch = () => {
    if (!userProfile?.role || !subscriptionDetails.currentPlan) return false;
    
    const currentRole = userProfile.role.toLowerCase();
    const planName = subscriptionDetails.currentPlan.toLowerCase();
    
    // Check if the plan contains the current role
    return !planName.includes(currentRole);
  };

  const getAvailablePlans = (): Package[] => {
    const userRole = userProfile?.role;
    
    // Try to get role-specific offering first
    let offeringToUse = currentOffering;
    if (userRole && allOfferings) {
      // Try different possible keys for role-specific offerings
      const possibleKeys = [
        `${userRole}_plans`,        // e.g., "student_plans", "coach_plans"
        `${userRole}s_plans`,       // e.g., "students_plans", "coaches_plans"
        `${userRole}_offering`,     // e.g., "student_offering"
        `${userRole}s_offering`,    // e.g., "students_offering"
        userRole                    // just the role name
      ];
      
      for (const key of possibleKeys) {
        if (allOfferings[key]) {
          offeringToUse = allOfferings[key];
          console.log(`📦 Using offering: ${key} for role: ${userRole}`);
          break;
        }
      }
      
      if (offeringToUse === currentOffering && userRole) {
        console.log(`⚠️ No role-specific offering found for ${userRole}, using default`);
      }
    }
    
    if (!offeringToUse) {
      console.log('⚠️ No offering available for plan changes');
      return [];
    }
    
    console.log(`📦 Available packages in offering:`, 
      offeringToUse.availablePackages.map(p => ({
        identifier: p.identifier,
        displayName: p.webBillingProduct?.displayName
      }))
    );
    
    return offeringToUse.availablePackages.filter((pkg: Package) => {
      // Don't show current plan
      const isCurrentPlan = pkg.webBillingProduct?.identifier === subscriptionDetails.productIdentifier ||
                           pkg.identifier === subscriptionDetails.currentPlan;
      
      console.log(`📦 Package ${pkg.identifier}: isCurrentPlan=${isCurrentPlan}`);
      
      return !isCurrentPlan;
    });
  };

  const getPlanChangeType = (newPlan: Package) => {
    // Simple pricing comparison - you can make this more sophisticated
    const priceMap: Record<string, number> = {
      '$rc_monthly': 100,
      '$rc_annual': 80,
      'student_monthly': 49,
      'student_annual': 39,
      'coach_monthly': 99,
      'coach_annual': 79,
    };

    const currentPrice = priceMap[subscriptionDetails.currentPlan || ''] || 0;
    const newPrice = priceMap[newPlan.identifier] || 0;

    if (newPrice > currentPrice) return 'Upgrade';
    if (newPrice < currentPrice) return 'Downgrade';
    return 'Switch';
  };

  const formatPrice = (pkg: Package) => {
    const product = pkg.webBillingProduct;
    if (!product) return 'Contact Sales';

    const isYearly = pkg.identifier.includes('annual');
    const productAny = product as any;
    
    let priceAmount: number | undefined;
    let formattedPrice: string | undefined;
    
    if (productAny.price) {
      const priceObj = productAny.price;
      if (typeof priceObj === 'object') {
        priceAmount = priceObj.amount;
        formattedPrice = priceObj.formattedPrice;
      } else {
        priceAmount = priceObj;
      }
    } else if (productAny.currentPrice) {
      const currentPrice = productAny.currentPrice;
      if (typeof currentPrice === 'object') {
        priceAmount = currentPrice.amount;
        formattedPrice = currentPrice.formattedPrice;
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
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(dollarAmount);
    }
    
    if (isYearly && priceAmount) {
      const yearlyDollarAmount = priceAmount / 100;
      const monthlyPrice = Math.round(yearlyDollarAmount / 12 * 100) / 100;
      
      const monthlyFormatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(monthlyPrice);
      
      return `${monthlyFormatted}/month (billed annually)`;
    }

    return formattedPrice || 'Contact Sales';
  };

  const getFeaturesByPackage = (packageId: string): string[] => {
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
        'Revenue tracking'
      ],
      'coach_annual': [
        'Accept unlimited students',
        'Advanced coaching tools', 
        'Priority support',
        'Analytics dashboard',
        'Revenue tracking',
        'Save 20% with annual billing'
      ],
      // Fallback for generic packages
      '$rc_monthly': [
        'Monthly subscription',
        'Full platform access',
        'Basic support'
      ],
      '$rc_annual': [
        'Annual subscription',
        'Full platform access',
        'Priority support',
        'Save 20% vs monthly'
      ]
    };

    return featureMap[packageId] || [
      'Premium features included',
      'Full platform access',
      'Customer support'
    ];
  };

  if (!subscriptionDetails.hasActiveSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            You don't have an active subscription. Visit our pricing page to choose a plan for your {userProfile?.role || 'account'}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const availablePlans = getAvailablePlans();
  const roleMismatch = isSubscriptionRoleMismatch();

  return (
    <div className="space-y-6">
      {/* Current Subscription Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your active subscription details
                {roleMismatch && (
                  <span className="block text-amber-600 dark:text-amber-400 text-xs mt-1 font-medium">
                    ⚠️ This subscription was created for a different role. 
                    You can switch to a {userProfile.role} plan below.
                  </span>
                )}
              </CardDescription>
            </div>
            <Badge variant={subscriptionDetails.isActive ? "default" : "secondary"}>
              {subscriptionDetails.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{subscriptionDetails.currentPlan}</p>
                {roleMismatch && (
                  <Badge variant="outline" className="text-xs">
                    Role Mismatch
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="font-medium">{formatDate(subscriptionDetails.expirationDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auto Renewal</p>
              <p className="font-medium">
                {subscriptionDetails.willRenew ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {subscriptionDetails.billingIssue ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600">Billing Issue</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Good Standing</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Role mismatch warning */}
          {roleMismatch && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    Subscription Role Mismatch
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Your current subscription is for a different role than your account. 
                    Consider switching to a {userProfile?.role} plan to access features designed for your role.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {availablePlans.length > 0 && (
              <Button
                variant={roleMismatch ? "default" : "outline"}
                onClick={() => setShowPlanChange(!showPlanChange)}
                disabled={loading}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {roleMismatch 
                  ? `Switch to ${userProfile?.role} Plan` 
                  : showPlanChange ? 'Hide Plans' : 'Change Plan'
                }
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowCancelConfirm(true)}
              disabled={loading}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Change Options */}
      {showPlanChange && availablePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {roleMismatch ? `Switch to ${userProfile?.role} Plans` : 'Available Plan Changes'}
            </CardTitle>
            <CardDescription>
              {roleMismatch 
                ? `Choose a plan designed for ${userProfile?.role}s. Your current subscription will be cancelled and the new plan will be activated immediately.`
                : 'Select a new plan to switch to. Your current plan will be cancelled and the new plan will be activated immediately.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {availablePlans.map((plan: Package) => (
                <div
                  key={plan.identifier}
                  className={`border rounded-lg p-4 space-y-3 ${
                    changingToPlan?.identifier === plan.identifier ? 'border-primary bg-primary/5' : ''
                  } ${roleMismatch ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-lg">
                        {plan.webBillingProduct?.displayName || plan.identifier}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {plan.webBillingProduct?.description || 'Subscription plan'}
                      </p>
                      <p className="text-sm font-medium text-primary mt-1">
                        {formatPrice(plan)}
                      </p>
                    </div>
                    <Button
                      onClick={() => handlePlanChange(plan)}
                      disabled={loading}
                      variant={roleMismatch ? "default" : "outline"}
                      size="sm"
                      className="gap-2 min-w-[120px]"
                    >
                      {changingToPlan?.identifier === plan.identifier && loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `${getPlanChangeType(plan)} Now`
                      )}
                    </Button>
                  </div>
                  
                  {/* Show features for the plan */}
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Features included:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {getFeaturesByPackage(plan.identifier).slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {getFeaturesByPackage(plan.identifier).length > 3 && (
                        <li className="text-xs">
                          + {getFeaturesByPackage(plan.identifier).length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show message if no alternative plans available */}
      {showPlanChange && availablePlans.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No Alternative Plans Available</CardTitle>
            <CardDescription>
              There are currently no other plans available for your account type. 
              {userProfile?.role && ` Current role: ${userProfile.role}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Available offerings: {Object.keys(allOfferings).join(', ') || 'None'}</p>
              <p>Looking for: {userProfile?.role}_plans</p>
              <p>Current offering: {currentOffering?.identifier || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200">
              Cancel Subscription
            </CardTitle>
            <CardDescription className="text-red-600 dark:text-red-300">
              Are you sure you want to cancel your subscription? You'll lose access at the end of your current billing period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={loading}
              >
                Keep Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}