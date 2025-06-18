import * as XLSX from 'xlsx';
import type { DeliveryData } from '@/types/delivery';

// Helper function to find the closest matching key in an object
function findMatchingKey(obj: any, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    if (key in obj) return key;
    
    // Try case-insensitive match
    const lowerKey = key.toLowerCase();
    const objKeys = Object.keys(obj);
    const match = objKeys.find(k => k.toLowerCase() === lowerKey);
    if (match) return match;
  }
  return undefined;
}

// Helper function to convert various data types to appropriate formats
const dataConverters = {
  // Convert to number with handling for different formats
  toNumber: (value: any): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    // Handle values with currency symbols or commas
    const normalized = String(value).replace(/[$£€,]/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? undefined : num;
  },
  
  // Convert to boolean with flexible input handling
  toBoolean: (value: any): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;
    
    const strValue = String(value).toLowerCase();
    if (['true', 'yes', 'y'].includes(strValue)) return true;
    if (['false', 'no', 'n'].includes(strValue)) return false;
    
    return undefined;
  },
  
  // Enhanced date conversion with multiple format handling
  toDate: (value: any): string | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    
    // Handle Excel date numbers
    if (typeof value === 'number' && !isNaN(value)) {
      const date = XLSX.SSF.parse_date_code(value);
      const jsDate = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S));
      return jsDate.toISOString();
    }
    
    // Handle date strings with various formats
    if (typeof value === 'string') {
      // European format (DD/MM/YYYY)
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) {
        const [day, month, year] = value.split('/');
        // Check if it's a date with time
        const hasTime = value.includes(':');
        let dateStr = `${year.length === 2 ? '20' + year : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        if (hasTime) {
          const timePart = value.split(' ')[1];
          dateStr += `T${timePart}:00`;
        } else {
          dateStr += 'T00:00:00';
        }
        
        try {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) ? date.toISOString() : undefined;
        } catch {
          return undefined;
        }
      }
      
      // US format (MM/DD/YYYY)
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value) && !isNaN(Date.parse(value))) {
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date.toISOString() : undefined;
      }
    }
    
    // Handle other date strings
    try {
      const date = new Date(String(value));
      return !isNaN(date.getTime()) ? date.toISOString() : undefined;
    } catch {
      return undefined;
    }
  }
};

export async function parseDeliveryFile(file: File): Promise<DeliveryData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Failed to read file');
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // --- Enhanced Header Detection ---
        let jsonData = [];
        const headerKeywords = ['job id', 'status', 'driver', 'customer', 'address', 'pickup', 'delivery'];
        let headerRow = -1;
        
        // Convert the worksheet to an array of arrays to find the header row
        const sheetArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        for (let i = 0; i < Math.min(sheetArray.length, 10); i++) { // Check first 10 rows
          const row = sheetArray[i];
          const lowerCaseRow = row.map(cell => String(cell).toLowerCase());
          const matchCount = lowerCaseRow.filter(cell => headerKeywords.some(kw => cell.includes(kw))).length;
          
          // Consider it a header row if it contains at least 3 keywords
          if (matchCount >= 3) {
            headerRow = i;
            break;
          }
        }
        
        if (headerRow !== -1) {
          console.log(`✅ Header row detected at row ${headerRow + 1}. Skipping previous rows.`);
          // Re-parse the sheet from the detected header row
          jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRow });
        } else {
          console.warn('⚠️ Could not definitively detect header row. Parsing from the start.');
          jsonData = XLSX.utils.sheet_to_json(worksheet);
        }
        
        if (jsonData.length === 0) {
          throw new Error('No data found in the Excel file');
        }
        
        console.log(`📊 Excel file parsed: ${jsonData.length} rows found`);
        
        // For debugging - log the first row to see available columns
        console.log('Excel columns detected:', Object.keys(jsonData[0]));
        
        // Debug: Count unique drivers in raw data with improved logging and trimming
        const rawDrivers = new Set<string>();
        const driverValuesFound: string[] = [];
        
        jsonData.forEach((row: any) => {
          const possibleDriverKeys = [
            'Delivering Driver', 'delivering_driver', 'DeliveringDriver', 'Driver', 'Courier Name',
            'Collecting Driver', 'collecting_driver', 'CollectingDriver', 'Pickup Driver'
          ];
          
          possibleDriverKeys.forEach(key => {
            if (row[key] && typeof row[key] === 'string') {
              const driverName = row[key].trim();
              if (driverName) { // Ensure it's not an empty string after trimming
                rawDrivers.add(driverName);
                driverValuesFound.push(driverName);
              }
            }
          });
        });
        
        // Sort and log all found driver names for detailed inspection
        driverValuesFound.sort();
        console.log(`🚛 All driver name occurrences found in raw data (${driverValuesFound.length} total):`, driverValuesFound);
        console.log(`🚛 Raw Excel data contains ${rawDrivers.size} unique drivers (after trimming):`, Array.from(rawDrivers).sort());
        
        // Log which company name field was found (if any)
        const firstRow = jsonData[0];
        const companyFields = [
          'Company Name', 'company_name', 'CompanyName', 'Company', 'Business Name',
          'Restaurant Name', 'restaurant_name', 'RestaurantName', 'Restaurant',
          'Store Name', 'store_name', 'StoreName', 'Store',
          'Business', 'Merchant', 'merchant_name', 'MerchantName',
          'Client Company', 'client_company', 'ClientCompany',
          'Partner', 'partner_name', 'PartnerName',
          'Vendor', 'vendor_name', 'VendorName',
          'Establishment', 'establishment_name', 'EstablishmentName',
          'Nome da Empresa', 'Nome Empresa', 'Empresa', 'nome_empresa',
          'Nome do Restaurante', 'Nome Restaurante', 'Restaurante', 'nome_restaurante'
        ];
        
        const foundCompanyField = findMatchingKey(firstRow, companyFields);
        if (foundCompanyField) {
          console.log(`🏢 Company field found: "${foundCompanyField}" with sample value: "${firstRow[foundCompanyField]}"`);
        } else {
          console.log('⚠️ No company field found in XLSX. Available columns:', Object.keys(firstRow));
        }
        
          // Map Excel data to our DeliveryData structure with improved column matching
  const deliveries: DeliveryData[] = jsonData.map((row: any, index) => {
          // This function tries to find the best matching column
          const getValue = (possibleKeys: string[]) => {
            const key = findMatchingKey(row, possibleKeys);
            return key ? row[key] : undefined;
          };
          
          // Enhanced data extraction with flexible field mapping
          return {
            job_id: getValue(['Job ID', 'job_id', 'JobId', 'Job_ID', 'Job Number', 'Order Number']),
            invoice_id: getValue(['Invoice ID', 'invoice_id', 'InvoiceId', 'Invoice_ID']),
            invoice_number: getValue(['Invoice Number', 'invoice_number', 'InvoiceNumber', 'Invoice #', 'Invoice No']),
            priority: getValue(['Priority', 'priority', 'Urgent or Scheduled (Same-hour or Scheduled time)', 'Job Priority']),
            customer_name: getValue(['Customer Name', 'customer_name', 'CustomerName', 'Customer']),
            company_name: getValue([
              'Company Name', 'company_name', 'CompanyName', 'Company', 'Business Name',
              'Restaurant Name', 'restaurant_name', 'RestaurantName', 'Restaurant',
              'Store Name', 'store_name', 'StoreName', 'Store',
              'Business', 'Merchant', 'merchant_name', 'MerchantName',
              'Client Company', 'client_company', 'ClientCompany',
              'Partner', 'partner_name', 'PartnerName',
              'Vendor', 'vendor_name', 'VendorName',
              'Establishment', 'establishment_name', 'EstablishmentName',
              'Nome da Empresa', 'Nome Empresa', 'Empresa', 'nome_empresa',
              'Nome do Restaurante', 'Nome Restaurante', 'Restaurante', 'nome_restaurante'
            ]),
            collecting_driver: getValue(['Collecting Driver', 'collecting_driver', 'CollectingDriver', 'Pickup Driver']),
            delivering_driver: getValue(['Delivering Driver', 'delivering_driver', 'DeliveringDriver', 'Driver', 'Courier Name']),
            pickup_address: getValue(['Pickup', 'pickup_address', 'Pickup Address', 'PickupAddress', 'Collection Address']),
            delivery_address: getValue(['Delivery', 'delivery_address', 'Delivery Address', 'DeliveryAddress', 'Drop-off Address']),
            service_type: getValue(['Service Type', 'service_type', 'ServiceType', 'Service', 'Delivery Type']),
            cost: dataConverters.toNumber(getValue(['Cost', 'cost', 'Total Cost', 'Price', 'Charge', 'Fee', 'Amount'])),
            tip_amount: dataConverters.toNumber(getValue(['Tip Amount', 'tip_amount', 'TipAmount', 'Tip', 'Gratuity'])),
            courier_commission: dataConverters.toNumber(getValue(['Courier Commission', 'courier_commission', 'CourierCommission', 'Driver Commission'])),
            courier_commission_vat: dataConverters.toNumber(getValue(['Courier Commission VAT', 'courier_commission_vat', 'CourierCommissionVAT', 'VAT'])),
            status: getValue(['Status', 'status', 'Delivery Status', 'Job Status']),
            created_at: dataConverters.toDate(getValue(['Created Date/Time', 'created_at', 'CreatedDate', 'Created', 'CreateDate', 'Date Created'])),
            account_created_by: getValue(['Account Created By', 'account_created_by', 'AccountCreatedBy']),
            job_created_by: getValue(['Job Created By', 'job_created_by', 'JobCreatedBy', 'Created By']),
            customer_email: getValue(['Customer Email', 'customer_email', 'CustomerEmail', 'Email']),
            customer_mobile: getValue(['Customer Mobile', 'customer_mobile', 'CustomerMobile', 'Phone', 'Mobile']),
            distance: dataConverters.toNumber(getValue(['Distance', 'distance', 'Delivery Distance', 'Miles', 'Km'])),
            pickup_customer_name: getValue(['Pickup Customer Name', 'pickup_customer_name', 'PickupCustomerName', 'Sender Name']),
            pickup_mobile_number: getValue(['Pickup Mobile Number', 'pickup_mobile_number', 'PickupMobileNumber', 'Sender Phone']),
            collection_notes: getValue(['Collection Notes', 'collection_notes', 'CollectionNotes', 'Pickup Notes']),
            delivery_customer_name: getValue(['Delivery Customer Name', 'delivery_customer_name', 'DeliveryCustomerName', 'Recipient Name']),
            delivery_mobile_number: getValue(['Delivery Mobile Number', 'delivery_mobile_number', 'DeliveryMobileNumber', 'Recipient Phone']),
            delivery_notes: getValue(['Delivery Notes', 'delivery_notes', 'DeliveryNotes', 'Drop-off Notes']),
            recipient_email: getValue(['Recipient Email', 'recipient_email', 'RecipientEmail']),
            reference: getValue(['Reference', 'reference', 'Customer Reference', 'Order Ref']),
            submitted_at: dataConverters.toDate(getValue(['Submitted Date/Time', 'submitted_at', 'SubmittedDate', 'Date Submitted'])),
            accepted_at: dataConverters.toDate(getValue(['Accepted Date/Time', 'accepted_at', 'AcceptedDate', 'Date Accepted'])),
            collected_at: dataConverters.toDate(getValue(['Collected Date/Time', 'collected_at', 'CollectedDate', 'Pickup Time', 'Collection Time'])),
            delivered_at: dataConverters.toDate(getValue(['Delivered Date/Time', 'delivered_at', 'DeliveredDate', 'Delivery Time', 'Completion Time'])),
            canceled_at: dataConverters.toDate(getValue(['Canceled Date/Time', 'canceled_at', 'CanceledDate', 'Cancellation Time'])),
            driver_notes: getValue(['Driver Notes', 'driver_notes', 'DriverNotes', 'Courier Notes']),
            return_job: dataConverters.toBoolean(getValue(['Return Job', 'return_job', 'ReturnJob', 'Is Return', 'Return Delivery'])),
            payment_method: getValue(['Payment Method', 'payment_method', 'PaymentMethod', 'Payment Type']),
            collected_waiting_time: getValue(['Collected Waiting Time', 'collected_waiting_time', 'CollectedWaitingTime', 'Pickup Wait Time']),
            delivered_waiting_time: getValue(['Delivered Waiting Time', 'delivered_waiting_time', 'DeliveredWaitingTime', 'Delivery Wait Time']),
            return_job_delivered_waiting_time: getValue(['Return Job delivered Waiting Time', 'return_job_delivered_waiting_time', 'ReturnJobDeliveredWaitingTime']),
            fuel_surcharge: dataConverters.toNumber(getValue(['Fuel Surcharge', 'fuel_surcharge', 'FuelSurcharge', 'Fuel Fee'])),
            insurance_protection: getValue(['You have free protection on your items for up to €50. Would you like to protect your items for the full value of up to €10,000? If yes, how much would you like to protect?', 'insurance_protection', 'InsuranceProtection', 'Insurance', 'Protection Value']),
            rider_tips: dataConverters.toNumber(getValue(['Rider Tips', 'rider_tips', 'RiderTips', 'Driver Tips'])),
            package_value: getValue(['How much is your package?', 'Package Value', 'package_value', 'PackageValue', '"How much is your package?\nOptional - Insurance up to €1.000"', 'Item Value']),
            passenger_count: dataConverters.toNumber(getValue(['How many passengers?', 'passenger_count', 'PassengerCount', 'Number of Passengers', 'Passengers'])),
            luggage_count: dataConverters.toNumber(getValue(['How Many Lugagges?', 'luggage_count', 'LuggageCount', 'Number of Bags', 'Luggage Items'])),
          };
        });
        
        // Process and enhance the data with additional analysis
        const processedDeliveries = enhanceDeliveryData(deliveries);
        
        console.log(`✅ Processed ${processedDeliveries.length} deliveries from Excel`);
        
        // Final verification of unique drivers in processed data
        const processedDrivers = new Set<string>();
        processedDeliveries.forEach(delivery => {
          if (delivery.delivering_driver) processedDrivers.add(delivery.delivering_driver);
          if (delivery.collecting_driver) processedDrivers.add(delivery.collecting_driver);
        });
        
        console.log(`🚛 Processed data contains ${processedDrivers.size} unique drivers:`, Array.from(processedDrivers).sort());
        
        resolve(processedDeliveries);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(error instanceof Error ? error : new Error('Unknown error parsing file'));
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsBinaryString(file);
  });
}

// Function to enhance delivery data with additional insights
function enhanceDeliveryData(deliveries: DeliveryData[]): DeliveryData[] {
  if (deliveries.length === 0) return deliveries;
  
  // Calculate additional metrics for the dataset
  calculateDatasetMetrics(deliveries);
  
  return deliveries.map(delivery => {
    // Data quality checks and enhancement
    const enhanced: DeliveryData = { ...delivery };
    
    // Add missing delivery status if possible
    if (!enhanced.status) {
      if (enhanced.delivered_at) enhanced.status = 'delivered';
      else if (enhanced.canceled_at) enhanced.status = 'canceled';
      else if (enhanced.collected_at) enhanced.status = 'in_transit';
      else if (enhanced.accepted_at) enhanced.status = 'accepted';
      else enhanced.status = 'pending';
    }
    
    // Normalize service type values
    if (enhanced.service_type) {
      enhanced.service_type = normalizeServiceType(enhanced.service_type);
    }
    
    // Clean up address fields
    if (enhanced.delivery_address) {
      enhanced.delivery_address = cleanupAddress(enhanced.delivery_address);
    }
    
    if (enhanced.pickup_address) {
      enhanced.pickup_address = cleanupAddress(enhanced.pickup_address);
    }
    
    return enhanced;
  });
}

// Function to normalize service type values
function normalizeServiceType(serviceType: string): string {
  const lowerType = serviceType.toLowerCase();
  
  // Map common variations to standard values
  if (/express|urgent|rush|same.?day|priority/i.test(lowerType)) return 'Express';
  if (/standard|regular|normal/i.test(lowerType)) return 'Standard';
  if (/economy|basic/i.test(lowerType)) return 'Economy';
  if (/scheduled|planned|advance/i.test(lowerType)) return 'Scheduled';
  if (/overnight|next.?day/i.test(lowerType)) return 'Overnight';
  
  // If no match, capitalize first letter
  return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
}

// Function to clean up address fields
function cleanupAddress(address: string): string {
  // Remove excessive whitespace
  let cleaned = address.replace(/\s+/g, ' ').trim();
  
  // Fix common address abbreviations
  cleaned = cleaned.replace(/(\d+)\s*,\s*([A-Za-z])/g, '$1 $2');
  cleaned = cleaned.replace(/\bSt\b/g, 'Street');
  cleaned = cleaned.replace(/\bRd\b/g, 'Road');
  cleaned = cleaned.replace(/\bAve\b/g, 'Avenue');
  
  return cleaned;
}

// Calculate overall metrics for the dataset
function calculateDatasetMetrics(deliveries: DeliveryData[]): void {
  // Only perform calculations if we have enough data
  if (deliveries.length < 2) return;
  
  // Calculate time-based metrics if dates are available
  const deliveredItems = deliveries.filter(d => d.delivered_at && d.collected_at);
  if (deliveredItems.length > 0) {
    // Calculate average delivery times
    const deliveryTimes = deliveredItems.map(d => {
      const collectedTime = d.collected_at ? new Date(d.collected_at).getTime() : 0;
      const deliveredTime = d.delivered_at ? new Date(d.delivered_at).getTime() : 0;
      return (deliveredTime - collectedTime) / (1000 * 60); // minutes
    }).filter(time => time > 0);
    
    if (deliveryTimes.length > 0) {
      const avgDeliveryTime = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
      console.log(`Average delivery time: ${Math.round(avgDeliveryTime)} minutes`);
    }
  }
  
  // Calculate cost metrics
  const itemsWithCost = deliveries.filter(d => d.cost !== undefined && d.cost !== null);
  if (itemsWithCost.length > 0) {
    const costs = itemsWithCost.map(d => d.cost as number);
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const avgCost = totalCost / costs.length;
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    
    console.log(`Cost metrics - Total: $${totalCost.toFixed(2)}, Average: $${avgCost.toFixed(2)}, Range: $${minCost.toFixed(2)} - $${maxCost.toFixed(2)}`);
  }
  
  // Calculate status distribution
  const statusCounts: Record<string, number> = {};
  deliveries.forEach(d => {
    const status = d.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  
  console.log('Status distribution:', statusCounts);
  
  // Driver performance metrics
  const driverDeliveries: Record<string, { count: number, completed: number }> = {};
  deliveries.forEach(d => {
    if (d.delivering_driver) {
      if (!driverDeliveries[d.delivering_driver]) {
        driverDeliveries[d.delivering_driver] = { count: 0, completed: 0 };
      }
      
      driverDeliveries[d.delivering_driver].count++;
      if (d.status === 'delivered') {
        driverDeliveries[d.delivering_driver].completed++;
      }
    }
  });
  
  // Log driver metrics for top drivers
  const topDrivers = Object.entries(driverDeliveries)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
  
  console.log('Top drivers performance:', topDrivers.map(([name, stats]) => ({
    name,
    deliveries: stats.count,
    completionRate: `${Math.round(stats.completed / stats.count * 100)}%`
  })));
}
