import { useEffect, useState, useCallback } from 'react';
import { getCustomerInfo, hasEntitlement, getActiveEntitlements, configureRevenueCat } from '@/lib/revenuecat';
import { CustomerInfo } from '@revenuecat/purchases-js';
import { supabase } from '@/lib/supabase';

export function useSubscription() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const initializeAndFetchCustomerInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error('Failed to get user information');
      }
      
      const currentUserId = user?.id ?? null; // Convert undefined to null
      setUserId(currentUserId);
      
      // Configure RevenueCat if not already configured or user changed
      if (!isConfigured || userId !== currentUserId) {
        console.log('Configuring RevenueCat for user:', currentUserId);
        await configureRevenueCat(currentUserId || undefined);
        setIsConfigured(true);
      }
      
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      
      console.log('useSubscription: Customer info loaded', {
        hasActiveSubscription: getActiveEntitlements(info).length > 0,
        activeEntitlements: getActiveEntitlements(info),
        userId: currentUserId
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription info';
      console.error('useSubscription error:', err);
      setError(errorMessage);
      setCustomerInfo(null);
    } finally {
      setLoading(false);
    }
  }, [isConfigured, userId]);

  useEffect(() => {
    initializeAndFetchCustomerInfo();
  }, [initializeAndFetchCustomerInfo]);

  const hasActiveSubscription = customerInfo ? getActiveEntitlements(customerInfo).length > 0 : false;
  
  const hasCoachAccess = customerInfo ? hasEntitlement(customerInfo, 'coach_access') : false;
  
  const hasStudentAccess = customerInfo ? 
    hasEntitlement(customerInfo, 'student_basic') || hasEntitlement(customerInfo, 'student_pro') : false;

  const refetch = useCallback(async () => {
    await initializeAndFetchCustomerInfo();
  }, [initializeAndFetchCustomerInfo]);

  return {
    customerInfo,
    loading,
    error,
    hasActiveSubscription,
    hasCoachAccess,
    hasStudentAccess,
    activeEntitlements: customerInfo ? getActiveEntitlements(customerInfo) : [],
    refetch,
    isConfigured,
    userId
  };
}