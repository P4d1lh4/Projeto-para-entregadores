
import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import type { FoxDelivery } from '@/types/delivery';
import { setMapboxToken } from '@/services/geocodingService';

type MapConfig = {
  apiKey: string;
}

type DeliveryMapProps = {
  deliveries: FoxDelivery[];
  mapConfig?: MapConfig;
};

const DeliveryMap: React.FC<DeliveryMapProps> = ({ deliveries, mapConfig }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxApiKey, setMapboxApiKey] = useState<string>("");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const activePopup = useRef<mapboxgl.Popup | null>(null);
  
  // Format the delivery status
  const formatStatus = useCallback((status: string | undefined): string => {
    if (!status) return 'Unknown';
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      case 'in_transit':
        return 'In Transit';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }, []);
  
  // Get the appropriate color for a delivery status
  const getColorForStatus = useCallback((status: string | undefined): string => {
    if (!status) return '#9ca3af'; // Gray
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4ade80'; // Green
      case 'failed':
        return '#f87171'; // Red
      case 'in_transit':
        return '#60a5fa'; // Blue
      case 'pending':
        return '#fbbf24'; // Yellow
      default:
        return '#9ca3af'; // Gray
    }
  }, []);
  
  // Format a timestamp for display
  const formatTime = useCallback((timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  }, []);
  
  // Format the waiting time for display
  const formatWaitingTime = useCallback((waitingTime: string | undefined): string => {
    if (!waitingTime) return 'N/A';
    return waitingTime;
  }, []);
  
  // Handle API key input
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMapboxApiKey(value);
    localStorage.setItem('mapboxApiKey', value);
    
    if (value) {
      initializeMap(value);
    }
  };
  
  // Initialize the map with the given API key
  const initializeMap = useCallback((apiKey: string) => {
    if (!mapContainer.current) return;
    
    if (map.current) {
      map.current.remove();
    }
    
    mapboxgl.accessToken = apiKey;
    
    // Create the map instance
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-6.26031, 53.349805], // Default to Dublin
      zoom: 11,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Set loaded flag when map is ready
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);
  
  // Update map data when deliveries change
  const updateMapData = useCallback(() => {
    if (!map.current || !mapLoaded || !deliveries.length) return;
    
    const mapInstance = map.current;
    
    // Clear any existing data
    if (mapInstance.getSource('pickups')) {
      mapInstance.removeLayer('pickups-circles');
      mapInstance.removeSource('pickups');
    }
    
    if (mapInstance.getSource('deliveries')) {
      mapInstance.removeLayer('deliveries-circles');
      mapInstance.removeSource('deliveries');
    }
    
    if (mapInstance.getSource('routes')) {
      mapInstance.removeLayer('route-lines');
      mapInstance.removeSource('routes');
    }
    
    // Filter deliveries that have both pickup and delivery coordinates
    const validDeliveries = deliveries.filter(
      delivery => delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng
    );
    
    if (validDeliveries.length === 0) {
      return;
    }
    
    // Add pickup points
    mapInstance.addSource('pickups', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: validDeliveries.map((delivery) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [delivery.pickup_lng!, delivery.pickup_lat!],
          },
          properties: {
            id: delivery.id,
            type: 'pickup',
            driver: delivery.collecting_driver,
            customerName: delivery.pickup_customer_name || delivery.customer_name,
            address: delivery.pickup_address,
            status: delivery.status,
            time: delivery.collected_at,
            waitingTime: delivery.collected_waiting_time,
            notes: delivery.collection_notes,
            color: getColorForStatus(delivery.status),
          },
        })),
      },
    });
    
    // Add delivery points
    mapInstance.addSource('deliveries', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: validDeliveries.map((delivery) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [delivery.delivery_lng!, delivery.delivery_lat!],
          },
          properties: {
            id: delivery.id,
            type: 'delivery',
            driver: delivery.delivering_driver,
            customerName: delivery.delivery_customer_name || delivery.customer_name,
            address: delivery.delivery_address,
            status: delivery.status,
            time: delivery.delivered_at,
            waitingTime: delivery.delivered_waiting_time,
            notes: delivery.delivery_notes,
            color: getColorForStatus(delivery.status),
          },
        })),
      },
    });
    
    // Add routes between pickup and delivery
    mapInstance.addSource('routes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: validDeliveries.map((delivery) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [delivery.pickup_lng!, delivery.pickup_lat!],
              [delivery.delivery_lng!, delivery.delivery_lat!],
            ],
          },
          properties: {
            id: delivery.id,
            customerName: delivery.customer_name,
            status: delivery.status,
            color: getColorForStatus(delivery.status),
          },
        })),
      },
    });
    
    // Add pickup points layer
    mapInstance.addLayer({
      id: 'pickups-circles',
      type: 'circle',
      source: 'pickups',
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
    
    // Add delivery points layer
    mapInstance.addLayer({
      id: 'deliveries-circles',
      type: 'circle',
      source: 'deliveries',
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
    
    // Add route lines
    mapInstance.addLayer({
      id: 'route-lines',
      type: 'line',
      source: 'routes',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 3,
        'line-opacity': 0.6,
        'line-dasharray': [0.5, 1],
      },
    });
    
    // Add hover effects for pickup points
    mapInstance.on('mouseenter', 'pickups-circles', (e) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });
    
    mapInstance.on('mouseleave', 'pickups-circles', () => {
      mapInstance.getCanvas().style.cursor = '';
    });
    
    // Add hover effects for delivery points
    mapInstance.on('mouseenter', 'deliveries-circles', (e) => {
      mapInstance.getCanvas().style.cursor = 'pointer';
    });
    
    mapInstance.on('mouseleave', 'deliveries-circles', () => {
      mapInstance.getCanvas().style.cursor = '';
    });
    
    // Handle clicks on pickup points
    mapInstance.on('click', 'pickups-circles', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const props = feature.properties;
      if (!props) return;
      
      const coordinates = feature.geometry.coordinates.slice() as [number, number];
      
      // Close any open popups
      if (activePopup.current) {
        activePopup.current.remove();
      }
      
      // Create and display the popup
      activePopup.current = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">Pickup Point</h3>
            <p class="text-xs mb-1"><span class="font-semibold">Customer:</span> ${props.customerName || 'N/A'}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Address:</span> ${props.address || 'N/A'}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Driver:</span> ${props.driver || 'N/A'}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Status:</span> ${formatStatus(props.status)}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Collected At:</span> ${formatTime(props.time)}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Waiting Time:</span> ${formatWaitingTime(props.waitingTime)}</p>
            ${props.notes ? `<p class="text-xs mt-2"><span class="font-semibold">Notes:</span> ${props.notes}</p>` : ''}
          </div>
        `)
        .addTo(mapInstance);
    });
    
    // Handle clicks on delivery points
    mapInstance.on('click', 'deliveries-circles', (e) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const props = feature.properties;
      if (!props) return;
      
      const coordinates = feature.geometry.coordinates.slice() as [number, number];
      
      // Close any open popups
      if (activePopup.current) {
        activePopup.current.remove();
      }
      
      // Create and display the popup
      activePopup.current = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">Delivery Point</h3>
            <p class="text-xs mb-1"><span class="font-semibold">Customer:</span> ${props.customerName || 'N/A'}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Address:</span> ${props.address || 'N/A'}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Driver:</span> ${props.driver || 'N/A'}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Status:</span> ${formatStatus(props.status)}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Delivered At:</span> ${formatTime(props.time)}</p>
            <p class="text-xs mb-1"><span class="font-semibold">Waiting Time:</span> ${formatWaitingTime(props.waitingTime)}</p>
            ${props.notes ? `<p class="text-xs mt-2"><span class="font-semibold">Notes:</span> ${props.notes}</p>` : ''}
          </div>
        `)
        .addTo(mapInstance);
    });
    
    // Fit the map to show all delivery routes
    if (validDeliveries.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      validDeliveries.forEach(delivery => {
        if (delivery.pickup_lng && delivery.pickup_lat) {
          bounds.extend([delivery.pickup_lng, delivery.pickup_lat]);
        }
        if (delivery.delivery_lng && delivery.delivery_lat) {
          bounds.extend([delivery.delivery_lng, delivery.delivery_lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
        });
      }
    }
  }, [deliveries, mapLoaded, formatStatus, formatTime, formatWaitingTime, getColorForStatus]);
  
  // Initialize map on component mount
  useEffect(() => {
    // Try to get API key from props, localStorage, or use Mapbox public token
    const storedApiKey = localStorage.getItem('mapboxApiKey');
    const apiKey = mapConfig?.apiKey || storedApiKey || "pk.eyJ1Ijoid2Vic3RhcnN0dWRpbyIsImEiOiJjbTk2bGw0a2gweXdiMmlvcWdxNDVlamE4In0.wESY6-dmnc5gSp_E_TS6Qw";
    
    setMapboxToken(); // Set token in the geocoding service
    setMapboxApiKey(apiKey);
    
    initializeMap(apiKey);
  }, [initializeMap, mapConfig]);
  
  // Update map when deliveries change or map is loaded
  useEffect(() => {
    if (mapLoaded) {
      updateMapData();
    }
  }, [deliveries, mapLoaded, updateMapData]);
  
  // Check if there are any valid deliveries with coordinates
  const hasValidDeliveries = deliveries.some(
    delivery => delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng
  );
  
  if (!mapboxApiKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <h3 className="text-lg font-medium">Mapbox API Key Required</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              To display the delivery map, please enter your Mapbox API key. You can get one for free at 
              <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary mx-1">
                mapbox.com
              </a>
            </p>
            <div className="w-full max-w-md">
              <input
                type="text"
                placeholder="Enter Mapbox API Key"
                className="w-full rounded-md border border-input px-3 py-2"
                value={mapboxApiKey}
                onChange={handleApiKeyChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show a message if there are no valid deliveries
  if (deliveries.length === 0 || !hasValidDeliveries) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>No delivery routes to display. Please add deliveries with valid addresses.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="absolute top-4 right-16 z-10 flex space-x-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs shadow">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span>Delivered</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-32 p-2">
            <p className="text-xs">Delivery has been completed successfully</p>
          </HoverCardContent>
        </HoverCard>
        
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs shadow">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span>In Transit</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-32 p-2">
            <p className="text-xs">Delivery is currently in progress</p>
          </HoverCardContent>
        </HoverCard>
        
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs shadow">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span>Pending</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-32 p-2">
            <p className="text-xs">Delivery has not started yet</p>
          </HoverCardContent>
        </HoverCard>
        
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 rounded-md bg-background/90 px-2 py-1 text-xs shadow">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span>Failed</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-32 p-2">
            <p className="text-xs">Delivery has failed or was cancelled</p>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div ref={mapContainer} className="h-full min-h-[500px] w-full rounded-md" />
    </div>
  );
};

export default DeliveryMap;
