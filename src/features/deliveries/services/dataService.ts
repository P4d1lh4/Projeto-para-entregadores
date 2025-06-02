import { generateMockDeliveryData, calculateDriverMetrics, calculateCustomerMetrics } from '@/lib/file-utils';
import type { DeliveryData, DriverData, CustomerData } from '../types';

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
    
    if (storedDeliveryData) {
      try {
        this.deliveryData = JSON.parse(storedDeliveryData);
        
        // Try to load calculated data first, fallback to recalculation
        if (storedDriverData && storedCustomerData) {
          this.driverData = JSON.parse(storedDriverData);
          this.customerData = JSON.parse(storedCustomerData);
          console.log('📥 Loaded calculated metrics from localStorage');
        } else {
          this.driverData = calculateDriverMetrics(this.deliveryData);
          this.customerData = calculateCustomerMetrics(this.deliveryData);
          // Store the calculated data for next time
          localStorage.setItem('foxDriverData', JSON.stringify(this.driverData));
          localStorage.setItem('foxCustomerData', JSON.stringify(this.customerData));
          console.log('🔢 Recalculated and stored metrics');
        }
      } catch (error) {
        console.error('Error parsing stored data:', error);
        throw error;
      }
    } else {
      // No stored data - start with empty arrays
      this.deliveryData = [];
      this.driverData = [];
      this.customerData = [];
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

  // Method to clear all data
  clearData(): void {
    this.deliveryData = [];
    this.driverData = [];
    this.customerData = [];
    localStorage.removeItem('foxDeliveryData');
    localStorage.removeItem('foxDriverData');
    localStorage.removeItem('foxCustomerData');
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
}

export const dataService = DataService.getInstance(); 