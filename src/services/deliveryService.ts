
import { supabase } from "@/integrations/supabase/client";
import type { FoxDelivery } from "@/types/delivery";

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
