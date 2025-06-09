import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import type { DeliveryData, DriverData, CustomerData } from '../types';
import { parseFile, formatDeliveryData } from '@/lib/file-utils';

export interface UseDeliveryDataResult {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateData: (newData: any[]) => Promise<void>;
  setData: (data: { deliveryData: DeliveryData[], driverData: DriverData[], customerData: CustomerData[] }) => void;
  setError: (error: string | null) => void;
}

export const useDeliveryData = (): UseDeliveryDataResult => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [driverData, setDriverData] = useState<DriverData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setData = (data: { deliveryData: DeliveryData[], driverData: DriverData[], customerData: CustomerData[] }) => {
    setDeliveryData(data.deliveryData);
    setDriverData(data.driverData);
    setCustomerData(data.customerData);
  };

  const fetchFromService = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      const [deliveryResult, driverResult, customerResult] = await Promise.all([
        dataService.getDeliveryData(),
        dataService.getDriverData(),
        dataService.getCustomerData(),
      ]);

      // Filter out 'No stored data available' errors as they're expected when no data exists
      const errors = [deliveryResult.error, driverResult.error, customerResult.error]
        .filter(Boolean)
        .filter(error => error !== 'No stored data available');
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      console.log('📊 Fetching from service, setting data:', {
        deliveries: deliveryResult.data?.length || 0,
        drivers: driverResult.data?.length || 0,
        customers: customerResult.data?.length || 0,
      });

      // Always set data, even if empty arrays
      setDeliveryData(deliveryResult.data || []);
      setDriverData(driverResult.data || []);
      setCustomerData(customerResult.data || []);
      
      // Clear error state on successful fetch
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching data from service:', err);
      
      // On error, ensure we have empty arrays instead of null/undefined
      setDeliveryData([]);
      setDriverData([]);
      setCustomerData([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const updateData = useCallback(async (newData: any[]) => {
    try {
      setLoading(true);
      const formattedData = formatDeliveryData(newData);
      await dataService.updateDeliveryData(formattedData);
      // After updating, refetch all data to ensure consistency
      await fetchFromService();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update data';
      setError(errorMessage);
      console.error('Error updating data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFromService]);

  useEffect(() => {
    // On initial load, just fetch from the service.
    // The service itself handles localStorage and initial state.
    fetchFromService();
  }, [fetchFromService]);

  return {
    deliveryData,
    driverData,
    customerData,
    loading,
    error,
    refetch: fetchFromService,
    updateData,
    setData,
    setError,
  };
}; 