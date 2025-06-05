// Temporary stub for RevenueCat functionality
// TODO: Replace with web-compatible RevenueCat implementation

interface CustomerInfo {
  entitlements: {
    active: {
      basic?: unknown;
      pro?: unknown;
      enterprise?: unknown;
    };
  };
}

export async function initializeRevenueCat(): Promise<void> {
  console.warn('RevenueCat web implementation not yet available');
}

export async function purchasePackage(packageId: string): Promise<CustomerInfo> {
  console.warn('RevenueCat web implementation not yet available');
  throw new Error('Subscription functionality is not available on web');
}

export async function restorePurchases(): Promise<CustomerInfo> {
  console.warn('RevenueCat web implementation not yet available');
  throw new Error('Restore purchases functionality is not available on web');
}

export async function getCurrentSubscription(): Promise<CustomerInfo> {
  console.warn('RevenueCat web implementation not yet available');
  return {
    entitlements: {
      active: {}
    }
  };
}

export async function checkEntitlements() {
  console.warn('RevenueCat web implementation not yet available');
  return {
    isBasic: false,
    isPro: false,
    isEnterprise: false
  };
}