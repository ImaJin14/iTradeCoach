import { Purchases, CustomerInfo, Offering, Package } from '@revenuecat/purchases-js';

// Environment-specific API keys
const getApiKey = () => {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev 
    ? process.env.NEXT_PUBLIC_REVENUECAT_SANDBOX_API_KEY!
    : process.env.NEXT_PUBLIC_REVENUECAT_API_KEY!;
};

let isConfigured = false;

export const configureRevenueCat = async (userId?: string) => {
  if (isConfigured) return;

  try {
    const apiKey = getApiKey();
    
    // Use identified user if available, otherwise anonymous
    const appUserId = userId || Purchases.generateRevenueCatAnonymousAppUserId();
    
    Purchases.configure(apiKey, appUserId);
    isConfigured = true;
    
    console.log('RevenueCat configured with user:', appUserId);
  } catch (error) {
    console.error('Failed to configure RevenueCat:', error);
    throw error;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo> => {
  try {
    return await Purchases.getSharedInstance().getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw error;
  }
};

export const getOfferings = async (currency?: string): Promise<{ current: Offering | null; all: Record<string, Offering> }> => {
  try {
    const options = currency ? { currency } : undefined;
    return await Purchases.getSharedInstance().getOfferings(options);
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw error;
  }
};

export const purchasePackage = async (packageToPurchase: Package, customerEmail?: string) => {
  try {
    const purchaseParams: any = {
      rcPackage: packageToPurchase,
    };
    
    if (customerEmail) {
      purchaseParams.customerEmail = customerEmail;
    }

    const { customerInfo } = await Purchases.getSharedInstance().purchase(purchaseParams);
    return customerInfo;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
};

// Helper to check if user has specific entitlement
export const hasEntitlement = (customerInfo: CustomerInfo, entitlementId: string): boolean => {
  return entitlementId in customerInfo.entitlements.active;
};

// Helper to get active entitlements
export const getActiveEntitlements = (customerInfo: CustomerInfo): string[] => {
  return Object.keys(customerInfo.entitlements.active);
};