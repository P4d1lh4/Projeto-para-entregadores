
import mapboxgl from 'mapbox-gl';

// Store the Mapbox tokens
const MAPBOX_PUBLIC_TOKEN = "pk.eyJ1Ijoid2Vic3RhcnN0dWRpbyIsImEiOiJjbTk2bGw0a2gweXdiMmlvcWdxNDVlamE4In0.wESY6-dmnc5gSp_E_TS6Qw";
// We'll only use the public token for geocoding in the frontend
// The secret token would be used in a backend service if we had one

// Cache to store previously geocoded addresses
const geocodeCache: Record<string, {lat: number, lng: number}> = {};

export const setMapboxToken = () => {
  mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;
};

export const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
  // Return from cache if available
  if (geocodeCache[address]) {
    return geocodeCache[address];
  }
  
  try {
    const normalizedAddress = address.trim().toLowerCase();
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalizedAddress)}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&limit=1`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      
      // Store in cache
      geocodeCache[address] = { lat, lng };
      
      return { lat, lng };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const batchGeocodeAddresses = async (addresses: string[]): Promise<Record<string, {lat: number, lng: number} | null>> => {
  const uniqueAddresses = [...new Set(addresses)].filter(address => !!address);
  const results: Record<string, {lat: number, lng: number} | null> = {};
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < uniqueAddresses.length; i += batchSize) {
    const batch = uniqueAddresses.slice(i, i + batchSize);
    const batchPromises = batch.map(address => 
      geocodeAddress(address)
        .then(result => ({ address, result }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ address, result }) => {
      results[address] = result;
    });
    
    // Add a small delay between batches to respect rate limits
    if (i + batchSize < uniqueAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};
