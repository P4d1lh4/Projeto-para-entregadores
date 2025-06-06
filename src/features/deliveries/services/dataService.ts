import { generateMockDeliveryData, calculateDriverMetrics, calculateCustomerMetrics, calculateCompanyMetrics } from '@/lib/file-utils';
import { uploadDeliveryData } from '@/services/deliveryService';
import type { DeliveryData, DriverData, CustomerData } from '../types';
import type { FoxDelivery } from '@/types/delivery';

// Configuration for data source
const USE_MOCK_DATA = true; // Temporarily enable to test filters

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
        // First try to load from localStorage
        const storedDeliveryData = localStorage.getItem('foxDeliveryData');
        const storedDriverData = localStorage.getItem('foxDriverData');
        const storedCustomerData = localStorage.getItem('foxCustomerData');
        
        if (storedDeliveryData && storedDriverData && storedCustomerData) {
          console.log('📥 Loading existing data from localStorage...');
          try {
            this.deliveryData = JSON.parse(storedDeliveryData);
            this.driverData = JSON.parse(storedDriverData);
            this.customerData = JSON.parse(storedCustomerData);
            console.log('✅ Loaded from localStorage:', this.deliveryData.length, 'deliveries,', this.driverData.length, 'drivers,', this.customerData.length, 'customers');
          } catch (parseError) {
            console.warn('⚠️ Error parsing stored data, generating new mock data...');
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
    
    // Store all data in localStorage for persistence
    localStorage.setItem('foxDeliveryData', JSON.stringify(this.deliveryData));
    localStorage.setItem('foxDriverData', JSON.stringify(this.driverData));
    localStorage.setItem('foxCustomerData', JSON.stringify(this.customerData));
    
    // Log the new success rate
    const successRate = this.deliveryData.filter(d => d.status === 'delivered').length / this.deliveryData.length * 100;
    console.log('💾 Generated and stored', this.deliveryData.length, 'deliveries,', this.driverData.length, 'drivers,', this.customerData.length, 'customers');
    console.log('📊 New success rate:', Math.round(successRate) + '%');
  }

  private async loadFromLocalStorage(): Promise<void> {
    const storedDeliveryData = localStorage.getItem('foxDeliveryData');
    const storedDriverData = localStorage.getItem('foxDriverData');
    const storedCustomerData = localStorage.getItem('foxCustomerData');
    const storedOriginalData = localStorage.getItem('foxOriginalData');
    
    if (storedDeliveryData) {
      try {
        this.deliveryData = JSON.parse(storedDeliveryData);
        
        // Check if we have original XLSX data with company information
        if (storedOriginalData) {
          try {
            this.foxDeliveryData = JSON.parse(storedOriginalData);
            console.log('📊 Found original XLSX data with company information');
            
            // Recalculate company metrics from original data if needed
            if (storedCustomerData) {
              this.customerData = JSON.parse(storedCustomerData);
            } else {
              console.log('🏢 Recalculating company metrics from XLSX data...');
              this.customerData = calculateCompanyMetrics(this.foxDeliveryData);
              localStorage.setItem('foxCustomerData', JSON.stringify(this.customerData));
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
          this.driverData = JSON.parse(storedDriverData);
        } else {
          this.driverData = calculateDriverMetrics(this.deliveryData);
          localStorage.setItem('foxDriverData', JSON.stringify(this.driverData));
        }
        
        console.log('📥 Loaded data from localStorage');
        console.log(`- ${this.deliveryData.length} deliveries`);
        console.log(`- ${this.driverData.length} drivers`);
        console.log(`- ${this.customerData.length} ${this.foxDeliveryData.length > 0 ? 'companies' : 'customers'}`);
        
      } catch (error) {
        console.error('Error parsing stored data:', error);
        throw error;
      }
    } else {
      // No stored data - start with empty arrays
      this.deliveryData = [];
      this.driverData = [];
      this.customerData = [];
      this.foxDeliveryData = [];
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
    this.deliveryData = newData;
    this.driverData = calculateDriverMetrics(newData);
    this.customerData = calculateCustomerMetrics(newData);
    
    // Update localStorage with all data
    localStorage.setItem('foxDeliveryData', JSON.stringify(newData));
    localStorage.setItem('foxDriverData', JSON.stringify(this.driverData));
    localStorage.setItem('foxCustomerData', JSON.stringify(this.customerData));
  }

  // New method to update data from XLSX files with company information
  async updateFromFoxData(foxData: FoxDelivery[]): Promise<void> {
    console.log('🦊 Updating data from Fox deliveries:', foxData.length, 'items');
    
    // Store the original Fox data
    this.foxDeliveryData = foxData;
    localStorage.setItem('foxOriginalData', JSON.stringify(foxData));
    
    // Upload to Supabase first
    console.log('💾 Uploading to Supabase...');
    try {
      const uploadResult = await uploadDeliveryData(foxData);
      if (uploadResult.success) {
        console.log(`✅ Successfully uploaded ${uploadResult.count} records to Supabase`);
      } else {
        console.error('❌ Failed to upload to Supabase:', uploadResult.error);
        // Continue with local processing even if Supabase upload fails
      }
    } catch (error) {
      console.error('❌ Error uploading to Supabase:', error);
      // Continue with local processing even if Supabase upload fails
    }
    
    // Convert Fox delivery data to our internal format
    const convertedDeliveries = foxData.map((foxDelivery, index) => {
      return {
        id: foxDelivery.job_id || foxDelivery.id || `fox-${index + 1}`,
        driverId: foxDelivery.delivering_driver || foxDelivery.collecting_driver || `driver-${index % 10}`,
        driverName: foxDelivery.delivering_driver || foxDelivery.collecting_driver || `Driver ${index % 10}`,
        customerId: foxDelivery.customer_name || `customer-${index}`,
        customerName: foxDelivery.customer_name || foxDelivery.pickup_customer_name || foxDelivery.delivery_customer_name || 'Unknown Customer',
        address: foxDelivery.delivery_address || foxDelivery.pickup_address || 'Unknown Address',
        city: 'Dublin', // Default city
        status: this.mapFoxStatusToInternalStatus(foxDelivery.status),
        deliveryTime: foxDelivery.delivered_at || foxDelivery.created_at || new Date().toISOString(),
        latitude: foxDelivery.delivery_lat || 53.349805,
        longitude: foxDelivery.delivery_lng || -6.26031,
        rating: this.generateRatingFromStatus(foxDelivery.status),
        // Preserve original Fox data for accurate calculations
        collected_at: foxDelivery.collected_at,
        delivered_at: foxDelivery.delivered_at,
        delivering_driver: foxDelivery.delivering_driver,
        collecting_driver: foxDelivery.collecting_driver,
      };
    });
    
    this.deliveryData = convertedDeliveries as DeliveryData[];
    
    // Recalculate driver metrics with the new data - using enhanced driver identification
    this.driverData = calculateDriverMetrics(this.deliveryData);
    console.log(`👥 Recalculated metrics for ${this.driverData.length} drivers`);
    
    // Calculate company metrics from original Fox data  
    this.customerData = calculateCompanyMetrics(foxData);
    console.log(`🏢 Calculated metrics for ${this.customerData.length} companies`);
    
    // Update localStorage with all data
    localStorage.setItem('foxDeliveryData', JSON.stringify(this.deliveryData));
    localStorage.setItem('foxDriverData', JSON.stringify(this.driverData));
    localStorage.setItem('foxCustomerData', JSON.stringify(this.customerData));
    
    console.log('💾 Updated localStorage with Fox delivery data');
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
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('delivered') || lowerStatus === 'completed') {
      return Math.floor(Math.random() * 2) + 4; // 4-5 for successful deliveries
    }
    if (lowerStatus.includes('transit') || lowerStatus.includes('collected')) {
      return Math.floor(Math.random() * 2) + 3; // 3-4 for in progress
    }
    
    return undefined; // No rating for pending/failed deliveries
  }

  // Method to clear all data
  clearData(): void {
    this.deliveryData = [];
    this.driverData = [];
    this.customerData = [];
    this.foxDeliveryData = [];
    localStorage.removeItem('foxDeliveryData');
    localStorage.removeItem('foxDriverData');
    localStorage.removeItem('foxCustomerData');
    localStorage.removeItem('foxOriginalData');
    this.isInitialized = false; // Allow re-initialization
    console.log('🗑️ All data cleared');
  }

  // Method to regenerate mock data (useful for testing)
  regenerateMockData(): void {
    if (USE_MOCK_DATA) {
      this.isInitialized = false; // Force re-initialization
      // Clear localStorage to force new data generation
      localStorage.removeItem('foxDeliveryData');
      localStorage.removeItem('foxDriverData');
      localStorage.removeItem('foxCustomerData');
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