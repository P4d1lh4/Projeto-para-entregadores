import { DELIVERY_STATUS } from '../../../constants/dashboard';

export const calculateSuccessRate = (deliveries: any[]): number => {
  if (deliveries.length === 0) return 0;
  
  const deliveredCount = deliveries.filter(d => d.status === DELIVERY_STATUS.DELIVERED).length;
  return Math.round((deliveredCount / deliveries.length) * 100);
};

// Helper function to normalize and clean driver identifiers
const normalizeDriverId = (value: any): string | null => {
  if (!value || value === null || value === undefined) return null;
  
  const strValue = String(value).trim();
  if (strValue === '' || strValue.toLowerCase() === 'null' || strValue.toLowerCase() === 'undefined') {
    return null;
  }
  
  // Remove extra spaces, normalize case, remove special characters that might cause duplicates
  return strValue
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-_.@]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores, dots, @
    .trim();
};

// Enhanced function to extract and map driver identifiers
const extractDriverIdentifier = (delivery: any): string | null => {
  // Priority list of fields to check for driver identification
  const driverFields = [
    'collecting_driver', // Priority 1: Collecting Driver from CSV
    'delivering_driver', // Priority 2: Delivering Driver from CSV  
    'driverId',
    'driver_id',
    'courier',
    'driver',
    'driverName',
    'collecting_driver_id',
    'delivering_driver_id'
  ];

  for (const field of driverFields) {
    const value = delivery[field];
    if (value) {
      const normalized = normalizeDriverId(value);
      if (normalized) {
        return normalized;
      }
    }
  }
  
  // If no specific driver field found, try to extract from job_id or other composite fields
  if (delivery.job_id) {
    const jobId = String(delivery.job_id).toLowerCase();
    const driverIdMatch = jobId.match(/(?:driver|drv|courier)[_-]?(\w+)/i);
    if (driverIdMatch) {
      return normalizeDriverId(`driver_${driverIdMatch[1]}`);
    }
  }

  return null;
};

export function calculateActiveDrivers(deliveries: any[] = []): number {
  console.log(`🚀 Calculating active drivers from ${deliveries.length} deliveries...`);
  
  if (!deliveries || deliveries.length === 0) {
    console.log('⚠️ No deliveries provided for active drivers calculation');
    return 0;
  }

  const uniqueDriverIds = new Set<string>();
  let identificationStats = { found: 0, missing: 0 };

  deliveries.forEach((delivery, index) => {
    // Extract driver identifier using priority fields (Collecting Driver, Delivering Driver, etc.)
    const driverIdentifier = extractDriverIdentifier(delivery);
    
    if (driverIdentifier) {
      uniqueDriverIds.add(driverIdentifier);
      identificationStats.found++;
      
      // Log for debugging first few entries
      if (index < 3) {
        console.log(`✅ Driver ${index + 1}: "${driverIdentifier}" (from collecting: "${delivery.collecting_driver}", delivering: "${delivery.delivering_driver}")`);
      }
    } else {
      identificationStats.missing++;
      if (index < 3) {
        console.log(`⚠️ Delivery ${index + 1}: No driver identifier found`);
      }
    }
  });

  console.log(`📊 Driver identification stats:`, identificationStats);
  console.log(`📊 Unique driver identifiers found: ${uniqueDriverIds.size}`);
  console.log(`📊 Driver identification rate: ${((identificationStats.found / deliveries.length) * 100).toFixed(1)}%`);

  return uniqueDriverIds.size;
}

export const calculateNewDrivers = (deliveries: any[], days = 30): number => {
  if (deliveries.length === 0) return 0;
  
  console.log(`🆕 Calculating new drivers in the last ${days} days...`);
  
  const driverFirstDelivery = new Map<string, Date>();
  
  // Find the first delivery date for each driver
  deliveries.forEach(delivery => {
    const driverId = delivery.delivering_driver || delivery.driverId || delivery.driverName;
    const createdAt = delivery.created_at || delivery.deliveryTime;
    
    if (driverId && createdAt) {
      try {
        const deliveryDate = new Date(createdAt);
        
        if (!driverFirstDelivery.has(driverId) || deliveryDate < driverFirstDelivery.get(driverId)!) {
          driverFirstDelivery.set(driverId, deliveryDate);
        }
      } catch (e) {
        // Ignore invalid dates
      }
    }
  });
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
  
  let newDriverCount = 0;
  driverFirstDelivery.forEach((firstDate, driverId) => {
    if (firstDate >= thirtyDaysAgo) {
      newDriverCount++;
      console.log(`  -> Found new driver: ${driverId} (First delivery: ${firstDate.toISOString().split('T')[0]})`);
    }
  });
  
  console.log(`✅ Found ${newDriverCount} new drivers.`);
  return newDriverCount;
};

export const calculateAverageDeliveryTime = (deliveries: any[]): number => {
  const deliveredOrders = deliveries.filter(d => 
    d.status === DELIVERY_STATUS.DELIVERED || d.status === 'delivered'
  );
  
  if (deliveredOrders.length === 0) return 0;
  
  let totalTimeMinutes = 0;
  let validDeliveries = 0;
  
  deliveredOrders.forEach(delivery => {
    let timeInMinutes = 0;
    
    // Try to calculate from collected_at and delivered_at (Fox delivery data)
    if (delivery.collected_at && delivery.delivered_at) {
      try {
        const collectedTime = new Date(delivery.collected_at);
        const deliveredTime = new Date(delivery.delivered_at);
        timeInMinutes = (deliveredTime.getTime() - collectedTime.getTime()) / (1000 * 60);
      } catch (e) {
        // Invalid dates, skip this delivery
        return;
      }
    }
    // Fallback to mock/generated data fields
    else if (delivery.averageTime) {
      timeInMinutes = delivery.averageTime;
    }
    // Last resort: use deterministic calculation only if no real data available
    else if (delivery.id) {
      const driverNumber = parseInt(delivery.driverId?.split('-')[1]) || 1;
      const baseTime = 25; // Base time in minutes  
      const variationSeed = (driverNumber * 7) % 20; // Deterministic variation 0-19
      timeInMinutes = baseTime + variationSeed;
    }
    
    // Only include reasonable delivery times (5 minutes to 8 hours)
    if (timeInMinutes > 5 && timeInMinutes < 480) {
      totalTimeMinutes += timeInMinutes;
      validDeliveries++;
    }
  });
  
  if (validDeliveries === 0) return 0;
  
  // Return average time in hours (converted from minutes)
  const avgMinutes = totalTimeMinutes / validDeliveries;
  return Math.round((avgMinutes / 60) * 10) / 10; // Round to 1 decimal place
};

export const calculateDeliveryTimeTrend = (deliveries: any[]) => {
  // Dummy implementation for trend calculation
  // Replace with actual trend logic
  const recentDeliveries = deliveries.slice(-20);
  const olderDeliveries = deliveries.slice(0, Math.max(0, deliveries.length - 20));

  const recentAvg = calculateAverageDeliveryTime(recentDeliveries);
  const olderAvg = calculateAverageDeliveryTime(olderDeliveries);
  
  if (recentAvg === 0 || olderAvg === 0) {
    return { value: 0, isPositive: false };
  }

  const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
  return {
    value: Math.abs(Math.round(trend)),
    isPositive: trend < 0 // Lower time is better
  };
}; 