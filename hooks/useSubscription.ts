import { useEffect, useState } from 'react';
import { getCustomerInfo, hasEntitlement, getActiveEntitlements } from '@/lib/revenuecat';
import { CustomerInfo } from '@revenuecat/purchases-js';

export function useSubscription() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomerInfo() {
      try {
        const info = await getCustomerInfo();
        setCustomerInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch subscription info');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomerInfo();
  }, []);

  const hasActiveSubscription = customerInfo ? getActiveEntitlements(customerInfo).length > 0 : false;
  
  const hasCoachAccess = customerInfo ? hasEntitlement(customerInfo, 'coach_access') : false;
  
  const hasStudentAccess = customerInfo ? 
    hasEntitlement(customerInfo, 'student_basic') || hasEntitlement(customerInfo, 'student_pro') : false;

  return {
    customerInfo,
    loading,
    error,
    hasActiveSubscription,
    hasCoachAccess,
    hasStudentAccess,
    activeEntitlements: customerInfo ? getActiveEntitlements(customerInfo) : [],
    refetch: () => {
      setLoading(true);
      setError(null);
      getCustomerInfo().then(setCustomerInfo).catch(setError).finally(() => setLoading(false));
    }
  };
}