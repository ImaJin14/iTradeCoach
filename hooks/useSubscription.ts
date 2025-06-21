import { useEffect, useState } from 'react';
import { getCustomerInfo, hasEntitlement, getActiveEntitlements, configureRevenueCat } from '@/lib/revenuecat';
import { CustomerInfo } from '@revenuecat/purchases-js';

export function useSubscription() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    async function initializeAndFetchCustomerInfo() {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure RevenueCat is configured
        if (!isConfigured) {
          await configureRevenueCat();
          setIsConfigured(true);
        }
        
        const info = await getCustomerInfo();
        setCustomerInfo(info);
        
        console.log('useSubscription: Customer info loaded', {
          hasActiveSubscription: getActiveEntitlements(info).length > 0,
          activeEntitlements: getActiveEntitlements(info)
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription info';
        console.error('useSubscription error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    initializeAndFetchCustomerInfo();
  }, [isConfigured]);

  const hasActiveSubscription = customerInfo ? getActiveEntitlements(customerInfo).length > 0 : false;
  
  const hasCoachAccess = customerInfo ? hasEntitlement(customerInfo, 'coach_access') : false;
  
  const hasStudentAccess = customerInfo ? 
    hasEntitlement(customerInfo, 'student_basic') || hasEntitlement(customerInfo, 'student_pro') : false;

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      
      console.log('useSubscription: Refetched customer info');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refetch subscription info';
      console.error('useSubscription refetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    customerInfo,
    loading,
    error,
    hasActiveSubscription,
    hasCoachAccess,
    hasStudentAccess,
    activeEntitlements: customerInfo ? getActiveEntitlements(customerInfo) : [],
    refetch,
    isConfigured
  };
}