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

// Enhanced function to extract and map driver identifiers using job_id
const extractDriverIdentifier = (delivery: any): string | null => {
  // Priority 1: Use job_id combined with driver name for unique identification
  if (delivery.job_id) {
    const driverName = delivery.collecting_driver || delivery.delivering_driver || delivery.driverId || delivery.driver;
    if (driverName) {
      const normalized = normalizeDriverId(driverName);
      if (normalized) {
        // Return combination of job_id and normalized driver name for tracking
        return `${delivery.job_id}-${normalized}`;
      }
    }
    // If no driver name but has job_id, use job_id as identifier
    return `job-${delivery.job_id}`;
  }
  
  // Fallback: Priority list of fields to check for driver identification
  const driverFields = [
    'collecting_driver', // Priority 2: Collecting Driver from CSV
    'delivering_driver', // Priority 3: Delivering Driver from CSV  
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
  
  // If no specific driver field found, try to extract from job_id patterns
  if (delivery.job_id && typeof delivery.job_id === 'string') {
    const jobIdMatch = delivery.job_id.match(/(\w+)-(\w+)/);
    if (jobIdMatch) {
      return normalizeDriverId(jobIdMatch[1]);
    }
  }
  
  return null;
};

// Function to extract actual driver name (without job_id prefix)
const extractDriverName = (delivery: any): string => {
  const driverName = delivery.collecting_driver || delivery.delivering_driver || delivery.driverName || delivery.driver;
  if (driverName) {
    return String(driverName).trim();
  }
  
  if (delivery.job_id) {
    return `Driver for Job ${delivery.job_id}`;
  }
  
  return 'Unknown Driver';
};

export const calculateActiveDrivers = (deliveries: any[]): number => {
  console.log('🚛 Calculating active drivers using unique job_id counting...');
  console.log(`📊 Processing ${deliveries.length} deliveries`);
  
  if (!deliveries || deliveries.length === 0) {
    console.log('❌ No deliveries to process');
    return 0;
  }

  // Count unique job_ids directly
  const uniqueJobIds = new Set<string>();
  
  deliveries.forEach((delivery, index) => {
    const jobId = delivery.job_id;
    
    if (jobId) {
      uniqueJobIds.add(String(jobId));
    }
    
    // Log first few for debugging
    if (index < 5) {
      console.log(`🔍 Delivery ${index + 1}: Job ID: ${jobId}`);
    }
  });

  const totalUniqueJobs = uniqueJobIds.size;
  
  console.log(`📈 Results:`);
  console.log(`  - Total deliveries: ${deliveries.length}`);
  console.log(`  - Unique job_ids found: ${totalUniqueJobs}`);
  console.log(`  - Using unique job_id count for active drivers: ${totalUniqueJobs}`);
  
  // Return the count based on unique job_ids
  return totalUniqueJobs;
};

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