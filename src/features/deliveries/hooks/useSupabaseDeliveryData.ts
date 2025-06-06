import { useState, useEffect, useCallback } from 'react';
import { CSVProcessingService } from '@/services/csvProcessingService';
import type { DeliveryData, DriverData, CustomerData } from '../types';

export interface UseSupabaseDeliveryDataResult {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  stats: {
    totalDeliveries: number;
    uniqueJobIds: number;
    lastUpload?: string;
  } | null;
}

export const useSupabaseDeliveryData = (): UseSupabaseDeliveryDataResult => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [driverData, setDriverData] = useState<DriverData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalDeliveries: number;
    uniqueJobIds: number;
    lastUpload?: string;
  } | null>(null);

  const transformSupabaseToDeliveryData = (supabaseData: any[]): DeliveryData[] => {
    return supabaseData.map(item => ({
      id: item.id || item.job_id || '',
      driverId: item.delivering_driver || item.collecting_driver || '',
      driverName: item.delivering_driver || item.collecting_driver || '',
      customerId: item.customer_name || item.pickup_customer_name || '',
      customerName: item.customer_name || item.pickup_customer_name || '',
      address: item.delivery_address || item.pickup_address || '',
      city: item.delivery_address?.split(',').pop()?.trim() || '',
      status: (item.status === 'delivered' ? 'delivered' : 
               item.status === 'failed' ? 'failed' : 
               item.status === 'in_transit' ? 'in_transit' : 'pending') as 'delivered' | 'failed' | 'pending' | 'in_transit',
      deliveryTime: item.delivered_at || item.created_at || new Date().toISOString(),
      latitude: 0, // Will need geocoding later
      longitude: 0, // Will need geocoding later
      rating: undefined
    }));
  };

  const processDriverData = (deliveryData: DeliveryData[]): DriverData[] => {
    const driverMap = new Map<string, DriverData>();

    deliveryData.forEach(delivery => {
      const driverName = delivery.driverName;
      if (!driverName) return;

      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, {
          id: driverName,
          name: driverName,
          deliveries: 0,
          successRate: 0,
          averageTime: 0
        });
      }

      const driver = driverMap.get(driverName)!;
      driver.deliveries++;
      
      // Calculate success rate
      const completedDeliveries = Array.from(driverMap.values())
        .filter(d => d.name === driverName)
        .reduce((acc, d) => acc + d.deliveries, 0);
      
      if (delivery.status === 'delivered') {
        const successfulDeliveries = deliveryData
          .filter(d => d.driverName === driverName && d.status === 'delivered').length;
        driver.successRate = completedDeliveries > 0 ? successfulDeliveries / completedDeliveries : 0;
      }
    });

    return Array.from(driverMap.values());
  };

  const processCustomerData = (deliveryData: DeliveryData[]): CustomerData[] => {
    const customerMap = new Map<string, CustomerData>();

    deliveryData.forEach(delivery => {
      const customerName = delivery.customerName;
      if (!customerName) return;

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          id: customerName,
          name: customerName,
          address: delivery.address,
          deliveries: 0,
          averageRating: delivery.rating || 0
        });
      }

      const customer = customerMap.get(customerName)!;
      customer.deliveries++;
      
      // Update average rating if delivery has rating
      if (delivery.rating) {
        customer.averageRating = (customer.averageRating + delivery.rating) / 2;
      }
    });

    return Array.from(customerMap.values());
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching delivery data from Supabase...');

      // Fetch data from Supabase
      const [supabaseData, processingStats] = await Promise.all([
        CSVProcessingService.getDeliveryData(),
        CSVProcessingService.getProcessingStats()
      ]);

      console.log(`📊 Loaded ${supabaseData.length} deliveries from Supabase`);

      // Transform Supabase data to our format
      const transformedDeliveryData = transformSupabaseToDeliveryData(supabaseData);
      const processedDriverData = processDriverData(transformedDeliveryData);
      const processedCustomerData = processCustomerData(transformedDeliveryData);

      setDeliveryData(transformedDeliveryData);
      setDriverData(processedDriverData);
      setCustomerData(processedCustomerData);
      setStats(processingStats);

      console.log('✅ Data successfully loaded and processed:', {
        deliveries: transformedDeliveryData.length,
        drivers: processedDriverData.length,
        customers: processedCustomerData.length,
        uniqueJobIds: processingStats.uniqueJobIds
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from Supabase';
      setError(errorMessage);
      console.error('❌ Error fetching delivery data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    deliveryData,
    driverData,
    customerData,
    loading,
    error,
    refetch: fetchData,
    stats,
  };
}; 