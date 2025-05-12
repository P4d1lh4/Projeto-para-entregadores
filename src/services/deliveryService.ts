
import { supabase } from "@/integrations/supabase/client";
import type { FoxDelivery, GeocodeResult } from "@/types/delivery";
import { geocodeAddress, batchGeocodeAddresses } from "./geocodingService";

export const uploadDeliveryData = async (deliveries: FoxDelivery[]): Promise<{ success: boolean; error?: string; count?: number }> => {
  try {
    // Insert data in batches of 50 to avoid hitting request size limits
    const batchSize = 50;
    let uploadedCount = 0;
    
    for (let i = 0; i < deliveries.length; i += batchSize) {
      const batch = deliveries.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('fox_deliveries')
        .insert(batch);
      
      if (error) {
        console.error('Error uploading batch:', error);
        return { 
          success: false, 
          error: `Error uploading batch ${Math.floor(i / batchSize) + 1}: ${error.message}` 
        };
      }
      
      uploadedCount += batch.length;
    }
    
    return { 
      success: true,
      count: uploadedCount 
    };
  } catch (error) {
    console.error('Error in uploadDeliveryData:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

export const fetchDeliveryData = async (): Promise<{ data: FoxDelivery[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('fox_deliveries')
      .select('*')
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
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
): Promise<{ data: FoxDelivery[] | null; error: string | null }> => {
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
    
    // Extract unique pickup and delivery addresses
    const pickupAddresses = data
      .map(item => item.pickup_address)
      .filter((address): address is string => !!address);
    
    const deliveryAddresses = data
      .map(item => item.delivery_address)
      .filter((address): address is string => !!address);
    
    const uniqueAddresses = [...new Set([...pickupAddresses, ...deliveryAddresses])];
    
    // Batch geocode all addresses
    const geocodeResults = await batchGeocodeAddresses(uniqueAddresses);
    
    // Enrich delivery data with coordinates
    const enrichedData = data.map(delivery => {
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
