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
}

export const useDeliveryData = (): UseDeliveryDataResult => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [driverData, setDriverData] = useState<DriverData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFromService = useCallback(async () => {
    try {
      setLoading(true);
      const [deliveryResult, driverResult, customerResult] = await Promise.all([
        dataService.getDeliveryData(),
        dataService.getDriverData(),
        dataService.getCustomerData(),
      ]);

      const errors = [deliveryResult.error, driverResult.error, customerResult.error]
        .filter(Boolean)
        .filter(error => error !== 'No stored data available');
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      console.log('📊 Fetching from service, setting data:', {
        deliveries: deliveryResult.data?.length,
        drivers: driverResult.data?.length,
        customers: customerResult.data?.length,
      });

      setDeliveryData(deliveryResult.data || []);
      setDriverData(driverResult.data || []);
      setCustomerData(customerResult.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching data from service:', err);
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

  const initializeData = useCallback(async () => {
    setLoading(true);
    // Check if data already exists to avoid overwriting
    const existingData = await dataService.getDeliveryData();
    if (existingData.data && existingData.data.length > 0) {
      console.log('📦 Dados existentes encontrados. Pulando o carregamento estático.');
      await fetchFromService();
      return;
    }
    
    // If no data, try to load from static file
    try {
      const response = await fetch('/arquivo-csv/export_job_(15)[1] - Worksheet.csv');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], 'export_job_(15)[1] - Worksheet.csv', { type: 'text/csv' });
      
      console.log('📄 Carregando dados do arquivo CSV estático...');
      const parsedResults = await parseFile(file);
      const formattedData = formatDeliveryData(parsedResults.data);
      await dataService.updateDeliveryData(formattedData);
      console.log('✅ Dados do CSV estático carregados e armazenados com sucesso.');
    } catch (e) {
      console.warn('⚠️ Não foi possível carregar o CSV estático. Isso é normal se o arquivo não existir.');
    } finally {
      // Always fetch from service to populate state
      await fetchFromService();
    }
  }, [fetchFromService]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  return {
    deliveryData,
    driverData,
    customerData,
    loading,
    error,
    refetch: fetchFromService,
    updateData,
  };
}; 