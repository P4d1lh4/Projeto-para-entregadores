// Storage utilities to handle large data efficiently
export class StorageUtils {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private static readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB max total (increased from 4MB)

  /**
   * Compresses and stores large data in chunks to avoid localStorage quota issues
   */
  static setLargeItem(key: string, data: any): boolean {
    try {
      // First, try to clean up old data
      this.clearOldChunks(key);
      
      // Pre-optimize data to reduce size
      const optimizedData = this.optimizeData(data);
      const jsonString = JSON.stringify(optimizedData);
      const sizeInBytes = new Blob([jsonString]).size;
      
      console.log(`📦 Storing ${key}: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB (optimized)`);
      
      // Check current storage usage
      const currentUsage = this.getStorageSize();
      const availableSpace = this.MAX_STORAGE_SIZE - currentUsage;
      
      console.log(`💽 Storage usage: ${(currentUsage / 1024 / 1024).toFixed(2)}MB / ${(this.MAX_STORAGE_SIZE / 1024 / 1024).toFixed(2)}MB`);
        
      // If we don't have enough space, aggressive cleanup
      if (sizeInBytes > availableSpace) {
        console.log('🧹 Insufficient space, performing aggressive cleanup...');
        this.aggressiveCleanup(key);
        
        // Recalculate after cleanup
        const newUsage = this.getStorageSize();
        const newAvailableSpace = this.MAX_STORAGE_SIZE - newUsage;
        
        if (sizeInBytes > newAvailableSpace) {
          console.warn(`⚠️ Even after cleanup, not enough space. Required: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB, Available: ${(newAvailableSpace / 1024 / 1024).toFixed(2)}MB`);
          // Try chunking as last resort
          return this.storeInChunks(key, jsonString);
        }
      }
      
      // Try to store normally first
      try {
        localStorage.setItem(key, jsonString);
        console.log(`✅ Successfully stored ${key} normally`);
        return true;
      } catch (normalError) {
        // If normal storage fails, try chunking
        console.log(`⚠️ Normal storage failed for ${key}, trying chunked storage...`);
        return this.storeInChunks(key, jsonString);
      }
      
    } catch (error) {
      console.error(`❌ Failed to store ${key}:`, error);
      
      // If storage failed due to quota, try emergency protocols
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('🚨 QuotaExceededError detected, executing emergency protocols...');
        return this.emergencyStorage(key, data);
      }
      return false;
    }
  }

  /**
   * Retrieves large data that may be stored in chunks
   */
  static getLargeItem(key: string): any | null {
    try {
      // First try to get normally
      const normalData = localStorage.getItem(key);
      if (normalData) {
        return JSON.parse(normalData);
      }

      // If not found, try to get from chunks
      return this.getFromChunks(key);
    } catch (error) {
      console.error(`❌ Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Stores data in chunks to avoid localStorage quota issues
   */
  private static storeInChunks(key: string, data: string): boolean {
    try {
      const chunks = [];
      const chunkCount = Math.ceil(data.length / this.CHUNK_SIZE);
      
      console.log(`📦 Storing ${key} in ${chunkCount} chunks`);
      
      // Split data into chunks
      for (let i = 0; i < chunkCount; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, data.length);
        const chunk = data.substring(start, end);
        chunks.push(chunk);
      }

      // Store chunk metadata
      localStorage.setItem(`${key}_chunks`, JSON.stringify({
        count: chunkCount,
        timestamp: Date.now()
      }));

      // Store each chunk
      for (let i = 0; i < chunks.length; i++) {
        localStorage.setItem(`${key}_chunk_${i}`, chunks[i]);
      }

      console.log(`✅ Successfully stored ${key} in ${chunkCount} chunks`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store chunks for ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieves data from chunks
   */
  private static getFromChunks(key: string): any | null {
    try {
      const metadata = localStorage.getItem(`${key}_chunks`);
      if (!metadata) return null;

      const { count } = JSON.parse(metadata);
      let reconstructedData = '';

      // Reconstruct data from chunks
      for (let i = 0; i < count; i++) {
        const chunk = localStorage.getItem(`${key}_chunk_${i}`);
        if (chunk === null) {
          console.error(`❌ Missing chunk ${i} for ${key}`);
          return null;
        }
        reconstructedData += chunk;
      }

      return JSON.parse(reconstructedData);
    } catch (error) {
      console.error(`❌ Failed to retrieve chunks for ${key}:`, error);
      return null;
    }
  }

  /**
   * Clears old chunks for a specific key
   */
  private static clearOldChunks(key: string): void {
    try {
      const metadata = localStorage.getItem(`${key}_chunks`);
      if (metadata) {
        const { count } = JSON.parse(metadata);
        
        // Remove all chunks
        for (let i = 0; i < count; i++) {
          localStorage.removeItem(`${key}_chunk_${i}`);
        }
        
        // Remove metadata
        localStorage.removeItem(`${key}_chunks`);
      }
    } catch (error) {
      console.error(`❌ Failed to clear old chunks for ${key}:`, error);
    }
  }

  /**
   * Optimizes data by removing unnecessary fields and compressing
   */
  private static optimizeData(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.optimizeItem(item));
    }
    return this.optimizeItem(data);
  }

  /**
   * Optimizes individual data items
   */
  private static optimizeItem(item: any): any {
    if (typeof item !== 'object' || item === null) {
      return item;
    }

    const optimized: any = {};
    
    // Keep only essential fields and compress others
    for (const [key, value] of Object.entries(item)) {
      // Skip very long strings that might be base64 encoded images
      if (typeof value === 'string' && value.length > 1000) {
        continue;
      }
      
      // Skip null/undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      // Recursively optimize nested objects
      if (typeof value === 'object' && value !== null) {
        const optimizedValue = this.optimizeItem(value);
        if (Object.keys(optimizedValue).length > 0) {
          optimized[key] = optimizedValue;
        }
      } else {
        optimized[key] = value;
      }
    }
    
    return optimized;
  }

  /**
   * Cleans up old data to free up localStorage space
   */
  private static cleanupOldData(): void {
    try {
      const keysToCheck = [
        'deliveryData',
        'driverData', 
        'customerData',
        'originalData'
      ];

      for (const key of keysToCheck) {
        // Check if key has chunks
        const metadata = localStorage.getItem(`${key}_chunks`);
        if (metadata) {
          const { timestamp } = JSON.parse(metadata);
          const age = Date.now() - timestamp;
          
          // Remove chunks older than 1 hour
          if (age > 60 * 60 * 1000) {
            console.log(`🧹 Removing old chunks for ${key}`);
            this.clearOldChunks(key);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
    }
  }

  /**
   * Aggressive cleanup - removes all non-essential data to free up space
   */
  private static aggressiveCleanup(currentKey: string): void {
    try {
      console.log('🚨 Performing aggressive cleanup...');
      
      const keysToCheck = [
        'deliveryData',
        'driverData', 
        'customerData',
        'originalData'
      ];

      // Clear all keys except the one we're trying to store
      for (const key of keysToCheck) {
        if (key !== currentKey) {
          console.log(`🗑️ Removing ${key} to free up space`);
          this.removeLargeItem(key);
        }
      }

      // Clear any other application data that might be taking space
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        // Keep only essential keys
        if (!key.startsWith('delivery') && 
            !key.includes('chunk') && 
            !key.includes('theme') &&
            !key.includes('settings')) {
          try {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed non-essential key: ${key}`);
          } catch (e) {
            // Continue on error
          }
        }
      }

      console.log('✅ Aggressive cleanup completed');
    } catch (error) {
      console.error('❌ Failed to perform aggressive cleanup:', error);
    }
  }

  /**
   * Emergency storage protocol - ultra-compressed storage for critical data
   */
  private static emergencyStorage(key: string, data: any): boolean {
    try {
      console.log('🚨 Emergency storage protocol activated');
      
      // Ultra-aggressive optimization
      const ultraOptimized = this.ultraOptimizeData(data);
      const jsonString = JSON.stringify(ultraOptimized);
      const sizeInBytes = new Blob([jsonString]).size;
      
      console.log(`🔥 Ultra-optimized size: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
      
      // Clear ALL other data to make room
      const allKeys = Object.keys(localStorage);
      for (const storageKey of allKeys) {
        if (storageKey !== key && !storageKey.startsWith(`${key}_`)) {
          try {
            localStorage.removeItem(storageKey);
          } catch (e) {
            // Continue on error
          }
        }
      }
      
      // Try to store the ultra-optimized data
      try {
        localStorage.setItem(key, jsonString);
        console.log('✅ Emergency storage successful');
        return true;
      } catch (emergencyError) {
        console.error('❌ Emergency storage failed, attempting chunked storage...');
        return this.storeInChunks(key, jsonString);
      }
      
    } catch (error) {
      console.error('❌ Emergency storage protocol failed:', error);
      return false;
    }
  }

  /**
   * Ultra-aggressive data optimization for emergency situations
   */
  private static ultraOptimizeData(data: any): any {
    if (Array.isArray(data)) {
      // Keep only first 100 items in emergency mode
      const limitedData = data.slice(0, 100);
      return limitedData.map(item => this.ultraOptimizeItem(item));
    }
    return this.ultraOptimizeItem(data);
  }

  /**
   * Ultra-optimize individual items - keep only absolutely essential fields
   */
  private static ultraOptimizeItem(item: any): any {
    if (typeof item !== 'object' || item === null) {
      return item;
    }

    const essential: any = {};
    
    // Keep only the most essential fields
    const essentialFields = [
      'id', 'name', 'status', 'deliveries', 'successRate',
      'driverId', 'driverName', 'customerId', 'customerName',
      'city', 'deliveryTime', 'job_id'
    ];
    
    for (const field of essentialFields) {
      if (item[field] !== undefined && item[field] !== null) {
        if (typeof item[field] === 'string' && item[field].length > 50) {
          // Truncate long strings
          essential[field] = item[field].substring(0, 50);
        } else {
          essential[field] = item[field];
        }
      }
    }
    
    return essential;
  }

  /**
   * Removes a large item (including chunks)
   */
  static removeLargeItem(key: string): void {
    try {
      // Remove normal item
      localStorage.removeItem(key);
      
      // Remove chunks if they exist
      this.clearOldChunks(key);
    } catch (error) {
      console.error(`❌ Failed to remove ${key}:`, error);
    }
  }

  /**
   * Gets the approximate size of stored data
   */
  static getStorageSize(): number {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      return totalSize;
    } catch (error) {
      console.error('❌ Failed to calculate storage size:', error);
      return 0;
    }
  }

  /**
   * Checks if localStorage has enough space for new data
   */
  static hasSpaceFor(data: any): boolean {
    try {
      const jsonString = JSON.stringify(data);
      const dataSize = new Blob([jsonString]).size;
      const currentSize = this.getStorageSize();
      const availableSpace = this.MAX_STORAGE_SIZE - currentSize;
      
      return dataSize <= availableSpace;
    } catch (error) {
      console.error('❌ Failed to check available space:', error);
      return false;
    }
  }
} 