
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import type { DeliveryData } from '@/lib/file-utils';

type MapConfig = {
  apiKey: string;
}

type DeliveryMapProps = {
  deliveries: DeliveryData[];
  mapConfig?: MapConfig;
};

const DeliveryMap: React.FC<DeliveryMapProps> = ({ deliveries, mapConfig }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxApiKey, setMapboxApiKey] = useState<string>("");
  
  // Handle API key input
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMapboxApiKey(e.target.value);
    localStorage.setItem('mapboxApiKey', e.target.value);
  };
  
  useEffect(() => {
    // Try to get API key from props or localStorage
    const storedApiKey = localStorage.getItem('mapboxApiKey');
    const apiKey = mapConfig?.apiKey || storedApiKey || "";
    setMapboxApiKey(apiKey);
    
    if (!mapContainer.current || !apiKey) return;
    
    mapboxgl.accessToken = apiKey;
    
    // Center on Dublin, Ireland by default
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-6.26031, 53.349805], // Dublin coordinates
      zoom: 11,
    });
    
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    const mapInstance = map.current;
    
    mapInstance.on('load', () => {
      // Add delivery points to the map
      if (!mapInstance.getSource('deliveries')) {
        mapInstance.addSource('deliveries', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: deliveries.map((delivery) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [delivery.longitude, delivery.latitude],
              },
              properties: {
                id: delivery.id,
                driverName: delivery.driverName,
                customerName: delivery.customerName,
                address: delivery.address,
                city: delivery.city,
                status: delivery.status,
                deliveryTime: delivery.deliveryTime,
                rating: delivery.rating,
                color: getColorForStatus(delivery.status),
              },
            })),
          },
        });
        
        mapInstance.addLayer({
          id: 'deliveries-circles',
          type: 'circle',
          source: 'deliveries',
          paint: {
            'circle-radius': 6,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        });
        
        // Add popups for deliveries
        mapInstance.on('click', 'deliveries-circles', (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          if (!props) return;
          
          const coordinates = (feature.geometry as any).coordinates.slice();
          
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div>
                <h3 class="font-bold">${props.customerName}</h3>
                <p class="text-sm mt-1">${props.address}, ${props.city}</p>
                <p class="text-xs mt-1">Status: <span class="font-semibold">${formatStatus(props.status)}</span></p>
                ${props.rating ? `<p class="text-xs">Rating: ${props.rating}/5</p>` : ''}
                <p class="text-xs mt-1">Driver: ${props.driverName}</p>
              </div>
            `)
            .addTo(mapInstance);
        });
        
        mapInstance.on('mouseenter', 'deliveries-circles', () => {
          if (mapInstance) {
            mapInstance.getCanvas().style.cursor = 'pointer';
          }
        });
        
        mapInstance.on('mouseleave', 'deliveries-circles', () => {
          if (mapInstance) {
            mapInstance.getCanvas().style.cursor = '';
          }
        });
      }
    });
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [deliveries, mapConfig?.apiKey]);
  
  const formatStatus = (status: string): string => {
    switch (status) {
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
  };
  
  const getColorForStatus = (status: string): string => {
    switch (status) {
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
  };
  
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
  
  return <div ref={mapContainer} className="h-full min-h-[500px] w-full rounded-md" />;
};

export default DeliveryMap;
