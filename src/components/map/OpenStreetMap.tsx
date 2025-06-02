import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, EyeOff, Search } from 'lucide-react';
import AddressSearch from './AddressSearch';
import type { DeliveryData } from '@/features/deliveries/types';

// Fix for default icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface OpenStreetMapProps {
  deliveries: DeliveryData[];
  className?: string;
}

// Custom marker icons for different statuses
const createCustomIcon = (status: string) => {
  const colors = {
    delivered: '#10b981',
    pending: '#f59e0b',
    in_transit: '#3b82f6',
    failed: '#ef4444'
  };
  
  const color = colors[status as keyof typeof colors] || '#6b7280';
  
  return new L.DivIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13]
  });
};

// Component to handle map navigation
const MapController: React.FC<{ 
  deliveries: DeliveryData[];
  searchLocation?: { latitude: number; longitude: number } | null;
}> = ({ deliveries, searchLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (searchLocation) {
      map.setView([searchLocation.latitude, searchLocation.longitude], 15);
    } else if (deliveries.length > 0) {
      const validDeliveries = deliveries.filter(d => d.latitude && d.longitude);
      if (validDeliveries.length > 0) {
        const bounds = L.latLngBounds(
          validDeliveries.map(d => [d.latitude, d.longitude])
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [deliveries, searchLocation, map]);
  
  return null;
};

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ 
  deliveries, 
  className = "" 
}) => {
  const [layersVisible, setLayersVisible] = useState({
    delivered: true,
    pending: true,
    in_transit: true,
    failed: true
  });
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Get status label in Portuguese
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'delivered': return 'Entregue';
      case 'pending': return 'Pendente';
      case 'in_transit': return 'Em Trânsito';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  // Get color for delivery status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered': return '#10b981'; // Green
      case 'pending': return '#f59e0b'; // Yellow
      case 'in_transit': return '#3b82f6'; // Blue
      case 'failed': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  // Toggle layer visibility
  const toggleLayer = (status: keyof typeof layersVisible) => {
    setLayersVisible(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Filter deliveries by status and visibility
  const getVisibleDeliveries = (status: string) => {
    return deliveries.filter(d => 
      d.status === status && 
      layersVisible[status as keyof typeof layersVisible] &&
      d.latitude && 
      d.longitude
    );
  };

  // Handle location selection from search
  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setSearchLocation({ latitude: location.latitude, longitude: location.longitude });
    setShowSearch(false);
  };

  // Calculate statistics
  const stats = {
    total: deliveries.length,
    delivered: deliveries.filter(d => d.status === 'delivered').length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    in_transit: deliveries.filter(d => d.status === 'in_transit').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
  };

  // Dublin center coordinates
  const dublinCenter: [number, number] = [53.349805, -6.26031];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa Interativo de Entregas
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {showSearch ? 'Ocultar Busca' : 'Buscar Local'}
          </Button>
        </div>
        
        {/* Address Search */}
        {showSearch && (
          <div className="mt-4">
            <AddressSearch
              onLocationSelect={handleLocationSelect}
              placeholder="Buscar endereço em Dublin..."
              className="w-full max-w-md"
            />
          </div>
        )}
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">{stats.total}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">{stats.delivered}</div>
            <div className="text-muted-foreground">Entregues</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{stats.in_transit}</div>
            <div className="text-muted-foreground">Em Trânsito</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-yellow-600">{stats.pending}</div>
            <div className="text-muted-foreground">Pendentes</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-red-600">{stats.failed}</div>
            <div className="text-muted-foreground">Falharam</div>
          </div>
        </div>

        {/* Layer Controls */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(layersVisible).map(([status, visible]) => (
            <Button
              key={status}
              variant={visible ? "default" : "outline"}
              size="sm"
              onClick={() => toggleLayer(status as keyof typeof layersVisible)}
              className="flex items-center gap-1"
            >
              {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getStatusColor(status) }}
              />
              {getStatusLabel(status)}
              <Badge variant="secondary" className="ml-1">
                {stats[status as keyof typeof stats]}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden border">
          <MapContainer
            center={dublinCenter}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* Base map layers */}
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="OpenStreetMap">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* Delivery markers by status */}
            {['delivered', 'pending', 'in_transit', 'failed'].map(status => 
              getVisibleDeliveries(status).map(delivery => (
                <Marker
                  key={delivery.id}
                  position={[delivery.latitude, delivery.longitude]}
                  icon={createCustomIcon(delivery.status)}
                >
                  <Popup>
                    <div className="p-2 max-w-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getStatusColor(delivery.status) }}
                        />
                        <span className="font-semibold text-sm">
                          {getStatusLabel(delivery.status)}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div><strong>Cliente:</strong> {delivery.customerName}</div>
                        <div><strong>Motorista:</strong> {delivery.driverName}</div>
                        <div><strong>Endereço:</strong> {delivery.address}, {delivery.city}</div>
                        <div>
                          <strong>Data:</strong> {new Date(delivery.deliveryTime).toLocaleString('pt-BR')}
                        </div>
                        {delivery.rating && (
                          <div><strong>Avaliação:</strong> {delivery.rating}⭐</div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            )}

            {/* Map Controller */}
            <MapController 
              deliveries={deliveries.filter(d => d.latitude && d.longitude)} 
              searchLocation={searchLocation}
            />
          </MapContainer>
        </div>

        {/* Map Info */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            🗺️ Powered by OpenStreetMap - Dados geográficos gratuitos e colaborativos
          </p>
          <p>
            📍 Total de {deliveries.filter(d => d.latitude && d.longitude).length} entregas geocodificadas de {deliveries.length}
          </p>
          {searchLocation && (
            <p>
              🎯 Localização pesquisada: {searchLocation.latitude.toFixed(4)}, {searchLocation.longitude.toFixed(4)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenStreetMap; 