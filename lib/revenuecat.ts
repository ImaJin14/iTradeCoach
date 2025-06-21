import { Purchases, CustomerInfo, Offering, Package, PurchasesError, ErrorCode } from '@revenuecat/purchases-js';

// Environment-specific API keys
const getApiKey = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const apiKey = isDev 
    ? process.env.NEXT_PUBLIC_REVENUECAT_SANDBOX_API_KEY
    : process.env.NEXT_PUBLIC_REVENUECAT_API_KEY;
  
  if (!apiKey) {
    throw new Error(`Missing RevenueCat API key for environment: ${isDev ? 'development' : 'production'}`);
  }
  
  return apiKey;
};

let isConfigured = false;

export const configureRevenueCat = async (userId?: string) => {
  if (isConfigured) {
    console.log('RevenueCat already configured');
    return;
  }

  try {
    const apiKey = getApiKey();
    
    // Use identified user if available, otherwise anonymous
    const appUserId = userId || Purchases.generateRevenueCatAnonymousAppUserId();
    
    console.log('Configuring RevenueCat with:', {
      environment: process.env.NODE_ENV,
      hasApiKey: !!apiKey,
      appUserId,
      apiKeyPrefix: apiKey.slice(0, 8) + '...'
    });
    
    Purchases.configure(apiKey, appUserId);
    isConfigured = true;
    
    console.log('✅ RevenueCat configured successfully with user:', appUserId);
    
    // Test the configuration by getting customer info
    const customerInfo = await getCustomerInfo();
    console.log('✅ Configuration test successful, customer info received');
    
  } catch (error) {
    console.error('❌ Failed to configure RevenueCat:', error);
    isConfigured = false;
    throw new Error(`RevenueCat configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  try {
    if (!isConfigured) {
      throw new Error('RevenueCat not configured. Call configureRevenueCat() first.');
    }
    
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
    console.log('Customer info retrieved:', {
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

export const getOfferings = async (currency?: string): Promise<{ current: Offering | null; all: Record<string, Offering> }> => {
  try {
    if (!isConfigured) {
      throw new Error('RevenueCat not configured. Call configureRevenueCat() first.');
    }
    
    console.log('Fetching offerings...', currency ? `with currency: ${currency}` : '');
    
    const options = currency ? { currency } : undefined;
    const offerings = await Purchases.getSharedInstance().getOfferings(options);
    
    console.log('Offerings retrieved:', {
      hasCurrent: !!offerings.current,
      currentId: offerings.current?.identifier,
      allOfferings: Object.keys(offerings.all),
      packagesInCurrent: offerings.current?.availablePackages.length || 0
    });
    
    // Debug each package
    if (offerings.current) {
      offerings.current.availablePackages.forEach((pkg, index) => {
        console.log(`Package ${index + 1}:`, {
          identifier: pkg.identifier,
          hasWebBillingProduct: !!pkg.webBillingProduct,
          webBillingProduct: pkg.webBillingProduct ? {
            identifier: pkg.webBillingProduct.identifier,
            displayName: pkg.webBillingProduct.displayName,
            description: pkg.webBillingProduct.description,
            priceInfo: (pkg.webBillingProduct as any)?.price || (pkg.webBillingProduct as any)?.currentPrice
          } : null
        });
      });
    }
    
    return offerings;
  } catch (error) {
    console.error('❌ Failed to get offerings:', error);
    throw error;
  }
};

export const purchasePackage = async (packageToPurchase: Package, customerEmail?: string) => {
  try {
    if (!isConfigured) {
      throw new Error('RevenueCat not configured. Call configureRevenueCat() first.');
    }
    
    console.log('🛒 Starting purchase process:', {
      packageId: packageToPurchase.identifier,
      hasWebBillingProduct: !!packageToPurchase.webBillingProduct,
      customerEmail,
      webBillingProduct: packageToPurchase.webBillingProduct ? {
        identifier: packageToPurchase.webBillingProduct.identifier,
        displayName: packageToPurchase.webBillingProduct.displayName
      } : null
    });

    // Validate package has web billing product
    if (!packageToPurchase.webBillingProduct) {
      throw new Error(`Package ${packageToPurchase.identifier} does not have a webBillingProduct. This package may not be configured for web billing.`);
    }

    const purchaseParams: any = {
      rcPackage: packageToPurchase,
    };
    
    if (customerEmail) {
      purchaseParams.customerEmail = customerEmail;
    }

    console.log('🚀 Initiating purchase with Purchases SDK...');
    const { customerInfo } = await Purchases.getSharedInstance().purchase(purchaseParams);
    
    console.log('✅ Purchase successful!', {
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
      originalAppUserId: customerInfo.originalAppUserId
    });
    
    return customerInfo;
  } catch (error) {
    console.error('❌ Purchase failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      errorCode: (error as any)?.errorCode,
      errorUserInfo: (error as any)?.userInfo,
      packageId: packageToPurchase.identifier,
      isPurchasesError: error instanceof PurchasesError,
      isUserCancellation: error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError
    });
    
    // Re-throw with more context for user cancellation
    if (error instanceof PurchasesError && error.errorCode === ErrorCode.UserCancelledError) {
      throw new PurchasesError(ErrorCode.UserCancelledError, 'Purchase was cancelled by user');
    }
    
    // Re-throw with enhanced error message for other errors
    const enhancedError = new Error(
      `Purchase failed for package ${packageToPurchase.identifier}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
};

// Helper to check if user has specific entitlement
export const hasEntitlement = (customerInfo: CustomerInfo, entitlementId: string): boolean => {
  const hasIt = entitlementId in customerInfo.entitlements.active;
  console.log(`Checking entitlement "${entitlementId}":`, hasIt);
  return hasIt;
};

// Helper to get active entitlements
export const getActiveEntitlements = (customerInfo: CustomerInfo): string[] => {
  const entitlements = Object.keys(customerInfo.entitlements.active);
  console.log('Active entitlements:', entitlements);
  return entitlements;
};

// Helper to reset configuration (useful for debugging)
export const resetConfiguration = () => {
  isConfigured = false;
  console.log('RevenueCat configuration reset');
};

// Helper to validate environment
export const validateEnvironment = () => {
  const issues: string[] = [];
  
  if (!process.env.NEXT_PUBLIC_REVENUECAT_SANDBOX_API_KEY) {
    issues.push('Missing NEXT_PUBLIC_REVENUECAT_SANDBOX_API_KEY');
  }
  
  if (!process.env.NEXT_PUBLIC_REVENUECAT_API_KEY) {
    issues.push('Missing NEXT_PUBLIC_REVENUECAT_API_KEY');
  }
  
  if (issues.length > 0) {
    console.warn('Environment validation issues:', issues);
    return { valid: false, issues };
  }
  
  console.log('✅ Environment validation passed');
  return { valid: true, issues: [] };
};