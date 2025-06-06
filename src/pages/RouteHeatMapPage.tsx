import React from 'react';
import { RouteHeatMap } from '@/components/map/RouteHeatMap';
import { RouteDensityAnalysis } from '@/components/analytics/RouteDensityAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Activity, TrendingUp, MapPin, Route, Package } from 'lucide-react';
import EmptyState from '@/components/dashboard/EmptyState';
import type { FoxDelivery } from '@/types/delivery';

const RouteHeatMapPage: React.FC = () => {
  const { deliveryData, loading, error } = useDeliveryData();

  // Convert DeliveryData to FoxDelivery format for heat map compatibility
  // Since the current data doesn't have coordinates, we'll show a message about this
  const foxDeliveries: FoxDelivery[] = deliveryData.map(delivery => ({
    id: delivery.id,
    customer_name: delivery.customerName,
    delivering_driver: delivery.driverName,
    collecting_driver: delivery.driverName,
    pickup_address: delivery.address,
    delivery_address: delivery.address,
    status: delivery.status,
    delivered_at: delivery.deliveryTime,
    // Note: Current data structure doesn't have separate pickup/delivery coordinates
    // These would need to be added through geocoding or data import
    pickup_lat: delivery.latitude,
    pickup_lng: delivery.longitude,
    delivery_lat: delivery.latitude,
    delivery_lng: delivery.longitude,
  }));

  // Calculate analytics using the converted data
  const validDeliveries = foxDeliveries.filter(
    delivery => delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng
  );

  const totalDeliveries = foxDeliveries.length;
  const geocodedDeliveries = validDeliveries.length;
  const geocodingRate = totalDeliveries > 0 ? Math.round((geocodedDeliveries / totalDeliveries) * 100) : 0;

  // Get unique drivers and their delivery counts - usando contagem de job_ids únicos
  const driverStats = validDeliveries.reduce((acc, delivery) => {
    const jobId = delivery.id || delivery.job_id;
    if (jobId) {
      const driver = delivery.delivering_driver || delivery.collecting_driver || 'Unknown';
      acc[driver] = (acc[driver] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topDrivers = Object.entries(driverStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate coverage areas (simplified)
  const pickupAreas = new Set(validDeliveries.map(d => d.pickup_address?.split(',')[0])).size;
  const deliveryAreas = new Set(validDeliveries.map(d => d.delivery_address?.split(',')[0])).size;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Route Heat Map</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || deliveryData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Route Heat Map</h1>
          <p className="text-muted-foreground">
            Visualize delivery route density and identify high-traffic areas
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Route Heat Map</h1>
        <p className="text-muted-foreground">
          Visualize delivery route density and identify high-traffic areas
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total of Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliveries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {geocodedDeliveries} geocoded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geocoding Rate</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geocodingRate}%</div>
            <Badge variant={geocodingRate > 80 ? "default" : geocodingRate > 50 ? "secondary" : "destructive"}>
              {geocodingRate > 80 ? "Excellent" : geocodingRate > 50 ? "Good" : "Low"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Areas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.max(pickupAreas, deliveryAreas)}</div>
            <p className="text-xs text-muted-foreground">
              {pickupAreas} pickups • {deliveryAreas} deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(driverStats).length}</div>
            <p className="text-xs text-muted-foreground">
              {topDrivers[0]?.[0]} leads with {topDrivers[0]?.[1]} deliveries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heat Map */}
      <RouteHeatMap deliveries={foxDeliveries} className="col-span-full" />

      {/* Route Density Analysis */}
      <RouteDensityAnalysis deliveries={foxDeliveries} />

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Top Drivers
            </CardTitle>
            <CardDescription>
              Drivers with the highest delivery volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDrivers.length > 0 ? (
                topDrivers.map(([driver, count], index) => (
                  <div key={driver} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{driver}</p>
                        <p className="text-sm text-muted-foreground">{count} deliveries</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {geocodedDeliveries > 0 ? Math.round((count / geocodedDeliveries) * 100) : 0}%
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Heat Map Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Heat Map Insights
            </CardTitle>
            <CardDescription>
              Analysis of route density patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {geocodingRate > 50 ? (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="font-medium text-blue-900">High Density Zones</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Areas with higher concentration of deliveries indicate main business corridors
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <h4 className="font-medium text-green-900">Optimization Opportunities</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Routes with low density can be consolidated for greater efficiency
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <h4 className="font-medium text-yellow-900">Expansion Opportunities</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Areas without coverage represent growth opportunities
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <h4 className="font-medium text-orange-900">Insufficient Data</h4>
                  <p className="text-sm text-muted-foreground">
                    For a complete heat map analysis, it's necessary to geocode more addresses or import data with coordinates.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RouteHeatMapPage; 