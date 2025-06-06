import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Loader2, Filter, Search, Users, TrendingUp, Clock, MapPin, Package, Calendar, Phone, Mail, Award } from 'lucide-react';
import { calculateActiveDrivers } from '@/features/dashboard/utils/calculations';
import type { DriverData, DeliveryData } from '@/features/deliveries/types';

interface DetailedDriverStats {
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
  pendingCount: number;
  inTransitCount: number;
  recentDeliveries: number;
  uniqueCustomers: number;
  deliveries: DeliveryData[];
}

interface DetailedDriverData extends DriverData {
  detailedStats?: DetailedDriverStats;
}

type DriversProps = {
  driverData?: DriverData[];
};

const Drivers: React.FC<DriversProps> = ({ driverData: propDriverData }) => {
  const { deliveryData, driverData: hookDriverData, loading, error } = useDeliveryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [minDeliveries, setMinDeliveries] = useState('');
  
  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<DetailedDriverData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use prop data if available, otherwise hook data
  const drivers = propDriverData && propDriverData.length > 0 ? propDriverData : hookDriverData;
  
  console.log('🚛 DRIVERS: Rendering with', drivers.length, 'drivers');

  // The `drivers` array is already deduplicated by `calculateDriverMetrics`.
  // Using its length directly ensures consistency between the stat card and the table.
  const actualTotalDrivers = drivers.length;

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const nameMatch = !searchTerm || driver.name.toLowerCase().includes(searchTerm.toLowerCase());
      const deliveriesMatch = !minDeliveries || (driver.deliveries && driver.deliveries >= parseInt(minDeliveries));
      
      return nameMatch && deliveriesMatch;
    });
  }, [drivers, searchTerm, minDeliveries]);

  const stats = useMemo(() => {
    if (filteredDrivers.length === 0) {
      return { avgSuccessRate: 0, avgTime: 0, totalDrivers: actualTotalDrivers };
    }

    // Calculate more accurate success rates using actual delivery data
    let totalDeliveries = 0;
    let totalSuccessfulDeliveries = 0;
    let totalTime = 0;
    let timeCount = 0;

    filteredDrivers.forEach(driver => {
      // Get deliveries for this driver to calculate accurate success rate
      const driverDeliveries = deliveryData ? deliveryData.filter(delivery => 
        delivery.driverId === driver.id || 
        delivery.driverName === driver.name ||
        (delivery as any).collecting_driver === driver.name ||
        (delivery as any).delivering_driver === driver.name
      ) : [];

      if (driverDeliveries.length > 0) {
        // Use actual delivery data for more precise calculations
        const successfulCount = driverDeliveries.filter(d => {
          const status = d.status || (d as any).status;
          return status === 'delivered' || 
                 status === 'Delivered' ||
                 (d as any).delivered_at; // Alternative check: has delivered timestamp
        }).length;

        totalDeliveries += driverDeliveries.length;
        totalSuccessfulDeliveries += successfulCount;

        // Calculate actual delivery times when available
        driverDeliveries.forEach(delivery => {
          if ((delivery as any).collected_at && (delivery as any).delivered_at) {
            try {
              const collectedTime = new Date((delivery as any).collected_at);
              const deliveredTime = new Date((delivery as any).delivered_at);
              const timeInMinutes = (deliveredTime.getTime() - collectedTime.getTime()) / (1000 * 60);
              
              // Only include reasonable times (5 minutes to 8 hours)
              if (timeInMinutes > 5 && timeInMinutes < 480) {
                totalTime += timeInMinutes;
                timeCount++;
              }
            } catch (e) {
              // Invalid dates, skip
            }
          }
        });
      } else {
        // Fallback to driver.successRate if no delivery data available
        if (driver.deliveries && driver.successRate) {
          totalDeliveries += driver.deliveries;
          totalSuccessfulDeliveries += Math.round(driver.deliveries * driver.successRate);
        }

        if (driver.averageTime) {
          totalTime += driver.averageTime;
          timeCount++;
        }
      }
    });

    const avgSuccessRate = totalDeliveries > 0 ? totalSuccessfulDeliveries / totalDeliveries : 0;
    const avgTime = timeCount > 0 ? totalTime / timeCount : 0;

    return { 
      avgSuccessRate, 
      avgTime: Math.round(avgTime), 
      totalDrivers: actualTotalDrivers 
    };
  }, [filteredDrivers, actualTotalDrivers, deliveryData]);

  const clearFilters = () => {
    setSearchTerm('');
    setMinDeliveries('');
  };

  const hasFilters = searchTerm || minDeliveries;

  // Function to get detailed driver information
  const getDriverDetails = (driver: DriverData): DetailedDriverData => {
    // Get deliveries for this specific driver (if deliveryData is available)
    const driverDeliveries = deliveryData ? deliveryData.filter(delivery => 
      delivery.driverId === driver.id || delivery.driverName === driver.name
    ) : [];

    // Calculate detailed statistics
    const totalDeliveries = driverDeliveries.length;
    const deliveredCount = driverDeliveries.filter(d => d.status === 'delivered').length;
    const failedCount = driverDeliveries.filter(d => d.status === 'failed').length;
    const pendingCount = driverDeliveries.filter(d => d.status === 'pending').length;
    const inTransitCount = driverDeliveries.filter(d => d.status === 'in_transit').length;

    // Recent deliveries (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentDeliveries = driverDeliveries.filter(d => {
      try {
        return d.deliveryTime && new Date(d.deliveryTime) >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    // Get unique customers
    const uniqueCustomers = new Set(driverDeliveries.map(d => d.customerName).filter(Boolean));

    return {
      ...driver,
      detailedStats: {
        totalDeliveries: totalDeliveries || driver.deliveries || 0,
        deliveredCount,
        failedCount,
        pendingCount,
        inTransitCount,
        recentDeliveries: recentDeliveries.length,
        uniqueCustomers: uniqueCustomers.size,
        deliveries: driverDeliveries.sort((a, b) => {
          try {
            return new Date(b.deliveryTime).getTime() - new Date(a.deliveryTime).getTime();
          } catch {
            return 0;
          }
        }).slice(0, 10) // Last 10 deliveries
      }
    };
  };

  // Function to open driver details modal
  const openDriverDetails = (driver: DriverData) => {
    const detailedDriver = getDriverDetails(driver);
    setSelectedDriver(detailedDriver);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading driver data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <p className="text-muted-foreground">Unable to load driver data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drivers</h1>
        <p className="text-muted-foreground">Manage and analyze driver performance</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search by name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Enter name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="minDeliveries">Minimum Deliveries</Label>
              <Input
                id="minDeliveries"
                type="number"
                min="0"
                placeholder="Ex: 10"
                value={minDeliveries}
                onChange={(e) => setMinDeliveries(e.target.value)}
              />
            </div>
          </div>
          
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
                {hasFilters && drivers.length !== filteredDrivers.length && (
                  <p className="text-xs text-blue-600">{filteredDrivers.length} showing</p>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{(stats.avgSuccessRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Time</p>
                <p className="text-2xl font-bold">{stats.avgTime.toFixed(0)}min</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Deliveries</th>
                    <th className="text-left p-2">Success Rate</th>
                    <th className="text-left p-2">Average Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers
                    .sort((a, b) => (b.deliveries || 0) - (a.deliveries || 0))
                    .map((driver) => (
                      <tr 
                        key={driver.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openDriverDetails(driver)}
                        title="Click to view details"
                      >
                        <td className="p-2 font-medium">{driver.name}</td>
                        <td className="p-2">{driver.deliveries || 0}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            (driver.successRate || 0) >= 0.8 
                              ? 'bg-green-100 text-green-800'
                              : (driver.successRate || 0) >= 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {((driver.successRate || 0) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2">{(driver.averageTime || 0).toFixed(0)} min</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {hasFilters 
                ? 'No driver found with the applied filters.'
                : 'No driver data available.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Driver Details: {selectedDriver?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed statistics and delivery history
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-6">
              {/* Driver Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    General Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedDriver.detailedStats?.totalDeliveries || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Deliveries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {((selectedDriver.successRate || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(selectedDriver.averageTime || 0).toFixed(0)} min
                      </div>
                      <div className="text-sm text-muted-foreground">Average Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Delivery Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <Badge variant="default">
                          {selectedDriver.detailedStats?.deliveredCount || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Failed</span>
                        <Badge variant="destructive">
                          {selectedDriver.detailedStats?.failedCount || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">In Transit</span>
                        <Badge variant="secondary">
                          {selectedDriver.detailedStats?.inTransitCount || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pending</span>
                        <Badge variant="outline">
                          {selectedDriver.detailedStats?.pendingCount || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Position in ranking</span>
                        <Badge variant="secondary">
                          #{filteredDrivers.findIndex(d => d.id === selectedDriver.id) + 1} of {filteredDrivers.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={selectedDriver.successRate >= 0.8 ? "default" : "secondary"}>
                          {selectedDriver.successRate >= 0.8 ? "Excellent" : selectedDriver.successRate >= 0.6 ? "Good" : "Needs improvement"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recent deliveries (7d)</span>
                        <Badge variant="outline">
                          {selectedDriver.detailedStats?.recentDeliveries || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unique customers</span>
                        <Badge variant="outline">
                          {selectedDriver.detailedStats?.uniqueCustomers || 0}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Deliveries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedDriver.detailedStats?.deliveries?.map((delivery, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{delivery.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {delivery.deliveryTime ? new Date(delivery.deliveryTime).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={
                              delivery.status === 'delivered' ? 'default' : 
                              delivery.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {delivery.status}
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-4">
                        No delivery found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;
