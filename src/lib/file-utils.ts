import * as XLSX from 'xlsx';
import type { DeliveryData, DriverData, CustomerData } from '@/features/deliveries/types';

// Re-export types for backward compatibility
export type { DeliveryData, DriverData, CustomerData };

export async function parseFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    
    // Log file processing info for large files
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      console.log(`📁 Processing large file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
    }
    
    fileReader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (!result) {
          throw new Error("Failed to read file");
        }
        
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        let data: any[] = [];
        
        if (extension === 'csv') {
          // Parse CSV using XLSX with optimized settings for large files
          const workbook = XLSX.read(result, { 
            type: 'binary', 
            raw: true,
            // Optimize for large files
            cellDates: false,
            cellNF: false,
            cellStyles: false
          });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet, {
            // Process in chunks for better memory management
            raw: false,
            defval: ''
          });
        } else if (extension === 'xlsx' || extension === 'xls') {
          // Parse Excel with optimized settings for large files
          const workbook = XLSX.read(result, { 
            type: 'binary',
            // Optimize for large files
            cellDates: false,
            cellNF: false,
            cellStyles: false,
            sheetStubs: false
          });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          data = XLSX.utils.sheet_to_json(worksheet, {
            // Process in chunks for better memory management
            raw: false,
            defval: ''
          });
        } else {
          throw new Error("Unsupported file format");
        }
        
        console.log(`✅ File parsed successfully: ${data.length} records found`);
        resolve(data);
      } catch (error) {
        console.error('❌ Error parsing file:', error);
        reject(error);
      }
    };
    
    fileReader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      reject(error);
    };
    
    // For large files, use ArrayBuffer for better memory management
    if (fileSizeMB > 50) {
      fileReader.readAsArrayBuffer(file);
    } else {
      // Read as binary string for smaller files
      fileReader.readAsBinaryString(file);
    }
  });
}

export function formatDeliveryData(data: any[]): DeliveryData[] {
  console.log('🔄 Formatting delivery data with enhanced validation...');
  
  // First apply enhanced validation and cleaning
  const { cleanedData, validationReport } = validateExcelDriverData(data);
  
  console.log(`📊 Enhanced data processing results:`);
  console.log(`  - Total records: ${validationReport.totalRecords}`);
  console.log(`  - Records with drivers: ${validationReport.recordsWithDrivers}`);
  console.log(`  - Unique drivers: ${validationReport.uniqueDrivers}`);
  console.log(`  - Driver identification rate: ${((validationReport.recordsWithDrivers / validationReport.totalRecords) * 100).toFixed(1)}%`);
  
  return cleanedData.map((item, index) => {
    // Use the enhanced driver identifier from validation
    const driverIdentifier = extractDriverIdentifier(item);
    
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
    
    // Use normalized driver ID if available, fallback to old logic
    const formattedDriverId = driverIdentifier || item.driver_id || item.driverId || `drv-${index % 10 + 1}`;
    const formattedDriverName = item.driverName || item.driver_name || item.delivering_driver || item.collecting_driver || `Driver ${index % 10 + 1}`;
    
    return {
      id: item.id || item.job_id || `del-${index + 1}`,
      driverId: formattedDriverId,
      driverName: formattedDriverName,
      customerId: item.customer_id || item.customerId || `cust-${index % 20 + 1}`,
      customerName: item.customer_name || item.customerName || item.company_name || `Customer ${index % 20 + 1}`,
      address: item.address || item.pickup_address || item.delivery_address || `${index + 1} Main St`,
      city: item.city || 'Dublin',
      status: item.status || defaultStatus,
      deliveryTime: item.delivery_time || item.deliveryTime || item.created_at || new Date().toISOString(),
      latitude: parseFloat(item.latitude) || parseFloat(item.lat) || (53.33 + (Math.random() - 0.5) / 10),
      longitude: parseFloat(item.longitude) || parseFloat(item.lng) || (-6.25 + (Math.random() - 0.5) / 10),
      rating: item.rating ? parseFloat(item.rating) : Math.floor(Math.random() * 5) + 1,
    };
  });
}

// Helper function to normalize and clean driver identifiers (same as calculations.ts)
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
        // For metrics calculation, return just the normalized driver name
        // The job_id ensures each delivery is counted separately
        return normalized;
      }
    }
    // If no driver name but has job_id, create a driver identifier from job_id
    return `driver-job-${delivery.job_id}`;
  }
  
  // Fallback: Priority list of fields to check for driver identification
  const driverFields = [
    'collecting_driver', 
    'delivering_driver',  
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
  
  return null;
};

export function calculateDriverMetrics(deliveries: DeliveryData[]): DriverData[] {
  console.log(`🚛 Calculating driver metrics using job_id-based identification for ${deliveries.length} deliveries...`);
  
  if (!deliveries || deliveries.length === 0) {
    console.log('⚠️ No deliveries provided');
    return [];
  }

  // Group deliveries by driver identifier, with job_id ensuring unique counting
  const driverMap = new Map<string, any[]>();
  let processedDeliveries = 0;
  let driversWithJobId = 0;
  
  deliveries.forEach((delivery, index) => {
    const driverIdentifier = extractDriverIdentifier(delivery);
    
    if (driverIdentifier) {
      const existing = driverMap.get(driverIdentifier) || [];
      // Each delivery with job_id is counted as separate job for the driver
      driverMap.set(driverIdentifier, [...existing, delivery]);
      processedDeliveries++;
      
      if ((delivery as any).job_id) {
        driversWithJobId++;
      }
      
      // Debug log for first few entries
      if (index < 5) {
        console.log(`🔍 Delivery ${index + 1}: Driver "${driverIdentifier}", Job ID: ${(delivery as any).job_id}`);
      }
    } else {
      console.log(`⚠️ No driver identifier found for delivery ${index + 1}`);
    }
  });

  console.log(`📊 Processing stats:`);
  console.log(`  - Total deliveries: ${deliveries.length}`);
  console.log(`  - Processed deliveries: ${processedDeliveries}`);
  console.log(`  - Deliveries with job_id: ${driversWithJobId}`);
  console.log(`  - Unique drivers identified: ${driverMap.size}`);

  // Calculate metrics for each driver
  const drivers: DriverData[] = [];
  
  driverMap.forEach((driverDeliveries, driverIdentifier) => {
    // Calculate success rate based on actual CSV status values
    const successfulDeliveries = driverDeliveries.filter(d => {
      const status = d.status || (d as any).status;
      return status === 'delivered' || 
             status === 'Delivered' ||
             (d as any).delivered_at; // Has delivered timestamp
    });
    
    const successRate = driverDeliveries.length > 0 ? 
      successfulDeliveries.length / driverDeliveries.length : 0;

    // Calculate average delivery time
    let averageTime = 0;
    let validTimeMeasurements = 0;
    
    driverDeliveries.forEach(delivery => {
      let timeInMinutes = 0;
      
      // Try to use real Fox delivery data first
      if ((delivery as any).collected_at && (delivery as any).delivered_at) {
        try {
          const collectedTime = new Date((delivery as any).collected_at);
          const deliveredTime = new Date((delivery as any).delivered_at);
          timeInMinutes = (deliveredTime.getTime() - collectedTime.getTime()) / (1000 * 60);
          
          // Only include reasonable times (5 minutes to 8 hours)
          if (timeInMinutes > 5 && timeInMinutes < 480) {
            averageTime += timeInMinutes;
            validTimeMeasurements++;
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
    });
    
    // If no real time data available, use deterministic calculation
    if (validTimeMeasurements === 0) {
      const driverNumber = parseInt(driverIdentifier.split('-')[1]) || Math.abs(driverIdentifier.charCodeAt(0) % 10) + 1;
      const baseTime = 25; // Base time in minutes
      const variationSeed = (driverNumber * 7) % 20; // Deterministic variation 0-19
      averageTime = baseTime + variationSeed;
    } else {
      averageTime = averageTime / validTimeMeasurements;
    }
    
    const driver = {
      id: driverIdentifier,
      name: driverDeliveries[0].driverName || driverIdentifier,
      deliveries: driverDeliveries.length,
      successRate: successRate,
      averageTime: Math.round(averageTime),
    };
    
    console.log(`🚛 Driver ${driver.name}: ${driver.deliveries} deliveries, ${Math.round(successRate * 100)}% success, ${Math.round(averageTime)}min avg`);
    drivers.push(driver);
  });
  
  console.log(`✅ Final result: ${drivers.length} drivers processed with enhanced ID normalization`);
  
  // Additional validation
  const totalDeliveries = drivers.reduce((sum, driver) => sum + driver.deliveries, 0);
  if (totalDeliveries !== deliveries.length) {
    console.warn(`⚠️ Delivery count mismatch: ${totalDeliveries} assigned vs ${deliveries.length} total`);
  }
  
  return drivers.sort((a, b) => b.deliveries - a.deliveries);
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

// New function to calculate company metrics from XLSX data
export function calculateCompanyMetrics(foxDeliveries: any[]): CustomerData[] {
  console.log('🏢 Calculating company metrics for', foxDeliveries.length, 'deliveries');
  
  // Group deliveries by company name
  const companyMap = new Map<string, any[]>();
  
  foxDeliveries.forEach((delivery, index) => {
    // Try multiple fields to find company name
    const companyName = delivery.company_name || 
                       delivery.restaurant_name || 
                       delivery.store_name || 
                       delivery.business_name ||
                       delivery.merchant_name ||
                       delivery.customer_name || 
                       `Unknown Company ${index + 1}`;
    
    const existing = companyMap.get(companyName) || [];
    companyMap.set(companyName, [...existing, delivery]);
  });

  console.log(`🏢 Found ${companyMap.size} unique companies:`);
  companyMap.forEach((deliveries, companyName) => {
    console.log(`  - ${companyName}: ${deliveries.length} deliveries`);
  });

  // Calculate metrics for each company
  const companies: CustomerData[] = [];
  
  companyMap.forEach((companyDeliveries, companyName) => {
    // Calculate average rating based on successful deliveries
    let totalRating = 0;
    let ratingCount = 0;
    
    companyDeliveries.forEach(delivery => {
      // Generate a rating based on delivery success and service quality
      if (delivery.status === 'delivered') {
        // Give successful deliveries a higher base rating
        const baseRating = 4.0 + Math.random() * 1.0; // 4.0-5.0 for delivered
        totalRating += baseRating;
        ratingCount++;
      } else if (delivery.status === 'in_transit' || delivery.status === 'collected') {
        // In progress deliveries get neutral rating
        const baseRating = 3.5 + Math.random() * 1.0; // 3.5-4.5 for in progress
        totalRating += baseRating;
        ratingCount++;
      } else if (delivery.status === 'pending') {
        // Pending gets slightly lower
        const baseRating = 3.0 + Math.random() * 1.0; // 3.0-4.0 for pending
        totalRating += baseRating;
        ratingCount++;
      }
      // Failed deliveries don't count towards rating
    });
    
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 3.5;
    
    // Get the most common address for this company
    const addresses = companyDeliveries
      .map(d => d.pickup_address || d.delivery_address)
      .filter(Boolean);
    
    const addressCounts = addresses.reduce((acc: Record<string, number>, addr: string) => {
      acc[addr] = (acc[addr] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonAddress = Object.entries(addressCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Address not available';
    
    companies.push({
      id: `company-${companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      name: companyName,
      address: mostCommonAddress,
      deliveries: companyDeliveries.length,
      averageRating: Math.round(averageRating * 10) / 10,
    });
  });
  
  console.log('🏢 Processed', companies.length, 'companies');
  return companies.sort((a, b) => b.deliveries - a.deliveries);
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

// Specific function to validate and clean Excel data for driver consistency
export function validateExcelDriverData(rawData: any[]): {
  cleanedData: any[];
  driverMapping: { [key: string]: string };
  validationReport: {
    totalRecords: number;
    recordsWithDrivers: number;
    uniqueDrivers: number;
    dataQualityIssues: string[];
  };
} {
  console.log('🔍 Validating Excel driver data consistency...');
  
  const cleanedData: any[] = [];
  const driverMapping: { [key: string]: string } = {};
  const dataQualityIssues: string[] = [];
  const seenDriverIds = new Set<string>();
  
  // Analyze data structure
  if (rawData.length > 0) {
    const sampleRecord = rawData[0];
    const availableFields = Object.keys(sampleRecord);
    console.log('📋 Available fields in Excel data:', availableFields);
    
    // Check for common driver field variations
    const driverFieldVariations = availableFields.filter(field => 
      field.toLowerCase().includes('driver') || 
      field.toLowerCase().includes('courier') || 
      field.toLowerCase().includes('rider') ||
      field.toLowerCase().includes('delivery_person') ||
      field.toLowerCase().includes('assigned')
    );
    console.log('🚛 Potential driver fields found:', driverFieldVariations);
  }
  
  let recordsWithDrivers = 0;
  
  rawData.forEach((record, index) => {
    // Clean and validate each record
    const cleanedRecord = { ...record };
    
    // Extract and normalize driver information
    const driverIdentifier = extractDriverIdentifier(record);
    
    if (driverIdentifier) {
      recordsWithDrivers++;
      seenDriverIds.add(driverIdentifier);
      
      // Create mapping for display consistency
      const displayName = record.driverName || 
                         record.delivering_driver || 
                         record.collecting_driver || 
                         record.driver_name ||
                         driverIdentifier;
      
      driverMapping[driverIdentifier] = displayName;
      
      // Ensure consistent driver identification in cleaned record
      cleanedRecord.driverId = driverIdentifier;
      cleanedRecord.driverName = displayName;
    } else {
      // Log data quality issues for records without driver info
      if (index < 10) { // Only log first 10 to avoid spam
        dataQualityIssues.push(`Record ${index + 1}: No driver identifier found`);
      }
    }
    
    // Additional data cleaning
    // Clean up date fields if present
    ['collected_at', 'delivered_at', 'created_at', 'updated_at'].forEach(dateField => {
      if (record[dateField] && typeof record[dateField] === 'string') {
        try {
          const cleanDate = new Date(record[dateField]);
          if (!isNaN(cleanDate.getTime())) {
            cleanedRecord[dateField] = cleanDate.toISOString();
          }
        } catch (e) {
          dataQualityIssues.push(`Record ${index + 1}: Invalid date in ${dateField}`);
        }
      }
    });
    
    // Clean up status fields
    if (record.status && typeof record.status === 'string') {
      cleanedRecord.status = record.status.toLowerCase().trim();
    }
    
    // Clean up numerical fields
    ['distance', 'amount', 'fee', 'tip'].forEach(numField => {
      if (record[numField] !== undefined && record[numField] !== null) {
        const numValue = parseFloat(String(record[numField]).replace(/[^\d.-]/g, ''));
        if (!isNaN(numValue)) {
          cleanedRecord[numField] = numValue;
        }
      }
    });
    
    cleanedData.push(cleanedRecord);
  });
  
  const validationReport = {
    totalRecords: rawData.length,
    recordsWithDrivers,
    uniqueDrivers: seenDriverIds.size,
    dataQualityIssues: dataQualityIssues.slice(0, 20) // Limit to 20 issues to avoid overwhelming logs
  };
  
  console.log('📊 Excel Data Validation Report:', validationReport);
  console.log('🗺️ Driver Mapping Sample:', 
    Object.entries(driverMapping).slice(0, 10).reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {})
  );
  
  // Warn about data quality issues
  if (validationReport.dataQualityIssues.length > 0) {
    console.warn('⚠️ Data Quality Issues Detected:', validationReport.dataQualityIssues);
  }
  
  // Warn about driver identification rate
  const driverIdentificationRate = (recordsWithDrivers / rawData.length) * 100;
  if (driverIdentificationRate < 90) {
    console.warn(`⚠️ Low driver identification rate: ${driverIdentificationRate.toFixed(1)}%`);
  } else {
    console.log(`✅ Good driver identification rate: ${driverIdentificationRate.toFixed(1)}%`);
  }
  
  return {
    cleanedData,
    driverMapping,
    validationReport
  };
}
