import type { DeliveryData, DriverData, CustomerData, DeliveryFilters } from '../types';

export const filterDeliveries = (deliveries: DeliveryData[], filters: DeliveryFilters): DeliveryData[] => {
  try {
    // Verify inputs
    if (!Array.isArray(deliveries)) {
      console.warn('filterDeliveries: deliveries is not an array:', deliveries);
      return [];
    }
    
    if (!filters || typeof filters !== 'object') {
      console.warn('filterDeliveries: filters is not a valid object:', filters);
      return deliveries;
    }

    return deliveries.filter(delivery => {
      try {
        // Verify delivery object
        if (!delivery || typeof delivery !== 'object') {
          console.warn('Invalid delivery object:', delivery);
          return false;
        }

        // Status filter
        if (filters.status && filters.status !== '' && filters.status !== 'all') {
          if (!delivery.status || delivery.status !== filters.status) {
            return false;
          }
        }
        
        // Driver filter - accept both driverId and driverName
        if (filters.driverId && filters.driverId !== '' && filters.driverId !== 'all') {
          const driverId = delivery.driverId;
          const driverName = delivery.driverName;
          
          if (!driverId && !driverName) {
            return false;
          }
          
          const matchesDriverId = driverId === filters.driverId;
          const matchesDriverName = driverName === filters.driverId;
          
          if (!matchesDriverId && !matchesDriverName) {
            return false;
          }
        }
        
        // Customer filter - accept both customerId and customerName  
        if (filters.customerId && filters.customerId !== '' && filters.customerId !== 'all') {
          const customerId = delivery.customerId;
          const customerName = delivery.customerName;
          
          if (!customerId && !customerName) {
            return false;
          }
          
          const matchesCustomerId = customerId === filters.customerId;
          const matchesCustomerName = customerName === filters.customerId;
          
          if (!matchesCustomerId && !matchesCustomerName) {
            return false;
          }
        }
        
        // Date filters
        if (filters.dateFrom || filters.dateTo) {
          if (!delivery.deliveryTime) {
            return false;
          }
          
          try {
            const deliveryDate = new Date(delivery.deliveryTime);
            
            if (isNaN(deliveryDate.getTime())) {
              console.warn('Invalid delivery date:', delivery.deliveryTime);
              return false;
            }
            
            if (filters.dateFrom && deliveryDate < filters.dateFrom) {
              return false;
            }
            
            if (filters.dateTo && deliveryDate > filters.dateTo) {
              return false;
            }
          } catch (dateError) {
            console.warn('Error parsing delivery date:', delivery.deliveryTime, dateError);
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error filtering individual delivery:', error, delivery);
        return false;
      }
    });
  } catch (error) {
    console.error('Error in filterDeliveries:', error);
    return [];
  }
};

export const sortDeliveriesByDate = (deliveries: DeliveryData[], ascending = false): DeliveryData[] => {
  return [...deliveries].sort((a, b) => {
    const dateA = new Date(a.deliveryTime).getTime();
    const dateB = new Date(b.deliveryTime).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const getDeliveryStatusColor = (status: string): string => {
  switch (status) {
    case 'delivered':
      return 'text-green-600 bg-green-100';
    case 'in_transit':
      return 'text-blue-600 bg-blue-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const formatDeliveryStatus = (status: string): string => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const calculateDeliveryMetrics = (deliveries: DeliveryData[]) => {
  const total = deliveries.length;
  const delivered = deliveries.filter(d => d.status === 'delivered').length;
  const failed = deliveries.filter(d => d.status === 'failed').length;
  const pending = deliveries.filter(d => d.status === 'pending').length;
  const inTransit = deliveries.filter(d => d.status === 'in_transit').length;

  return {
    total,
    delivered,
    failed,
    pending,
    inTransit,
    successRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
    failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
  };
};

export const groupDeliveriesByDriver = (deliveries: DeliveryData[]): Record<string, DeliveryData[]> => {
  return deliveries.reduce((acc, delivery) => {
    if (!acc[delivery.driverId]) {
      acc[delivery.driverId] = [];
    }
    acc[delivery.driverId].push(delivery);
    return acc;
  }, {} as Record<string, DeliveryData[]>);
};

export const getRecentDeliveries = (deliveries: DeliveryData[], limit = 10): DeliveryData[] => {
  return sortDeliveriesByDate(deliveries, false).slice(0, limit);
}; 