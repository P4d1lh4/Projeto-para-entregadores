import { useMemo } from 'react';
import type { DashboardStats } from '../types';
import { 
  calculateSuccessRate, 
  calculateActiveDrivers, 
  calculateAverageDeliveryTime,
  calculateNewDrivers
} from '../utils/calculations';

export const useDashboardStats = (deliveryData: any[], driverData: any[]): DashboardStats => {
  return useMemo(() => {
    if (deliveryData.length === 0) {
      return {
        totalDeliveries: 0,
        successRate: 0,
        activeDrivers: 0,
        averageDeliveryTime: 0,
        newDrivers: 0,
      };
    }

    const totalDeliveries = deliveryData.length;
    const successRate = calculateSuccessRate(deliveryData);
    const activeDrivers = calculateActiveDrivers(deliveryData);
    const averageDeliveryTime = calculateAverageDeliveryTime(deliveryData);
    const newDrivers = calculateNewDrivers(deliveryData);

    return {
      totalDeliveries,
      successRate,
      activeDrivers,
      averageDeliveryTime,
      newDrivers,
    };
  }, [deliveryData, driverData]);
}; 