// Nominatim geocoding service for OpenStreetMap
interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

class NominatimService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  private requestQueue: Array<() => void> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 second between requests (Nominatim rate limit)

  // Rate limiting to respect Nominatim usage policy
  private async makeRequest<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.minInterval) {
            await new Promise(resolve => 
              setTimeout(resolve, this.minInterval - timeSinceLastRequest)
            );
          }

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Delivery-Analysis-App/1.0 (your-email@example.com)'
            }
          });

          this.lastRequestTime = Date.now();

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        } finally {
          this.processQueue();
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private processQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const nextRequest = this.requestQueue.shift();
    if (nextRequest) {
      nextRequest();
    }
  }

  // Geocode a single address
  async geocodeAddress(address: string, city?: string, country = 'Ireland'): Promise<GeocodeResult | null> {
    try {
      // Construct search query
      let query = address;
      if (city) {
        query += `, ${city}`;
      }
      query += `, ${country}`;

      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search?q=${encodedQuery}&format=json&limit=1&addressdetails=1&countrycodes=ie`;

      const results = await this.makeRequest<NominatimResponse[]>(url);

      if (results && results.length > 0) {
        const result = results[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error for address:', address, error);
      return null;
    }
  }

  // Reverse geocode coordinates to get address
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const url = `${this.baseUrl}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const result = await this.makeRequest<NominatimResponse>(url);
      
      if (result && result.display_name) {
        return result.display_name;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Batch geocode multiple addresses (with rate limiting)
  async geocodeAddresses(
    addresses: Array<{ id: string; address: string; city?: string }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Record<string, GeocodeResult | null>> {
    const results: Record<string, GeocodeResult | null> = {};
    
    for (let i = 0; i < addresses.length; i++) {
      const { id, address, city } = addresses[i];
      results[id] = await this.geocodeAddress(address, city);
      
      if (onProgress) {
        onProgress(i + 1, addresses.length);
      }
    }

    return results;
  }

  // Search for places with suggestions
  async searchPlaces(query: string, limit = 5): Promise<Array<{
    id: string;
    displayName: string;
    latitude: number;
    longitude: number;
    type: string;
  }>> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search?q=${encodedQuery}&format=json&limit=${limit}&addressdetails=1&countrycodes=ie`;

      const results = await this.makeRequest<NominatimResponse[]>(url);

      return results.map((result, index) => ({
        id: `place-${index}`,
        displayName: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        type: result.address?.road ? 'address' : 'place'
      }));
    } catch (error) {
      console.error('Place search error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const nominatimService = new NominatimService();

// Export types
export type { GeocodeResult, NominatimResponse }; 