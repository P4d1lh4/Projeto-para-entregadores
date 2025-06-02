import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, Layers, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FoxDelivery } from '@/types/delivery';

type RouteHeatMapProps = {
  deliveries: FoxDelivery[];
  className?: string;
};

type HeatMapMode = 'pickup' | 'delivery' | 'both';
type HeatMapIntensity = 'low' | 'medium' | 'high';

interface HeatMapPoint {
  lat: number;
  lng: number;
  weight: number;
  type: 'pickup' | 'delivery';
  driver: string;
  address: string;
  status: string;
}

interface RouteData {
  from: [number, number];
  to: [number, number];
  driver: string;
  status: string;
}

// Component to fit map bounds
const FitBounds: React.FC<{ points: HeatMapPoint[] }> = ({ points }) => {
  const map = useMap();
  
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [points, map]);
  
  return null;
};

export const RouteHeatMap: React.FC<RouteHeatMapProps> = ({ deliveries, className }) => {
  const [heatMapMode, setHeatMapMode] = useState<HeatMapMode>('both');
  const [intensity, setIntensity] = useState<HeatMapIntensity>('medium');
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);

  // Get heat map data based on mode
  const getHeatMapData = (): HeatMapPoint[] => {
    const validDeliveries = deliveries.filter(
      delivery => delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng
    );

    const points: HeatMapPoint[] = [];

    validDeliveries.forEach((delivery) => {
      // Add pickup points
      if (heatMapMode === 'pickup' || heatMapMode === 'both') {
        points.push({
          lat: delivery.pickup_lat!,
          lng: delivery.pickup_lng!,
          weight: 1,
          type: 'pickup',
          driver: delivery.collecting_driver || 'Unknown',
          address: delivery.pickup_address || '',
          status: delivery.status || 'unknown',
        });
      }

      // Add delivery points
      if (heatMapMode === 'delivery' || heatMapMode === 'both') {
        points.push({
          lat: delivery.delivery_lat!,
          lng: delivery.delivery_lng!,
          weight: 1,
          type: 'delivery',
          driver: delivery.delivering_driver || 'Unknown',
          address: delivery.delivery_address || '',
          status: delivery.status || 'unknown',
        });
      }
    });

    return points;
  };

  // Get route lines data
  const getRouteData = (): RouteData[] => {
    if (!showRoutes) return [];
    
    const validDeliveries = deliveries.filter(
      delivery => delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng
    );

    return validDeliveries.map((delivery) => ({
      from: [delivery.pickup_lat!, delivery.pickup_lng!] as [number, number],
      to: [delivery.delivery_lat!, delivery.delivery_lng!] as [number, number],
      driver: delivery.delivering_driver || delivery.collecting_driver || 'Unknown',
      status: delivery.status || 'unknown',
    }));
  };

  // Get intensity configuration
  const getIntensityConfig = (intensity: HeatMapIntensity) => {
    switch (intensity) {
      case 'low':
        return { radius: 8, opacity: 0.4 };
      case 'medium':
        return { radius: 12, opacity: 0.6 };
      case 'high':
        return { radius: 16, opacity: 0.8 };
      default:
        return { radius: 12, opacity: 0.6 };
    }
  };

  // Get color for status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'in_transit': return '#3b82f6';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get color for point type
  const getTypeColor = (type: 'pickup' | 'delivery'): string => {
    return type === 'pickup' ? '#8b5cf6' : '#06b6d4';
  };

  const heatMapData = getHeatMapData();
  const routeData = getRouteData();
  const intensityConfig = getIntensityConfig(intensity);

  // Dublin center coordinates
  const dublinCenter: [number, number] = [53.349805, -6.26031];

  // Statistics
  const stats = {
    totalPoints: heatMapData.length,
    pickupPoints: heatMapData.filter(p => p.type === 'pickup').length,
    deliveryPoints: heatMapData.filter(p => p.type === 'delivery').length,
    routes: routeData.length,
    uniqueDrivers: [...new Set(heatMapData.map(p => p.driver))].length,
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Heat Map de Rotas de Entrega
        </CardTitle>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Modo do Heat Map</Label>
            <Select value={heatMapMode} onValueChange={(value: HeatMapMode) => setHeatMapMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Coletas</SelectItem>
                <SelectItem value="delivery">Entregas</SelectItem>
                <SelectItem value="both">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Intensidade</Label>
            <Select value={intensity} onValueChange={(value: HeatMapIntensity) => setIntensity(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-points"
              checked={showPoints}
              onCheckedChange={setShowPoints}
            />
            <Label htmlFor="show-points">Mostrar Pontos</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-routes"
              checked={showRoutes}
              onCheckedChange={setShowRoutes}
            />
            <Label htmlFor="show-routes">Mostrar Rotas</Label>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">{stats.totalPoints}</div>
            <div className="text-muted-foreground">Total Pontos</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-purple-600">{stats.pickupPoints}</div>
            <div className="text-muted-foreground">Coletas</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-cyan-600">{stats.deliveryPoints}</div>
            <div className="text-muted-foreground">Entregas</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{stats.routes}</div>
            <div className="text-muted-foreground">Rotas</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">{stats.uniqueDrivers}</div>
            <div className="text-muted-foreground">Motoristas</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Coletas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span>Entregas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-1 bg-blue-500"></div>
            <span>Rotas</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {deliveries.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado de entrega disponível para exibir o heat map.
            </AlertDescription>
          </Alert>
        ) : heatMapData.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Nenhuma entrega possui coordenadas válidas para exibir o heat map.
            </AlertDescription>
          </Alert>
        ) : (
          <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden border">
            <MapContainer
              center={dublinCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              {/* Base map - dark theme for better heat map visibility */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              />

              {/* Route lines */}
              {showRoutes && routeData.map((route, index) => (
                <Polyline
                  key={`route-${index}`}
                  positions={[route.from, route.to]}
                  color={getStatusColor(route.status)}
                  weight={2}
                  opacity={0.6}
                />
              ))}

              {/* Heat map points */}
              {showPoints && heatMapData.map((point, index) => (
                <CircleMarker
                  key={`point-${index}`}
                  center={[point.lat, point.lng]}
                  radius={intensityConfig.radius}
                  fillColor={getTypeColor(point.type)}
                  color="white"
                  weight={1}
                  opacity={intensityConfig.opacity}
                  fillOpacity={intensityConfig.opacity}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <div className="font-medium">
                        {point.type === 'pickup' ? '📦 Coleta' : '🚚 Entrega'}
                      </div>
                      <div><strong>Motorista:</strong> {point.driver}</div>
                      <div><strong>Endereço:</strong> {point.address}</div>
                      <div><strong>Status:</strong> {point.status}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Fit bounds to show all points */}
              <FitBounds points={heatMapData} />
            </MapContainer>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            🗺️ Powered by OpenStreetMap - Visualização de densidade de rotas
          </p>
          <p>
            📊 Mostrando {stats.totalPoints} pontos de {stats.uniqueDrivers} motoristas diferentes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 