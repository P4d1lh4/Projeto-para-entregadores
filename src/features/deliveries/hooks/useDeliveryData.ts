import { useState, useEffect } from 'react';
import { dataService, type DataServiceResult } from '../services/dataService';
import type { DeliveryData, DriverData, CustomerData } from '../types';

export interface UseDeliveryDataResult {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateData: (newData: DeliveryData[]) => Promise<void>;
}

export const useDeliveryData = (): UseDeliveryDataResult => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [driverData, setDriverData] = useState<DriverData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deliveryResult, driverResult, customerResult] = await Promise.all([
        dataService.getDeliveryData(),
        dataService.getDriverData(),
        dataService.getCustomerData(),
      ]);

      // Only show errors if they're not related to empty data
      const hasRealErrors = [deliveryResult.error, driverResult.error, customerResult.error]
        .filter(Boolean)
        .some(error => error !== 'No stored data available');
      
      if (hasRealErrors) {
        const errors = [deliveryResult.error, driverResult.error, customerResult.error]
          .filter(Boolean)
          .filter(error => error !== 'No stored data available')
          .join(', ');
        if (errors) throw new Error(errors);
      }

      setDeliveryData(deliveryResult.data || []);
      setDriverData(driverResult.data || []);
      setCustomerData(customerResult.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (newData: DeliveryData[]) => {
    try {
      await dataService.updateDeliveryData(newData);
      await fetchData(); // Refresh all data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating data';
      setError(errorMessage);
      console.error('Error updating delivery data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    deliveryData,
    driverData,
    customerData,
    loading,
    error,
    refetch: fetchData,
    updateData,
  };
}; 