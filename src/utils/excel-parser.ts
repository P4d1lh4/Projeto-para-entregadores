
import * as XLSX from 'xlsx';
import type { FoxDelivery } from '@/types/delivery';

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
        
        // Map Excel data to our FoxDelivery structure
        const deliveries: FoxDelivery[] = jsonData.map((row: any) => {
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
            
            // Handle date strings
            try {
              const date = new Date(String(value));
              return !isNaN(date.getTime()) ? date.toISOString() : undefined;
            } catch {
              return undefined;
            }
          };
          
          // Map from the Excel column names to our field names
          // Note: We handle various possible column name formats
          return {
            job_id: row['Job ID'] || row['job_id'] || row['JobId'],
            invoice_id: row['Invoice ID'] || row['invoice_id'],
            invoice_number: row['Invoice Number'] || row['invoice_number'],
            priority: row['Priority'] || row['priority'],
            customer_name: row['Customer Name'] || row['customer_name'],
            company_name: row['Company Name'] || row['company_name'],
            collecting_driver: row['Collecting Driver'] || row['collecting_driver'],
            delivering_driver: row['Delivering Driver'] || row['delivering_driver'],
            pickup_address: row['Pickup'] || row['pickup_address'] || row['Pickup Address'],
            delivery_address: row['Delivery'] || row['delivery_address'] || row['Delivery Address'],
            service_type: row['Service Type'] || row['service_type'],
            cost: convertToNumber(row['Cost'] || row['cost']),
            tip_amount: convertToNumber(row['Tip Amount'] || row['tip_amount']),
            courier_commission: convertToNumber(row['Courier Commission'] || row['courier_commission']),
            courier_commission_vat: convertToNumber(row['Courier Commission VAT'] || row['courier_commission_vat']),
            status: row['Status'] || row['status'],
            created_at: convertToDate(row['Created Date/Time'] || row['created_at']),
            account_created_by: row['Account Created By'] || row['account_created_by'],
            job_created_by: row['Job Created By'] || row['job_created_by'],
            customer_email: row['Customer Email'] || row['customer_email'],
            customer_mobile: row['Customer Mobile'] || row['customer_mobile'],
            distance: convertToNumber(row['Distance'] || row['distance']),
            pickup_customer_name: row['Pickup Customer Name'] || row['pickup_customer_name'],
            pickup_mobile_number: row['Pickup Mobile Number'] || row['pickup_mobile_number'],
            collection_notes: row['Collection Notes'] || row['collection_notes'],
            delivery_customer_name: row['Delivery Customer Name'] || row['delivery_customer_name'],
            delivery_mobile_number: row['Delivery Mobile Number'] || row['delivery_mobile_number'],
            delivery_notes: row['Delivery Notes'] || row['delivery_notes'],
            recipient_email: row['Recipient Email'] || row['recipient_email'],
            reference: row['Reference'] || row['reference'],
            submitted_at: convertToDate(row['Submitted Date/Time'] || row['submitted_at']),
            accepted_at: convertToDate(row['Accepted Date/Time'] || row['accepted_at']),
            collected_at: convertToDate(row['Collected Date/Time'] || row['collected_at']),
            delivered_at: convertToDate(row['Delivered Date/Time'] || row['delivered_at']),
            canceled_at: convertToDate(row['Canceled Date/Time'] || row['canceled_at']),
            driver_notes: row['Driver Notes'] || row['driver_notes'],
            return_job: convertToBoolean(row['Return Job'] || row['return_job']),
            payment_method: row['Payment Method'] || row['payment_method'],
            collected_waiting_time: row['Collected Waiting Time'] || row['collected_waiting_time'],
            delivered_waiting_time: row['Delivered Waiting Time'] || row['delivered_waiting_time'],
            return_job_delivered_waiting_time: row['Return Job delivered Waiting Time'] || row['return_job_delivered_waiting_time'],
            fuel_surcharge: convertToNumber(row['Fuel Surcharge'] || row['fuel_surcharge']),
            insurance_protection: row['You have free protection on your items for up to €50. Would you like to protect your items for the full value of up to €10,000? If yes, how much would you like to protect?'] || row['insurance_protection'],
            rider_tips: convertToNumber(row['Rider Tips'] || row['rider_tips']),
            package_value: row['How much is your package?'] || row['Package Value'] || row['package_value'],
            passenger_count: convertToNumber(row['How many passengers?'] || row['passenger_count']),
            luggage_count: convertToNumber(row['How Many Lugagges?'] || row['luggage_count'])
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
