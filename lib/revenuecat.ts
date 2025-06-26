import { Purchases, CustomerInfo, Offering, Package, PurchasesError, ErrorCode } from '@revenuecat/purchases-js';

// Force sandbox for now
const isDevelopment = true;

const getWebBillingApiKey = () => {
  console.log('🔍 Checking environment variables...');
  
  const sandboxKey = process.env.NEXT_PUBLIC_REVENUECAT_WEB_BILLING_PUBLIC_KEY_SANDBOX;
  const prodKey = process.env.NEXT_PUBLIC_REVENUECAT_WEB_BILLING_PUBLIC_KEY;
  
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasSandboxKey: !!sandboxKey,
    hasProductionKey: !!prodKey,
    sandboxKeyPrefix: sandboxKey ? sandboxKey.substring(0, 10) + '...' : 'MISSING',
    usingDevelopment: isDevelopment
  });
  
  const apiKey = isDevelopment ? sandboxKey : prodKey;
  
  if (!apiKey) {
    const missing = isDevelopment ? 'NEXT_PUBLIC_REVENUECAT_WEB_BILLING_PUBLIC_KEY_SANDBOX' : 'NEXT_PUBLIC_REVENUECAT_WEB_BILLING_PUBLIC_KEY';
    throw new Error(`❌ Missing environment variable: ${missing}`);
  }
  
  if (!apiKey.startsWith('rcb_')) {
    throw new Error(`❌ Invalid API key format. Expected to start with 'rcb_', got: ${apiKey.substring(0, 10)}...`);
  }
  
  console.log('✅ API key validated:', {
    environment: isDevelopment ? 'SANDBOX' : 'PRODUCTION',
    keyType: apiKey.startsWith('rcb_sb_') ? 'Sandbox' : apiKey.startsWith('rcb_') ? 'Production' : 'Unknown',
    keyPrefix: apiKey.substring(0, 15) + '...'
  });
  
  return apiKey;
};

let isConfigured = false;
let purchasesInstance: any = null;
let currentUserId: string | null = null;
let configurationPromise: Promise<any> | null = null;

export const configureRevenueCat = async (userId?: string): Promise<any> => {
  // If already configuring, wait for that to complete
  if (configurationPromise) {
    console.log('⏳ Configuration in progress, waiting...');
    return configurationPromise;
  }
  
  // If already configured with same user, return existing instance
  if (isConfigured && purchasesInstance && currentUserId === userId) {
    console.log('✅ RevenueCat already configured for user:', userId || 'anonymous');
    return purchasesInstance;
  }

  console.log('🚀 Starting RevenueCat configuration...');
  
  // Create configuration promise to prevent race conditions
  configurationPromise = (async () => {
    try {
      // Step 1: Get and validate API key
      const apiKey = getWebBillingApiKey();
      
      // Step 2: Generate user ID
      const appUserId = userId || Purchases.generateRevenueCatAnonymousAppUserId();
      
      console.log('🔧 Configuring with:', {
        environment: isDevelopment ? 'SANDBOX' : 'PRODUCTION',
        appUserId,
        hasUserId: !!userId,
        apiKeyValid: apiKey.startsWith('rcb_')
      });
      
      // Step 3: Clean up existing instance if user changed
      if (purchasesInstance && currentUserId !== userId) {
        try {
          console.log('🧹 Cleaning up previous instance');
          await purchasesInstance.close();
        } catch (e) {
          console.warn('⚠️ Cleanup warning:', e);
        }
        isConfigured = false;
        purchasesInstance = null;
      }
      
      // Step 4: Configure Purchases
      console.log('⚙️ Calling Purchases.configure...');
      purchasesInstance = Purchases.configure(apiKey, appUserId);
      
      // Step 5: Mark as configured
      isConfigured = true;
      currentUserId = userId || null;
      
      console.log('✅ RevenueCat instance created successfully');
      
      // Step 6: Test the configuration
      console.log('🧪 Testing configuration...');
      
      // Wait a moment for the SDK to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test by getting customer info
      const testCustomerInfo = await purchasesInstance.getCustomerInfo();
      console.log('✅ Configuration test passed:', {
        userId: testCustomerInfo.originalAppUserId,
        entitlements: Object.keys(testCustomerInfo.entitlements.active).length
      });
      
      return purchasesInstance;
      
    } catch (error) {
      console.error('❌ RevenueCat configuration failed:', error);
      
      // Reset state on failure
      isConfigured = false;
      purchasesInstance = null;
      currentUserId = null;
      configurationPromise = null;
      
      throw error;
    }
  })();
  
  try {
    const result = await configurationPromise;
    configurationPromise = null; // Clear the promise on success
    return result;
  } catch (error) {
    configurationPromise = null; // Clear the promise on error
    throw error;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  // Ensure we're configured before making the call
  if (!isConfigured || !purchasesInstance) {
    console.log('⚠️ RevenueCat not configured, attempting to configure...');
    await configureRevenueCat();
  }
  
  if (!isConfigured || !purchasesInstance) {
    throw new Error('❌ RevenueCat not configured. Call configureRevenueCat() first.');
  }
  
  try {
    console.log('📊 Getting customer info...');
    const customerInfo = await purchasesInstance.getCustomerInfo();
    
    console.log('✅ Customer info retrieved:', {
      originalAppUserId: customerInfo.originalAppUserId,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
      hasActiveSubscription: Object.keys(customerInfo.entitlements.active).length > 0
    });
    
    return customerInfo;
  } catch (error) {
    console.error('❌ Failed to get customer info:', error);
    throw error;
  }
};

export const getOfferingsForRole = async (userRole?: string): Promise<{ 
  current: Offering | null; 
  all: Record<string, Offering>;
  roleSpecific: Offering | null;
}> => {
  // Ensure we're configured before making the call
  if (!isConfigured || !purchasesInstance) {
    console.log('⚠️ RevenueCat not configured, attempting to configure...');
    await configureRevenueCat();
  }
  
  if (!isConfigured || !purchasesInstance) {
    throw new Error('❌ RevenueCat not configured. Call configureRevenueCat() first.');
  }
  
  try {
    console.log('📦 Fetching offerings for role:', userRole);
    const offerings = await purchasesInstance.getOfferings();
    
    console.log('📦 All offerings retrieved:', {
      hasCurrent: !!offerings.current,
      currentId: offerings.current?.identifier,
      allOfferings: Object.keys(offerings.all),
    });
    
    // Get role-specific offering
    let roleSpecificOffering = null;
    if (userRole) {
      const offeringKey = `${userRole}_plans`; // e.g., "student_plans", "coach_plans"
      roleSpecificOffering = offerings.all[offeringKey] || null;
      
      if (roleSpecificOffering) {
        console.log(`📦 Found ${userRole} offering:`, {
          identifier: roleSpecificOffering.identifier,
          packages: roleSpecificOffering.availablePackages.length
        });
      } else {
        console.log(`⚠️ No specific offering found for role: ${userRole}, checking for fallback patterns`);
        
        // Try alternative naming patterns
        const alternativeKeys = [
          `${userRole}s_plans`, // e.g., "students_plans", "coaches_plans"
          `${userRole}_offering`,
          `${userRole}s_offering`,
          userRole // just the role name
        ];
        
        for (const altKey of alternativeKeys) {
          if (offerings.all[altKey]) {
            roleSpecificOffering = offerings.all[altKey];
            console.log(`📦 Found ${userRole} offering with alternative key: ${altKey}`);
            break;
          }
        }
      }
    }
    
    // Debug packages in role-specific offering
    if (roleSpecificOffering?.availablePackages) {
      roleSpecificOffering.availablePackages.forEach((pkg: Package, index: number) => {
        console.log(`📦 ${userRole} Package ${index + 1}:`, {
          identifier: pkg.identifier,
          displayName: pkg.webBillingProduct?.displayName || 'N/A',
          hasWebBillingProduct: !!pkg.webBillingProduct
        });
      });
    } else if (userRole) {
      console.log(`⚠️ No role-specific packages found for ${userRole}, will use default offering`);
    }
    
    // Debug current offering packages
    if (offerings.current?.availablePackages) {
      offerings.current.availablePackages.forEach((pkg: Package, index: number) => {
        console.log(`📦 Default Package ${index + 1}:`, {
          identifier: pkg.identifier,
          displayName: pkg.webBillingProduct?.displayName || 'N/A',
          hasWebBillingProduct: !!pkg.webBillingProduct
        });
      });
    }
    
    return {
      current: offerings.current,
      all: offerings.all,
      roleSpecific: roleSpecificOffering
    };
  } catch (error) {
    console.error('❌ Failed to get offerings:', error);
    throw error;
  }
};

export const getOfferings = async (): Promise<{ current: Offering | null; all: Record<string, Offering> }> => {
  const result = await getOfferingsForRole();
  return {
    current: result.current,
    all: result.all
  };
};

export const purchasePackage = async (packageToPurchase: Package, customerEmail?: string): Promise<CustomerInfo> => {
  // Ensure we're configured before making the call
  if (!isConfigured || !purchasesInstance) {
    console.log('⚠️ RevenueCat not configured, attempting to configure...');
    await configureRevenueCat();
  }
  
  if (!isConfigured || !purchasesInstance) {
    throw new Error('❌ RevenueCat not configured. Call configureRevenueCat() first.');
  }
  
  try {
    console.log('🛒 Starting purchase:', packageToPurchase.identifier);

    if (!packageToPurchase.webBillingProduct) {
      throw new Error(`❌ Package ${packageToPurchase.identifier} missing webBillingProduct`);
    }

    const purchaseParams: any = { rcPackage: packageToPurchase };
    if (customerEmail) purchaseParams.customerEmail = customerEmail;

    const { customerInfo } = await purchasesInstance.purchase(purchaseParams);
    
    console.log('🎉 Purchase successful!');
    return customerInfo;
  } catch (error) {
    console.error('❌ Purchase failed:', error);
    
    if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
      throw new Error('Purchase was cancelled');
    }
    
    throw new Error(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper functions
export const hasEntitlement = (customerInfo: CustomerInfo, entitlementId: string): boolean => {
  return entitlementId in customerInfo.entitlements.active;
};

export const getActiveEntitlements = (customerInfo: CustomerInfo): string[] => {
  return Object.keys(customerInfo.entitlements.active);
};

export const getSubscriptionDetails = (customerInfo: CustomerInfo) => {
  const activeEntitlements = getActiveEntitlements(customerInfo);
  
  if (activeEntitlements.length === 0) {
    return {
      hasActiveSubscription: false,
      currentPlan: null,
      isActive: false,
      willRenew: false,
      expirationDate: null,
      billingIssue: false,
      productIdentifier: null
    };
  }

  // Get the first active entitlement for details
  const primaryEntitlement = Object.values(customerInfo.entitlements.active)[0] as any;
  
  return {
    hasActiveSubscription: true,
    currentPlan: activeEntitlements[0],
    isActive: primaryEntitlement.isActive,
    willRenew: primaryEntitlement.willRenew,
    expirationDate: primaryEntitlement.expirationDate,
    billingIssue: primaryEntitlement.billingIssueDetectedAt != null,
    productIdentifier: primaryEntitlement.productIdentifier
  };
};

export const cancelSubscriptionInPlatform = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/subscriptions/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};

// Add this function to your existing revenuecat.ts file

export const cancelSubscriptionViaSdk = async (): Promise<boolean> => {
  try {
    // Ensure we're configured
    if (!isConfigured || !purchasesInstance) {
      console.log('⚠️ RevenueCat not configured, attempting to configure...');
      await configureRevenueCat();
    }
    
    if (!isConfigured || !purchasesInstance) {
      throw new Error('❌ RevenueCat not configured');
    }

    // Get current customer info to find management URL
    const customerInfo = await purchasesInstance.getCustomerInfo();
    
    if (customerInfo.managementURL) {
      // Open management URL for user to cancel
      window.open(customerInfo.managementURL, '_blank');
      return true;
    } else {
      throw new Error('No management URL available');
    }
  } catch (error) {
    console.error('SDK cancellation error:', error);
    throw error;
  }
};

export const switchPlanInPlatform = async (
  userId: string,
  currentPlanId: string | null,
  newPlanId: string
): Promise<{ success: boolean; requiresCancellation: boolean }> => {
  try {
    const response = await fetch('/api/subscriptions/switch-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
        currentPlanId,
        newPlanId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to switch plan');
    }

    return await response.json();
  } catch (error) {
    console.error('Switch plan error:', error);
    throw error;
  }
};

export const cleanup = async () => {
  if (purchasesInstance) {
    try {
      await purchasesInstance.close();
    } catch (e) {
      console.warn('Cleanup warning:', e);
    }
  }
  isConfigured = false;
  purchasesInstance = null;
  currentUserId = null;
  configurationPromise = null;
};

// Debug function
export const getConfigurationStatus = () => {
  return {
    isConfigured,
    hasPurchasesInstance: !!purchasesInstance,
    currentUserId,
    hasConfigurationPromise: !!configurationPromise
  };
};