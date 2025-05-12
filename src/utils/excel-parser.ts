
import * as XLSX from 'xlsx';
import type { FoxDelivery } from '@/types/delivery';

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

export async function parseFoxDeliveryFile(file: File): Promise<FoxDelivery[]> {
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
        
        // Parse all rows to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          throw new Error('No data found in the Excel file');
        }
        
        // For debugging - log the first row to see available columns
        console.log('Excel columns detected:', Object.keys(jsonData[0]));
        
        // Map Excel data to our FoxDelivery structure with improved column matching
        const deliveries: FoxDelivery[] = jsonData.map((row: any, index) => {
          // Attempt to convert string values to appropriate types
          const convertToNumber = (value: any) => {
            if (value === undefined || value === null || value === '') return undefined;
            const num = parseFloat(String(value).replace(/,/g, ''));
            return isNaN(num) ? undefined : num;
          };
          
          const convertToBoolean = (value: any) => {
            if (value === undefined || value === null || value === '') return undefined;
            return value === 1 || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'yes';
          };
          
          const convertToDate = (value: any) => {
            if (value === undefined || value === null || value === '') return undefined;
            
            // Handle Excel date numbers
            if (typeof value === 'number' && !isNaN(value)) {
              const date = XLSX.SSF.parse_date_code(value);
              const jsDate = new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S));
              return jsDate.toISOString();
            }
            
            // Handle date strings with European format (DD/MM/YYYY)
            if (typeof value === 'string' && value.includes('/')) {
              const [day, month, year] = value.split('/');
              // Check if it's a date with time
              const hasTime = value.includes(':');
              let dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              
              if (hasTime) {
                const timePart = value.split(' ')[1];
                dateStr += `T${timePart}:00`;
              }
              
              try {
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString() : undefined;
              } catch {
                return undefined;
              }
            }
            
            // Handle other date strings
            try {
              const date = new Date(String(value));
              return !isNaN(date.getTime()) ? date.toISOString() : undefined;
            } catch {
              return undefined;
            }
          };
          
          // Improved field mapping with multiple potential column names
          // First row from example: job_id, invoice_id, invoice_number, priority, customer_name, etc.
          
          // This function tries to find the best matching column
          const getValue = (possibleKeys: string[]) => {
            const key = findMatchingKey(row, possibleKeys);
            return key ? row[key] : undefined;
          };
          
          return {
            job_id: getValue(['Job ID', 'job_id', 'JobId', 'Job_ID']),
            invoice_id: getValue(['Invoice ID', 'invoice_id', 'InvoiceId', 'Invoice_ID']),
            invoice_number: getValue(['Invoice Number', 'invoice_number', 'InvoiceNumber']),
            priority: getValue(['Priority', 'priority', 'Urgent or Scheduled (Same-hour or Scheduled time)']),
            customer_name: getValue(['Customer Name', 'customer_name', 'CustomerName', 'Customer']),
            company_name: getValue(['Company Name', 'company_name', 'CompanyName']),
            collecting_driver: getValue(['Collecting Driver', 'collecting_driver', 'CollectingDriver']),
            delivering_driver: getValue(['Delivering Driver', 'delivering_driver', 'DeliveringDriver', 'Driver']),
            pickup_address: getValue(['Pickup', 'pickup_address', 'Pickup Address', 'PickupAddress']),
            delivery_address: getValue(['Delivery', 'delivery_address', 'Delivery Address', 'DeliveryAddress']),
            service_type: getValue(['Service Type', 'service_type', 'ServiceType']),
            cost: convertToNumber(getValue(['Cost', 'cost'])),
            tip_amount: convertToNumber(getValue(['Tip Amount', 'tip_amount', 'TipAmount'])),
            courier_commission: convertToNumber(getValue(['Courier Commission', 'courier_commission', 'CourierCommission'])),
            courier_commission_vat: convertToNumber(getValue(['Courier Commission VAT', 'courier_commission_vat', 'CourierCommissionVAT'])),
            status: getValue(['Status', 'status']),
            created_at: convertToDate(getValue(['Created Date/Time', 'created_at', 'CreatedDate', 'Created', 'CreateDate'])),
            account_created_by: getValue(['Account Created By', 'account_created_by', 'AccountCreatedBy']),
            job_created_by: getValue(['Job Created By', 'job_created_by', 'JobCreatedBy']),
            customer_email: getValue(['Customer Email', 'customer_email', 'CustomerEmail']),
            customer_mobile: getValue(['Customer Mobile', 'customer_mobile', 'CustomerMobile']),
            distance: convertToNumber(getValue(['Distance', 'distance'])),
            pickup_customer_name: getValue(['Pickup Customer Name', 'pickup_customer_name', 'PickupCustomerName']),
            pickup_mobile_number: getValue(['Pickup Mobile Number', 'pickup_mobile_number', 'PickupMobileNumber']),
            collection_notes: getValue(['Collection Notes', 'collection_notes', 'CollectionNotes']),
            delivery_customer_name: getValue(['Delivery Customer Name', 'delivery_customer_name', 'DeliveryCustomerName']),
            delivery_mobile_number: getValue(['Delivery Mobile Number', 'delivery_mobile_number', 'DeliveryMobileNumber']),
            delivery_notes: getValue(['Delivery Notes', 'delivery_notes', 'DeliveryNotes']),
            recipient_email: getValue(['Recipient Email', 'recipient_email', 'RecipientEmail']),
            reference: getValue(['Reference', 'reference']),
            submitted_at: convertToDate(getValue(['Submitted Date/Time', 'submitted_at', 'SubmittedDate'])),
            accepted_at: convertToDate(getValue(['Accepted Date/Time', 'accepted_at', 'AcceptedDate'])),
            collected_at: convertToDate(getValue(['Collected Date/Time', 'collected_at', 'CollectedDate'])),
            delivered_at: convertToDate(getValue(['Delivered Date/Time', 'delivered_at', 'DeliveredDate'])),
            canceled_at: convertToDate(getValue(['Canceled Date/Time', 'canceled_at', 'CanceledDate'])),
            driver_notes: getValue(['Driver Notes', 'driver_notes', 'DriverNotes']),
            return_job: convertToBoolean(getValue(['Return Job', 'return_job', 'ReturnJob'])),
            payment_method: getValue(['Payment Method', 'payment_method', 'PaymentMethod']),
            collected_waiting_time: getValue(['Collected Waiting Time', 'collected_waiting_time', 'CollectedWaitingTime']),
            delivered_waiting_time: getValue(['Delivered Waiting Time', 'delivered_waiting_time', 'DeliveredWaitingTime']),
            return_job_delivered_waiting_time: getValue(['Return Job delivered Waiting Time', 'return_job_delivered_waiting_time', 'ReturnJobDeliveredWaitingTime']),
            fuel_surcharge: convertToNumber(getValue(['Fuel Surcharge', 'fuel_surcharge', 'FuelSurcharge'])),
            insurance_protection: getValue(['You have free protection on your items for up to €50. Would you like to protect your items for the full value of up to €10,000? If yes, how much would you like to protect?', 'insurance_protection', 'InsuranceProtection']),
            rider_tips: convertToNumber(getValue(['Rider Tips', 'rider_tips', 'RiderTips'])),
            package_value: getValue(['How much is your package?', 'Package Value', 'package_value', 'PackageValue', '"How much is your package?\nOptional - Insurance up to €1.000"']),
            passenger_count: convertToNumber(getValue(['How many passengers?', 'passenger_count', 'PassengerCount'])),
            luggage_count: convertToNumber(getValue(['How Many Lugagges?', 'luggage_count', 'LuggageCount'])),
          };
        });
        
        resolve(deliveries);
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
