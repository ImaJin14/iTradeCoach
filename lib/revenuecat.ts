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

export const getOfferings = async (): Promise<{ current: Offering | null; all: Record<string, Offering> }> => {
  if (!isConfigured || !purchasesInstance) {
    throw new Error('❌ RevenueCat not configured. Call configureRevenueCat() first.');
  }
  
  try {
    console.log('📦 Fetching offerings...');
    const offerings = await purchasesInstance.getOfferings();
    
    console.log('📦 Offerings retrieved:', {
      hasCurrent: !!offerings.current,
      currentId: offerings.current?.identifier,
      allOfferings: Object.keys(offerings.all),
      packagesInCurrent: offerings.current?.availablePackages.length || 0
    });
    
    // Debug packages
    if (offerings.current?.availablePackages) {
      offerings.current.availablePackages.forEach((pkg: Package, index: number) => {
        console.log(`📦 Package ${index + 1}:`, {
          identifier: pkg.identifier,
          displayName: pkg.webBillingProduct?.displayName || 'N/A',
          hasWebBillingProduct: !!pkg.webBillingProduct
        });
      });
    }
    
    return offerings;
  } catch (error) {
    console.error('❌ Failed to get offerings:', error);
    throw error;
  }
};

export const purchasePackage = async (packageToPurchase: Package, customerEmail?: string): Promise<CustomerInfo> => {
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