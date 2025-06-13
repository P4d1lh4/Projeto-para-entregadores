import { generateMockDeliveryData, calculateDriverMetrics, calculateCustomerMetrics, calculateCompanyMetrics } from '@/lib/file-utils';
import { uploadDeliveryData } from '@/services/deliveryService';
import { StorageUtils } from '@/utils/storageUtils';
import type { DeliveryData, DriverData, CustomerData } from '../types';
import type { FoxDelivery } from '@/types/delivery';

// Configuration for data source
const USE_MOCK_DATA = false; // Temporarily enable to test filters

export interface DataServiceResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

class DataService {
  private static instance: DataService;
  private deliveryData: DeliveryData[] = [];
  private driverData: DriverData[] = [];
  private customerData: CustomerData[] = [];
  private foxDeliveryData: FoxDelivery[] = []; // Store original XLSX data
  private isInitialized = false;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async initializeData(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (USE_MOCK_DATA) {
        // First try to load from storage
        const storedDeliveryData = StorageUtils.getLargeItem('foxDeliveryData');
        const storedDriverData = StorageUtils.getLargeItem('foxDriverData');
        const storedCustomerData = StorageUtils.getLargeItem('foxCustomerData');
        
        if (storedDeliveryData && storedDriverData && storedCustomerData) {
          console.log('📥 Loading existing data from storage...');
          try {
            // Data is already parsed by StorageUtils
            this.deliveryData = storedDeliveryData;
            this.driverData = storedDriverData;
            this.customerData = storedCustomerData;
            console.log('✅ Loaded from storage:', this.deliveryData.length, 'deliveries,', this.driverData.length, 'drivers,', this.customerData.length, 'customers');
          } catch (error) {
            console.warn('⚠️ Error loading stored data, generating new mock data...');
            this.generateAndStoreNewMockData();
          }
        } else {
          console.log('🆕 No complete stored data found, generating new mock data...');
          this.generateAndStoreNewMockData();
        }
      } else {
        // Load data from uploaded files or other sources
        await this.loadFromLocalStorage();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing data:', error);
      throw error;
    }
  }

  private generateAndStoreNewMockData(): void {
    console.log('🎲 Generating new mock data with improved status distribution...');
    // Generate new mock data
    this.deliveryData = generateMockDeliveryData(50);
    this.driverData = calculateDriverMetrics(this.deliveryData);
    this.customerData = calculateCustomerMetrics(this.deliveryData);
    
    // Store all data using optimized storage
    const deliveryStored = StorageUtils.setLargeItem('foxDeliveryData', this.deliveryData);
    const driverStored = StorageUtils.setLargeItem('foxDriverData', this.driverData);
    const customerStored = StorageUtils.setLargeItem('foxCustomerData', this.customerData);
    
    if (!deliveryStored || !driverStored || !customerStored) {
      console.warn('⚠️ Some data could not be stored due to size constraints');
    }
    
    // Log the new success rate
    const successRate = this.deliveryData.filter(d => d.status === 'delivered').length / this.deliveryData.length * 100;
    console.log('💾 Generated and stored', this.deliveryData.length, 'deliveries,', this.driverData.length, 'drivers,', this.customerData.length, 'customers');
    console.log('📊 New success rate:', Math.round(successRate) + '%');
  }

  private async loadFromLocalStorage(): Promise<void> {
    try {
      const storedDeliveryData = StorageUtils.getLargeItem('foxDeliveryData');
      const storedDriverData = StorageUtils.getLargeItem('foxDriverData');
      const storedCustomerData = StorageUtils.getLargeItem('foxCustomerData');
      const storedOriginalData = StorageUtils.getLargeItem('foxOriginalData');
      
      if (storedDeliveryData) {
        try {
          // Data is already parsed by StorageUtils
          if (Array.isArray(storedDeliveryData)) {
            this.deliveryData = storedDeliveryData;
          } else {
            console.warn('⚠️ Invalid delivery data format in localStorage, starting with empty array');
            this.deliveryData = [];
          }
          
          // Check if we have original XLSX data with company information
          if (storedOriginalData) {
            try {
              // Data is already parsed by StorageUtils
              if (Array.isArray(storedOriginalData)) {
                this.foxDeliveryData = storedOriginalData;
                console.log('📊 Found original XLSX data with company information');
                
                // Recalculate company metrics from original data if needed
                if (storedCustomerData) {
                  // Data is already parsed by StorageUtils
                  if (Array.isArray(storedCustomerData)) {
                    this.customerData = storedCustomerData;
                  } else {
                    console.log('🏢 Recalculating company metrics from XLSX data...');
                    this.customerData = calculateCompanyMetrics(this.foxDeliveryData);
                    StorageUtils.setLargeItem('foxCustomerData', this.customerData);
                  }
                } else {
                  console.log('🏢 Recalculating company metrics from XLSX data...');
                  this.customerData = calculateCompanyMetrics(this.foxDeliveryData);
                  StorageUtils.setLargeItem('foxCustomerData', this.customerData);
                }
              } else {
                console.warn('⚠️ Invalid original data format in localStorage');
                this.foxDeliveryData = [];
                this.customerData = calculateCustomerMetrics(this.deliveryData);
              }
            } catch (error) {
              console.warn('⚠️ Error parsing original XLSX data, falling back to regular processing');
              this.foxDeliveryData = [];
              this.customerData = calculateCustomerMetrics(this.deliveryData);
            }
          } else {
            // No original XLSX data, use regular customer calculation
            this.customerData = calculateCustomerMetrics(this.deliveryData);
          }
          
          // Try to load calculated driver data first, fallback to recalculation
          if (storedDriverData) {
            try {
              // Data is already parsed by StorageUtils
              if (Array.isArray(storedDriverData)) {
                this.driverData = storedDriverData;
              } else {
                this.driverData = calculateDriverMetrics(this.deliveryData);
                StorageUtils.setLargeItem('foxDriverData', this.driverData);
              }
            } catch (error) {
              console.warn('⚠️ Error parsing driver data, recalculating...');
              this.driverData = calculateDriverMetrics(this.deliveryData);
              StorageUtils.setLargeItem('foxDriverData', this.driverData);
            }
          } else {
            this.driverData = calculateDriverMetrics(this.deliveryData);
            StorageUtils.setLargeItem('foxDriverData', this.driverData);
          }
          
          console.log('📥 Loaded data from localStorage');
          console.log(`- ${this.deliveryData.length} deliveries`);
          console.log(`- ${this.driverData.length} drivers`);
          console.log(`- ${this.customerData.length} ${this.foxDeliveryData.length > 0 ? 'companies' : 'customers'}`);
          
        } catch (error) {
          console.error('Error parsing stored data:', error);
          this.clearAllData(); // Clear inconsistent data
        }
      } else {
        // No stored data - start with empty arrays
        this.clearAllData(false); // Clear only memory, not storage
      }
    } catch (error) {
      console.error('Error in loadFromLocalStorage:', error);
      // Ensure we have empty arrays on any error
      this.clearAllData(false);
    }
  }

  async getDeliveryData(): Promise<DataServiceResult<DeliveryData[]>> {
    try {
      await this.initializeData();
      return {
        data: this.deliveryData,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      };
    }
  }

  async getDriverData(): Promise<DataServiceResult<DriverData[]>> {
    try {
      await this.initializeData();
      return {
        data: this.driverData,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      };
    }
  }

  async getCustomerData(): Promise<DataServiceResult<CustomerData[]>> {
    try {
      await this.initializeData();
      return {
        data: this.customerData,
        error: null,
        loading: false,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      };
    }
  }

  async updateDeliveryData(newData: DeliveryData[]): Promise<void> {
    try {
      this.deliveryData = newData;
      this.driverData = calculateDriverMetrics(newData);
      this.customerData = calculateCustomerMetrics(newData);
      
      console.log(`📊 Updating data: ${newData.length} deliveries, ${this.driverData.length} drivers, ${this.customerData.length} customers`);
      
      // Try to store data with graceful degradation
      let deliveryStored = false;
      let driverStored = false;
      let customerStored = false;
      
      try {
        deliveryStored = StorageUtils.setLargeItem('foxDeliveryData', newData);
        console.log(`📦 Delivery data storage: ${deliveryStored ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.warn('⚠️ Failed to store delivery data:', error);
      }
      
      try {
        driverStored = StorageUtils.setLargeItem('foxDriverData', this.driverData);
        console.log(`👥 Driver data storage: ${driverStored ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.warn('⚠️ Failed to store driver data:', error);
      }
      
      try {
        customerStored = StorageUtils.setLargeItem('foxCustomerData', this.customerData);
        console.log(`🏢 Customer data storage: ${customerStored ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.warn('⚠️ Failed to store customer data:', error);
      }
      
      // Even if storage fails, continue with in-memory data
      if (!deliveryStored && !driverStored && !customerStored) {
        console.warn('⚠️ All storage operations failed, continuing with in-memory data only');
        console.log('ℹ️ Data is still available in current session but will not persist');
      } else if (!deliveryStored || !driverStored || !customerStored) {
        console.warn('⚠️ Some data could not be stored due to size constraints, but continuing...');
        console.log('ℹ️ Data is available in current session, storage will be retried on next operation');
      } else {
        console.log('✅ All data successfully stored');
      }
      
    } catch (error) {
      console.error('❌ Error in updateDeliveryData:', error);
      // Don't throw error - allow operation to continue with in-memory data
      console.log('ℹ️ Continuing with in-memory data despite storage errors');
    }
  }

  // New method to update data from XLSX files with company information
  async updateFromFoxData(foxData: FoxDelivery[]): Promise<void> {
    console.log('🦊 Updating data from Fox deliveries:', foxData.length, 'items');
    
    // Store the original Fox data
    this.foxDeliveryData = foxData;
    
    // Start background operations immediately (non-blocking for UI)
    Promise.resolve().then(async () => {
      try {
        console.log('💾 Uploading to Supabase in background...');
        const uploadResult = await uploadDeliveryData(foxData);
        if (uploadResult.success) {
          console.log(`✅ Successfully uploaded ${uploadResult.count} records to Supabase`);
        } else {
          console.warn('⚠️ Background Supabase upload failed:', uploadResult.error);
        }
      } catch (error) {
        console.warn('⚠️ Background Supabase upload error:', error);
      }
    });
    
    // Store original data (also non-blocking)
    setTimeout(() => {
      StorageUtils.setLargeItem('foxOriginalData', foxData);
    }, 0);
    
    // Convert Fox delivery data to our internal format
    const convertedDeliveries = foxData.map((foxDelivery, index) => {
      // Use the same driver identification logic as CSV processing
      const driverName = foxDelivery.delivering_driver || foxDelivery.collecting_driver;
      
      return {
        id: foxDelivery.job_id || foxDelivery.id || `fox-${index + 1}`,
        driverId: driverName || `driver-${index % 10}`,
        driverName: driverName || `Driver ${index % 10}`,
        customerId: foxDelivery.customer_name || `customer-${index}`,
        customerName: foxDelivery.customer_name || foxDelivery.pickup_customer_name || foxDelivery.delivery_customer_name || 'Unknown Customer',
        address: foxDelivery.delivery_address || foxDelivery.pickup_address || 'Unknown Address',
        city: 'Dublin', // Default city
        status: this.mapFoxStatusToInternalStatus(foxDelivery.status),
        deliveryTime: foxDelivery.delivered_at || foxDelivery.created_at || new Date().toISOString(),
        latitude: foxDelivery.delivery_lat || 53.349805,
        longitude: foxDelivery.delivery_lng || -6.26031,
        rating: this.generateRatingFromStatus(foxDelivery.status),
        // Preserve original Fox data for accurate calculations and consistent driver identification
        job_id: foxDelivery.job_id,
        collected_at: foxDelivery.collected_at,
        delivered_at: foxDelivery.delivered_at,
        delivering_driver: foxDelivery.delivering_driver,
        collecting_driver: foxDelivery.collecting_driver,
        cost: foxDelivery.cost,
        // Preserve all driver-related fields for consistent extraction
        driver: foxDelivery.delivering_driver || foxDelivery.collecting_driver,
      };
    });
    
    this.deliveryData = convertedDeliveries as DeliveryData[];
    
    // Recalculate driver metrics with the new data - using enhanced driver identification
    this.driverData = calculateDriverMetrics(this.deliveryData);
    console.log(`👥 Recalculated metrics for ${this.driverData.length} drivers`);
    
    // Calculate company metrics from original Fox data  
    this.customerData = calculateCompanyMetrics(foxData);
    console.log(`🏢 Calculated metrics for ${this.customerData.length} companies`);
    
    // Store data in background with graceful degradation
    setTimeout(() => {
      Promise.allSettled([
        new Promise(resolve => {
          try {
            const stored = StorageUtils.setLargeItem('foxDeliveryData', this.deliveryData);
            console.log(`📦 Fox delivery data storage: ${stored ? 'Success' : 'Failed'}`);
            resolve(stored);
          } catch (error) {
            console.warn('⚠️ Failed to store Fox delivery data:', error);
            resolve(false);
          }
        }),
        new Promise(resolve => {
          try {
            const stored = StorageUtils.setLargeItem('foxDriverData', this.driverData);
            console.log(`👥 Fox driver data storage: ${stored ? 'Success' : 'Failed'}`);
            resolve(stored);
          } catch (error) {
            console.warn('⚠️ Failed to store Fox driver data:', error);
            resolve(false);
          }
        }),
        new Promise(resolve => {
          try {
            const stored = StorageUtils.setLargeItem('foxCustomerData', this.customerData);
            console.log(`🏢 Fox customer data storage: ${stored ? 'Success' : 'Failed'}`);
            resolve(stored);
          } catch (error) {
            console.warn('⚠️ Failed to store Fox customer data:', error);
            resolve(false);
          }
        })
      ]).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`💾 Storage completed: ${successful}/3 operations successful`);
      });
    }, 100); // Small delay to not block UI
    
    console.log('📊 Fox data processing completed - storage running in background');
  }

  private mapFoxStatusToInternalStatus(status?: string): 'delivered' | 'failed' | 'pending' | 'in_transit' {
    if (!status) return 'pending';
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('delivered') || lowerStatus === 'completed') return 'delivered';
    if (lowerStatus.includes('failed') || lowerStatus.includes('cancelled') || lowerStatus.includes('canceled')) return 'failed';
    if (lowerStatus.includes('transit') || lowerStatus.includes('collected') || lowerStatus.includes('progress')) return 'in_transit';
    
    return 'pending';
  }

  private generateRatingFromStatus(status?: string): number | undefined {
    if (!status) return undefined;
    if (status.toLowerCase().includes('success') || status.toLowerCase().includes('delivered')) return 5;
    if (status.toLowerCase().includes('failed') || status.toLowerCase().includes('cancelled')) return 1;
    return 3;
  }

  // Clears all data from memory and optionally from localStorage
  clearAllData(clearStorage: boolean = true): void {
    console.log(`🧹 Clearing all data... Storage clear: ${clearStorage}`);
    
    // Clear all data arrays
    this.deliveryData = [];
    this.driverData = [];
    this.customerData = [];
    this.foxDeliveryData = [];
    
    // Reset initialization flag to ensure clean state
    this.isInitialized = false;
    
    if (clearStorage) {
      try {
        StorageUtils.removeLargeItem('foxDeliveryData');
        StorageUtils.removeLargeItem('foxDriverData');
        StorageUtils.removeLargeItem('foxCustomerData');
        StorageUtils.removeLargeItem('foxOriginalData');
        console.log('🗑️ Storage cleared successfully.');
      } catch (error) {
        console.error('❌ Error clearing storage:', error);
        // Continue execution even if storage clearing fails
      }
    }
    
    console.log('✅ All data cleared successfully');
  }

  // Method to regenerate mock data (useful for testing)
  regenerateMockData(): void {
    if (USE_MOCK_DATA) {
      this.isInitialized = false; // Force re-initialization
      // Clear storage to force new data generation
      StorageUtils.removeLargeItem('foxDeliveryData');
      StorageUtils.removeLargeItem('foxDriverData');
      StorageUtils.removeLargeItem('foxCustomerData');
      this.generateAndStoreNewMockData();
      console.log('🔄 Mock data regenerated with new distribution');
    }
  }

  // Method to check if data exists
  hasData(): boolean {
    return this.deliveryData.length > 0;
  }

  hasCompanyData(): boolean {
    return this.foxDeliveryData.length > 0;
  }

  getFoxData(): FoxDelivery[] {
    return this.foxDeliveryData;
  }
}

export const dataService = DataService.getInstance(); 