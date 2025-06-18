import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { filterDeliveries } from '@/features/deliveries/utils/deliveryUtils';
import { Loader2, MapPin, Filter, X, Activity, TrendingUp, Route, Package, Map as MapIcon } from 'lucide-react';
import OpenStreetMap from '@/components/map/OpenStreetMap';
import { RouteHeatMap } from '@/components/map/RouteHeatMap';
import { RouteDensityAnalysis } from '@/components/analytics/RouteDensityAnalysis';
import type { DeliveryData, DeliveryFilters } from '@/features/deliveries/types';

const DeliveryAnalysis: React.FC = () => {
  const { deliveryData, loading } = useDeliveryData();
  const { toast } = useToast();

  // Map filter states
  const [filters, setFilters] = useState<DeliveryFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('DeliveryAnalysis - Component mounted/updated');
    console.log('- deliveryData:', deliveryData?.length || 0, 'items');
    console.log('- loading:', loading);
    console.log('- filters:', filters);
    console.log('- showFilters:', showFilters);
  }, [deliveryData, loading, filters, showFilters]);

  // Filtered data for the map
  const filteredDeliveryData = useMemo(() => {
    try {
      if (!deliveryData || deliveryData.length === 0) {
        console.log('No delivery data available for filtering');
        return [];
      }
      
      return deliveryData.filter(delivery => {
        const matchesDriver = !filters.driverId || delivery.driverName === filters.driverId;
        const matchesCustomer = !filters.customerId || delivery.customerName === filters.customerId;
        const matchesStatus = !filters.status || delivery.status === filters.status;
        
        return matchesDriver && matchesCustomer && matchesStatus;
      });
    } catch (error) {
      console.error('Error filtering deliveries:', error);
      return deliveryData || [];
    }
  }, [deliveryData, filters]);
  
  // Extract unique drivers and customers for filters
  const drivers = useMemo(() => {
    try {
      if (!deliveryData || deliveryData.length === 0) return [];
      return Array.from(new Set(deliveryData.map(d => d.driverName).filter(Boolean)));
    } catch (error) {
      console.error('Error extracting drivers:', error);
      return [];
    }
  }, [deliveryData]);
  
  const customers = useMemo(() => {
    try {
      if (!deliveryData || deliveryData.length === 0) return [];
      return Array.from(new Set(deliveryData.map(d => d.customerName).filter(Boolean)));
    } catch (error) {
      console.error('Error extracting customers:', error);
      return [];
    }
  }, [deliveryData]);

  // Converter para formato DeliveryData para o heat map
  const deliveryRecords: DeliveryData[] = (deliveryData || []).map(delivery => ({
    id: delivery.id,
    customer_name: delivery.customerName,
    delivering_driver: delivery.driverName,
    collecting_driver: delivery.driverName,
    pickup_address: delivery.address,
    delivery_address: delivery.address,
    status: delivery.status,
    delivered_at: delivery.deliveryTime,
    pickup_lat: delivery.latitude,
    pickup_lng: delivery.longitude,
    delivery_lat: delivery.latitude,
    delivery_lng: delivery.longitude,
  }));

  // Estatísticas para o heat map
  const validDeliveries = deliveryRecords.filter(
    delivery => delivery.pickup_lat && delivery.pickup_lng && delivery.delivery_lat && delivery.delivery_lng
  );
  
  const totalDeliveries = deliveryRecords.length;
  const geocodedDeliveries2 = validDeliveries.length;
  const geocodingRate = totalDeliveries > 0 ? Math.round((geocodedDeliveries2 / totalDeliveries) * 100) : 0;

  // Estatísticas dos motoristas para o heat map - usando contagem de job_ids únicos
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

  // Map filter functions
  const handleFilterChange = (key: keyof DeliveryFilters, value: any) => {
    try {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Error changing filter:', error, { key, value });
      toast({
        title: 'Error',
        description: 'An error occurred while applying the filter. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const clearFilters = () => {
    try {
      setFilters({});
    } catch (error) {
      console.error('Error clearing filters:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while clearing filters.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading delivery data...</span>
        </div>
      </div>
    );
  }

  // Error safety wrapper
  const renderWithErrorBoundary = (component: React.ReactNode) => {
    try {
      return component;
    } catch (error) {
      console.error('Render error:', error);
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600 font-semibold">Rendering error</p>
              <p className="text-muted-foreground mt-2">
                An error occurred while displaying this section. Check the console for more details.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return renderWithErrorBoundary(
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Delivery Analysis</h1>
        <p className="text-muted-foreground">
          Interactive map and heat map of routes for complete delivery visualization
        </p>
      </div>

      {/* Sistema de Abas */}
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapIcon className="h-4 w-4" />
            Interactive Map
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Heat Map of Routes
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Interactive Map */}
        <TabsContent value="map" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Interactive Map</h2>
              <p className="text-muted-foreground">Visualize all delivery locations and their routes on the map.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Active filters counter */}
              {Object.values(filters).filter(Boolean).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(Boolean).length} active filter(s)
                </Badge>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={16} />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>
          </div>
          
          {/* Check if there's data available */}
          {!deliveryData || deliveryData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No data available</h3>
                  <p className="text-muted-foreground">
                    No delivery data is available to display on the map. 
                    Please ensure that the data has been loaded correctly.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {showFilters && (
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Filters</CardTitle>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                        <X size={16} className="mr-1" />
                        Clear
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Driver</label>
                        <Select
                          value={filters.driverId || "all"}
                          onValueChange={(value) => handleFilterChange('driverId', value === "all" ? undefined : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All drivers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All drivers</SelectItem>
                            {drivers.map(driver => (
                              <SelectItem key={driver} value={driver}>
                                {driver}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Customer</label>
                        <Select
                          value={filters.customerId || "all"}
                          onValueChange={(value) => handleFilterChange('customerId', value === "all" ? undefined : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All customers" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All customers</SelectItem>
                            {customers.map(customer => (
                              <SelectItem key={customer} value={customer}>
                                {customer}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                          value={filters.status || "all"}
                          onValueChange={(value) => handleFilterChange('status', value === "all" ? undefined : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All statuses" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Map Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Filtered</p>
                        <p className="text-2xl font-bold">{filteredDeliveryData.length}</p>
                      </div>
                      <MapPin className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Delivered</p>
                        <p className="text-2xl font-bold">
                          {filteredDeliveryData.filter(d => d.status === 'delivered').length}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">In Transit</p>
                        <p className="text-2xl font-bold">
                          {filteredDeliveryData.filter(d => d.status === 'in_transit').length}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold">
                          {filteredDeliveryData.filter(d => d.status === 'pending').length}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Delivery Map */}
              <OpenStreetMap deliveries={filteredDeliveryData} />
            </>
          )}
        </TabsContent>

        {/* Aba 2: Heat Map of Routes */}
        <TabsContent value="heatmap" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Heat Map of Routes</h2>
            <p className="text-muted-foreground">
              Visualize route delivery density and identify high traffic areas
            </p>
          </div>

          {/* Analytics Cards of Heat Map */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeliveries.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {geocodedDeliveries2} geocoded
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {foxDeliveries.length > 0 ? 
                    Math.round((foxDeliveries.filter(d => d.status === 'delivered').length / foxDeliveries.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Delivery success rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Heat Map */}
          <RouteHeatMap deliveries={foxDeliveries} className="col-span-full" />

          {/* Route Density Analysis */}
          <RouteDensityAnalysis deliveries={foxDeliveries} />

          {/* Top Drivers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Top Drivers
              </CardTitle>
              <CardDescription>
                Drivers with highest delivery volume
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
                        {geocodedDeliveries2 > 0 ? Math.round((count / geocodedDeliveries2) * 100) : 0}%
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveryAnalysis; 