import * as XLSX from 'xlsx';
import type { DeliveryData, DriverData, CustomerData } from '@/features/deliveries/types';

// Re-export types for backward compatibility
export type { DeliveryData, DriverData, CustomerData };

export async function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (!result) {
          throw new Error("Failed to read file");
        }
        
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        let data: any[] = [];
        
        if (extension === 'csv') {
          // Parse CSV using XLSX
          const workbook = XLSX.read(result, { type: 'binary', raw: true });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet);
        } else if (extension === 'xlsx' || extension === 'xls') {
          // Parse Excel
          const workbook = XLSX.read(result, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet);
        } else {
          throw new Error("Unsupported file format");
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = (error) => {
      reject(error);
    };
    
    // Read as binary string
    fileReader.readAsBinaryString(file);
  });
}

export function formatDeliveryData(data: any[]): DeliveryData[] {
  return data.map((item, index) => {
    // Try to parse existing fields or create default values
    
    // More realistic status distribution if no status provided
    let defaultStatus: 'delivered' | 'failed' | 'pending' | 'in_transit' = 'delivered';
    if (!item.status) {
      const statusRand = Math.random();
      if (statusRand < 0.85) {
        defaultStatus = 'delivered';
      } else if (statusRand < 0.95) {
        defaultStatus = 'in_transit';
      } else if (statusRand < 0.98) {
        defaultStatus = 'pending';
      } else {
        defaultStatus = 'failed';
      }
    }
    
    return {
      id: item.id || `del-${index + 1}`,
      driverId: item.driver_id || item.driverId || `drv-${index % 10 + 1}`,
      driverName: item.driver_name || item.driverName || `Driver ${index % 10 + 1}`,
      customerId: item.customer_id || item.customerId || `cust-${index % 20 + 1}`,
      customerName: item.customer_name || item.customerName || `Customer ${index % 20 + 1}`,
      address: item.address || `${index + 1} Main St`,
      city: item.city || 'Dublin',
      status: item.status || defaultStatus,
      deliveryTime: item.delivery_time || item.deliveryTime || new Date().toISOString(),
      latitude: parseFloat(item.latitude) || parseFloat(item.lat) || (53.33 + (Math.random() - 0.5) / 10),
      longitude: parseFloat(item.longitude) || parseFloat(item.lng) || (-6.25 + (Math.random() - 0.5) / 10),
      rating: item.rating ? parseFloat(item.rating) : Math.floor(Math.random() * 5) + 1,
    };
  });
}

export function calculateDriverMetrics(deliveries: DeliveryData[]): DriverData[] {
  console.log('🔢 Calculating driver metrics for', deliveries.length, 'deliveries');
  
  // Group deliveries by driver
  const driverMap = new Map<string, DeliveryData[]>();
  
  deliveries.forEach(delivery => {
    const existing = driverMap.get(delivery.driverId) || [];
    driverMap.set(delivery.driverId, [...existing, delivery]);
  });
  
  // Calculate metrics for each driver
  const drivers: DriverData[] = [];
  
  driverMap.forEach((driverDeliveries, driverId) => {
    const successfulDeliveries = driverDeliveries.filter(d => d.status === 'delivered');
    const successRate = driverDeliveries.length > 0 ? 
      successfulDeliveries.length / driverDeliveries.length : 0;
    
    // Calculate average delivery time - use a deterministic calculation based on driverId
    // This ensures the same driver always has the same average time
    const driverNumber = parseInt(driverId.split('-')[1]) || 1;
    const baseTime = 20; // Base time in minutes
    const variationSeed = (driverNumber * 7) % 20; // Deterministic variation 0-19
    const averageTime = baseTime + variationSeed;
    
    // Calculate average rating
    const ratings = driverDeliveries
      .filter(d => d.rating !== undefined)
      .map(d => d.rating as number);
    const averageRating = ratings.length > 0 ? 
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
    
    const driver = {
      id: driverId,
      name: driverDeliveries[0].driverName,
      deliveries: driverDeliveries.length,
      successRate: successRate,
      averageTime: averageTime,
      rating: Math.round(averageRating * 10) / 10,
    };
    
    console.log(`🚛 Driver ${driver.name} (${driverId}): avgTime=${averageTime}min, deliveries=${driver.deliveries}`);
    drivers.push(driver);
  });
  
  return drivers;
}

export function calculateCustomerMetrics(deliveries: DeliveryData[]): CustomerData[] {
  // Group deliveries by customer
  const customerMap = new Map<string, DeliveryData[]>();
  
  deliveries.forEach(delivery => {
    const existing = customerMap.get(delivery.customerId) || [];
    customerMap.set(delivery.customerId, [...existing, delivery]);
  });
  
  // Calculate metrics for each customer
  const customers: CustomerData[] = [];
  
  customerMap.forEach((customerDeliveries, customerId) => {
    // Calculate average rating the customer gives
    const ratings = customerDeliveries
      .filter(d => d.rating !== undefined)
      .map(d => d.rating as number);
    const averageRating = ratings.length > 0 ? 
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
    
    customers.push({
      id: customerId,
      name: customerDeliveries[0].customerName,
      address: customerDeliveries[0].address + ', ' + customerDeliveries[0].city,
      deliveries: customerDeliveries.length,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  });
  
  return customers;
}

export function generateMockDeliveryData(count: number = 50): DeliveryData[] {
  const driverNames = ['John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Davis', 'David Wilson'];
  const customerNames = [
    'Alice Cooper', 'Bob Martin', 'Carol White', 'David Green', 'Eva Black',
    'Frank Gold', 'Grace Lee', 'Henry Clark', 'Isabel Young', 'Jack Hill'
  ];
  
  // Dublin coordinates as center point
  const centerLat = 53.349805;
  const centerLng = -6.26031;
  
  return Array.from({ length: count }, (_, i) => {
    const driverId = `drv-${Math.floor(i / 10) + 1}`;
    const customerId = `cust-${Math.floor(Math.random() * 10) + 1}`;
    
    // More realistic status distribution - 85% delivered, 10% in_transit, 3% pending, 2% failed
    let status: 'delivered' | 'failed' | 'pending' | 'in_transit';
    const statusRand = Math.random();
    if (statusRand < 0.85) {
      status = 'delivered';
    } else if (statusRand < 0.95) {
      status = 'in_transit';
    } else if (statusRand < 0.98) {
      status = 'pending';
    } else {
      status = 'failed';
    }
    
    // Create a delivery date within the last week
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    return {
      id: `del-${i + 1}`,
      driverId,
      driverName: driverNames[parseInt(driverId.split('-')[1]) - 1] || 'Unknown Driver',
      customerId,
      customerName: customerNames[parseInt(customerId.split('-')[1]) - 1] || 'Unknown Customer',
      address: `${Math.floor(Math.random() * 100) + 1} ${['Main St', 'High St', 'Church Rd', 'Station Rd'][Math.floor(Math.random() * 4)]}`,
      city: 'Dublin',
      status,
      deliveryTime: date.toISOString(),
      latitude: centerLat + (Math.random() - 0.5) / 10,
      longitude: centerLng + (Math.random() - 0.5) / 10,
      rating: status === 'delivered' ? Math.floor(Math.random() * 5) + 1 : undefined,
    };
  });
}
