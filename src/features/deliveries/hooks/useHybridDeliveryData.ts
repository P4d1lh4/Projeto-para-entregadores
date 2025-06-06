import { useState, useEffect, useCallback } from 'react';
import { useSupabaseDeliveryData } from './useSupabaseDeliveryData';
import { useDeliveryData } from './useDeliveryData';
import type { DeliveryData, DriverData, CustomerData } from '../types';

export interface UseHybridDeliveryDataResult {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  source: 'supabase' | 'local' | 'none';
  stats?: {
    totalDeliveries: number;
    uniqueJobIds: number;
    lastUpload?: string;
  };
}

export const useHybridDeliveryData = (preferSupabase: boolean = true): UseHybridDeliveryDataResult => {
  const [source, setSource] = useState<'supabase' | 'local' | 'none'>('none');
  
  // Always initialize both hooks
  const supabaseData = useSupabaseDeliveryData();
  const localData = useDeliveryData();

  // Determine which data source to use
  const activeData = preferSupabase && supabaseData.deliveryData.length > 0 
    ? supabaseData 
    : localData;

  useEffect(() => {
    if (preferSupabase && supabaseData.deliveryData.length > 0) {
      setSource('supabase');
    } else if (localData.deliveryData.length > 0) {
      setSource('local');
    } else {
      setSource('none');
    }
  }, [preferSupabase, supabaseData.deliveryData.length, localData.deliveryData.length]);

  const refetch = useCallback(async () => {
    if (preferSupabase) {
      await supabaseData.refetch();
    }
    await localData.refetch();
  }, [preferSupabase, supabaseData.refetch, localData.refetch]);

  return {
    deliveryData: activeData.deliveryData,
    driverData: activeData.driverData,
    customerData: activeData.customerData,
    loading: preferSupabase ? supabaseData.loading : localData.loading,
    error: activeData.error,
    refetch,
    source,
    stats: 'stats' in activeData ? activeData.stats : undefined
  };
}; 