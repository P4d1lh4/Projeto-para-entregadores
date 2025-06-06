import { supabase } from "@/integrations/supabase/client";
import Papa from 'papaparse';

interface ProcessingStats {
  totalRows: number;
  processedDeliveries: number;
  insertedDeliveries: number;
  uniqueJobIds: number;
  validationErrors: number;
  insertErrors: number;
}

interface ProcessingResult {
  success: boolean;
  message: string;
  stats?: ProcessingStats;
  errors?: string[];
}

export class CSVProcessingService {
  
  /**
   * Parse CSV file and extract data
   */
  static async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalize headers to match our expected format
          return header.toLowerCase()
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^\w_]/g, '');
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data as any[]);
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  /**
   * Process CSV data through Supabase Edge Function
   */
  static async processCSVData(csvData: any[], filename: string): Promise<ProcessingResult> {
    try {
      console.log(`🚀 Processing ${csvData.length} rows through Edge Function...`);

      const { data, error } = await supabase.functions.invoke('process-csv', {
        body: {
          csvData,
          filename
        }
      });

      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }

      return data as ProcessingResult;
    } catch (error) {
      console.error('CSV processing failed:', error);
      return {
        success: false,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Complete workflow: Parse file and process data
   */
  static async uploadAndProcessCSV(file: File): Promise<ProcessingResult> {
    try {
      // Validate file
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return {
          success: false,
          message: 'Please upload a CSV file'
        };
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return {
          success: false,
          message: 'File too large. Please upload a file smaller than 50MB'
        };
      }

      // Parse CSV
      console.log('📊 Parsing CSV file...');
      const csvData = await this.parseCSVFile(file);

      if (csvData.length === 0) {
        return {
          success: false,
          message: 'CSV file is empty or contains no valid data'
        };
      }

      // Process through Edge Function
      return await this.processCSVData(csvData, file.name);

    } catch (error) {
      console.error('Upload and processing failed:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get processing status and statistics
   */
  static async getProcessingStats(): Promise<{
    totalDeliveries: number;
    uniqueJobIds: number;
    lastUpload?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('fox_deliveries')
        .select('job_id, uploaded_at')
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw error;
      }

      const uniqueJobIds = new Set(data?.filter(d => d.job_id).map(d => d.job_id)).size;
      const lastUpload = data?.[0]?.uploaded_at;

      return {
        totalDeliveries: data?.length || 0,
        uniqueJobIds,
        lastUpload
      };
    } catch (error) {
      console.error('Failed to get processing stats:', error);
      return {
        totalDeliveries: 0,
        uniqueJobIds: 0
      };
    }
  }

  /**
   * Fetch delivery data from Supabase
   */
  static async getDeliveryData(limit?: number) {
    try {
      let query = supabase
        .from('fox_deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch delivery data:', error);
      return [];
    }
  }

  /**
   * Calculate driver metrics from Supabase data
   */
  static async getDriverMetrics() {
    try {
      const { data, error } = await supabase
        .from('fox_deliveries')
        .select('job_id, collecting_driver, delivering_driver, status, collected_at, delivered_at')
        .not('job_id', 'is', null);

      if (error) {
        throw error;
      }

      // Count unique job_ids (our driver count)
      const uniqueJobIds = new Set(data?.map(d => d.job_id)).size;

      // Group by actual driver names for individual metrics
      const driverStats = new Map();
      
      data?.forEach(delivery => {
        const driverName = delivery.delivering_driver || delivery.collecting_driver;
        if (!driverName) return;

        if (!driverStats.has(driverName)) {
          driverStats.set(driverName, {
            name: driverName,
            totalJobs: 0,
            completedJobs: 0,
            averageTime: 0
          });
        }

        const stats = driverStats.get(driverName);
        stats.totalJobs++;

        if (delivery.status === 'delivered') {
          stats.completedJobs++;
        }

        // Calculate delivery time if available
        if (delivery.collected_at && delivery.delivered_at) {
          const collectedTime = new Date(delivery.collected_at);
          const deliveredTime = new Date(delivery.delivered_at);
          const timeInMinutes = (deliveredTime.getTime() - collectedTime.getTime()) / (1000 * 60);
          
          if (timeInMinutes > 0 && timeInMinutes < 480) { // Reasonable time range
            stats.averageTime = (stats.averageTime + timeInMinutes) / 2;
          }
        }
      });

      return {
        totalActiveDrivers: uniqueJobIds,
        driverDetails: Array.from(driverStats.values()).map(driver => ({
          ...driver,
          successRate: driver.totalJobs > 0 ? driver.completedJobs / driver.totalJobs : 0,
          averageTime: Math.round(driver.averageTime)
        }))
      };
    } catch (error) {
      console.error('Failed to get driver metrics:', error);
      return {
        totalActiveDrivers: 0,
        driverDetails: []
      };
    }
  }
} 