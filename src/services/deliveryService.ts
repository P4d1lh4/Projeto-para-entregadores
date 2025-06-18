import { supabase } from "@/integrations/supabase/client";
import type { DeliveryData, GeocodeResult } from "@/types/delivery";
import { geocodeAddress, batchGeocodeAddresses } from "./geocodingService";

export const uploadDeliveryData = async (deliveries: DeliveryData[]): Promise<{ success: boolean; error?: string; count?: number }> => {
  try {
    console.log('🚀 Starting upload to Supabase...');
    console.log(`📊 Uploading ${deliveries.length} deliveries`);
    
    // Log first delivery for debugging
    if (deliveries.length > 0) {
      console.log('🔍 Sample delivery data:', {
        id: deliveries[0].id,
        job_id: deliveries[0].job_id,
        collecting_driver: deliveries[0].collecting_driver,
        delivering_driver: deliveries[0].delivering_driver,
        status: deliveries[0].status,
        customer_name: deliveries[0].customer_name
      });
    }
    
    // Insert data in batches of 50 to avoid hitting request size limits
    const batchSize = 50;
    let uploadedCount = 0;
    
    for (let i = 0; i < deliveries.length; i += batchSize) {
      const batch = deliveries.slice(i, i + batchSize);
      console.log(`📦 Uploading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(deliveries.length / batchSize)} (${batch.length} records)`);
      
      const { error, data } = await supabase
        .from('fox_deliveries')
        .insert(batch)
        .select();
      
      if (error) {
        console.error('❌ Error uploading batch:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return { 
          success: false, 
          error: `Error uploading batch ${Math.floor(i / batchSize) + 1}: ${error.message}` 
        };
      }
      
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} uploaded successfully (${data?.length || batch.length} records)`);
      uploadedCount += batch.length;
    }
    
    console.log(`🎉 Upload completed! Total records uploaded: ${uploadedCount}`);
    return { 
      success: true,
      count: uploadedCount 
    };
  } catch (error) {
    console.error('💥 Unexpected error in uploadDeliveryData:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const fetchDeliveryData = async (): Promise<{ data: DeliveryData[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('fox_deliveries')
      .select('*')
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    
    return { data: data as DeliveryData[], error: null };
  } catch (error) {
    console.error('Error fetching delivery data:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const fetchDeliveryDataWithRoutes = async (
  filters?: {
    driverId?: string,
    customerId?: string,
    dateFrom?: Date,
    dateTo?: Date,
    status?: string
  }
): Promise<{ data: DeliveryData[] | null; error: string | null }> => {
  try {
    let query = supabase
      .from('fox_deliveries')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (filters) {
      if (filters.driverId) {
        query = query.or(`collecting_driver.eq.${filters.driverId},delivering_driver.eq.${filters.driverId}`);
      }
      
      if (filters.customerId) {
        query = query.eq('customer_name', filters.customerId);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }
    
    // Cast data to DeliveryData type to ensure TypeScript knows about the coordinate fields
    const deliveryRecords = data as DeliveryData[];
    
    // Extract unique pickup and delivery addresses
    const pickupAddresses = deliveryRecords
      .map(item => item.pickup_address)
      .filter((address): address is string => !!address);
    
    const deliveryAddresses = deliveryRecords
      .map(item => item.delivery_address)
      .filter((address): address is string => !!address);
    
    const uniqueAddresses = [...new Set([...pickupAddresses, ...deliveryAddresses])];
    
    // Batch geocode all addresses
    const geocodeResults = await batchGeocodeAddresses(uniqueAddresses);
    
    // Enrich delivery data with coordinates
    const enrichedData = deliveryRecords.map(delivery => {
      const enriched = { ...delivery };
      
      if (delivery.pickup_address && geocodeResults[delivery.pickup_address]) {
        const result = geocodeResults[delivery.pickup_address];
        if (result) {
          enriched.pickup_lat = result.lat;
          enriched.pickup_lng = result.lng;
        }
      }
      
      if (delivery.delivery_address && geocodeResults[delivery.delivery_address]) {
        const result = geocodeResults[delivery.delivery_address];
        if (result) {
          enriched.delivery_lat = result.lat;
          enriched.delivery_lng = result.lng;
        }
      }
      
      return enriched;
    });
    
    return { data: enrichedData, error: null };
  } catch (error) {
    console.error('Error fetching delivery routes:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
