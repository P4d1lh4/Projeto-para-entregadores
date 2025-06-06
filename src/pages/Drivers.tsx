import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Loader2, Filter, Search, Users, TrendingUp, Clock, MapPin, Package, Calendar, Award, Euro, Navigation } from 'lucide-react';
import { 
  calculateSuccessRate,
  calculateAverageDeliveryTime 
} from '@/features/dashboard/utils/calculations';
import type { DriverData, DeliveryData } from '@/features/deliveries/types';
import { differenceInMinutes, parseISO, isAfter, subDays } from 'date-fns';

// Enhanced driver interface for detailed statistics
interface EnhancedDriverData {
  id: string;
  name: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  pendingDeliveries: number;
  inTransitDeliveries: number;
  successRate: number;
  averageTime: number; // in minutes
  totalRevenue: number;
  uniqueCustomers: number;
  recentDeliveries: number; // last 7 days
  lastDeliveryDate?: string;
  deliveries: DeliveryData[]; // All deliveries for this driver
}

type DriversProps = {
  driverData?: DriverData[];
};

const Drivers: React.FC<DriversProps> = ({ driverData: propDriverData }) => {
  const { deliveryData, driverData: hookDriverData, loading, error } = useDeliveryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [minDeliveries, setMinDeliveries] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<EnhancedDriverData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use prop data if available, otherwise hook data
  const fallbackDrivers = propDriverData && propDriverData.length > 0 ? propDriverData : hookDriverData;
  
  // Enhanced driver processing - extract drivers based 100% on job_id
  const enhancedDrivers = useMemo(() => {
    if (!deliveryData || deliveryData.length === 0) {
      // Fallback to basic driver data if no delivery data available
      return fallbackDrivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        totalDeliveries: driver.deliveries || 0,
        successfulDeliveries: Math.round((driver.deliveries || 0) * (driver.successRate || 0)),
        failedDeliveries: 0,
        pendingDeliveries: 0,
        inTransitDeliveries: 0,
        successRate: (driver.successRate || 0) * 100,
        averageTime: (driver.averageTime || 0) * 60, // Convert to minutes
        totalRevenue: 0,
        uniqueCustomers: 0,
        recentDeliveries: 0,
        deliveries: []
      }));
    }

    // Extract drivers - avoid duplicates when same driver name has different job_ids
    const driverNameMap = new Map<string, Set<string>>(); // name -> job_ids
    const driverMap = new Map<string, EnhancedDriverData>(); // unique driver key -> data

    // First pass: map driver names to job_ids to identify duplicates
    deliveryData.forEach(delivery => {
      const jobId = (delivery as any).job_id || delivery.id;
      const collectingDriver = (delivery as any).delivering_driver || 
                              (delivery as any).collecting_driver ||
                              delivery.driverName;
      
      if (jobId && collectingDriver) {
        const normalizedName = String(collectingDriver).trim().toLowerCase();
        
        if (!driverNameMap.has(normalizedName)) {
          driverNameMap.set(normalizedName, new Set());
        }
        
        driverNameMap.get(normalizedName)!.add(String(jobId));
      }
    });

    console.log('📊 Driver deduplication mapping:', 
      Array.from(driverNameMap.entries()).map(([name, jobIds]) => ({
        name,
        jobIds: Array.from(jobIds),
        jobCount: jobIds.size
      }))
    );

    // Second pass: create driver data using the first job_id as unique key for each driver name
    deliveryData.forEach(delivery => {
      const jobId = (delivery as any).job_id || delivery.id;
      const driverDisplayName = (delivery as any).delivering_driver || 
                               (delivery as any).collecting_driver ||
                               delivery.driverName ||
                               `Driver-${jobId}`;

      if (!jobId) {
        console.warn('Delivery without job_id found, skipping:', delivery);
        return;
      }

      const normalizedName = String(driverDisplayName).trim().toLowerCase();
      
      // Find the primary job_id for this driver name (use the first one encountered)
      const jobIds = driverNameMap.get(normalizedName);
      if (!jobIds) return;
      
      const primaryJobId = Array.from(jobIds).sort()[0]; // Use first job_id alphabetically as primary key
      const driverKey = `${normalizedName}_${primaryJobId}`;
      
      if (!driverMap.has(driverKey)) {
        driverMap.set(driverKey, {
          id: driverKey,
          name: driverDisplayName,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          pendingDeliveries: 0,
          inTransitDeliveries: 0,
          successRate: 0,
          averageTime: 0,
          totalRevenue: 0,
          uniqueCustomers: 0,
          recentDeliveries: 0,
          deliveries: []
        });
      }

      const driver = driverMap.get(driverKey)!;
      driver.deliveries.push(delivery);
      driver.totalDeliveries++;

      // Count deliveries by status using same logic as other components
      const status = delivery.status || (delivery as any).status;
      if (status === 'delivered' || (delivery as any).delivered_at) {
        driver.successfulDeliveries++;
      } else if (status === 'failed') {
        driver.failedDeliveries++;
      } else if (status === 'pending') {
        driver.pendingDeliveries++;
      } else if (status === 'in_transit') {
        driver.inTransitDeliveries++;
      }

      // Add revenue
      if ((delivery as any).cost) {
        driver.totalRevenue += Number((delivery as any).cost) || 0;
      }

      // Count unique customers
      const customerName = delivery.customerName || (delivery as any).customer_name;
      if (customerName) {
        const customers = new Set(driver.deliveries.map(d => 
          d.customerName || (d as any).customer_name
        ).filter(Boolean));
        driver.uniqueCustomers = customers.size;
      }
    });

    // Calculate derived metrics for each driver
    const sevenDaysAgo = subDays(new Date(), 7);
    
    driverMap.forEach((driver) => {
      // Calculate success rate
      driver.successRate = driver.totalDeliveries > 0 
        ? (driver.successfulDeliveries / driver.totalDeliveries) * 100
        : 0;

      // Calculate average delivery time using same logic as other components
      let totalTimeMinutes = 0;
      let validTimeCount = 0;

      driver.deliveries.forEach(delivery => {
        if ((delivery as any).collected_at && (delivery as any).delivered_at) {
          try {
            const collectedTime = parseISO((delivery as any).collected_at);
            const deliveredTime = parseISO((delivery as any).delivered_at);
            const timeInMinutes = differenceInMinutes(deliveredTime, collectedTime);
            
            // Only include reasonable times (5 minutes to 8 hours)
            if (timeInMinutes > 5 && timeInMinutes < 480) {
              totalTimeMinutes += timeInMinutes;
              validTimeCount++;
            }
          } catch (e) {
            // Invalid dates, skip
          }
        }
      });

      driver.averageTime = validTimeCount > 0 ? Math.round(totalTimeMinutes / validTimeCount) : 0;

      // Count recent deliveries (last 7 days)
      driver.recentDeliveries = driver.deliveries.filter(delivery => {
        try {
          const deliveryDate = delivery.deliveryTime 
            ? parseISO(delivery.deliveryTime)
            : (delivery as any).created_at 
            ? parseISO((delivery as any).created_at)
            : null;
          
          return deliveryDate && isAfter(deliveryDate, sevenDaysAgo);
        } catch {
          return false;
        }
      }).length;

      // Find last delivery date
      const sortedDeliveries = driver.deliveries
        .map(d => d.deliveryTime || (d as any).created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      driver.lastDeliveryDate = sortedDeliveries[0] || undefined;
    });

    return Array.from(driverMap.values());
  }, [deliveryData, fallbackDrivers]);

  // Apply filters
  const filteredDrivers = useMemo(() => {
    return enhancedDrivers.filter(driver => {
      const nameMatch = !searchTerm || driver.name.toLowerCase().includes(searchTerm.toLowerCase());
      const deliveriesMatch = !minDeliveries || driver.totalDeliveries >= parseInt(minDeliveries);
      
      let statusMatch = true;
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'high-performer' && driver.successRate < 85) statusMatch = false;
        if (selectedStatus === 'active' && driver.recentDeliveries === 0) statusMatch = false;
        if (selectedStatus === 'needs-improvement' && driver.successRate >= 85) statusMatch = false;
      }
      
      return nameMatch && deliveriesMatch && statusMatch;
    });
  }, [enhancedDrivers, searchTerm, minDeliveries, selectedStatus]);

  // Calculate aggregated statistics using same methodology as Dashboard
  const aggregatedStats = useMemo(() => {
    if (!deliveryData || deliveryData.length === 0) {
      return {
        totalDrivers: enhancedDrivers.length,
        avgSuccessRate: 0,
        avgDeliveryTime: 0
      };
    }

    // Use enhanced drivers count instead of calculateActiveDrivers to avoid job_id dependency
    const totalDrivers = enhancedDrivers.length;
    const successRate = calculateSuccessRate(deliveryData);
    const avgDeliveryTimeHours = calculateAverageDeliveryTime(deliveryData);

    return {
      totalDrivers,
      avgSuccessRate: successRate,
      avgDeliveryTime: Math.round(avgDeliveryTimeHours * 60) // Convert hours to minutes
    };
  }, [deliveryData, enhancedDrivers.length]);

  const clearFilters = () => {
    setSearchTerm('');
    setMinDeliveries('');
    setSelectedStatus('all');
  };

  const hasFilters = searchTerm || minDeliveries || selectedStatus !== 'all';

  // Function to open driver details modal
  const openDriverDetails = (driver: EnhancedDriverData) => {
    setSelectedDriver(driver);
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
          <p className="text-destructive mb-2">Error loading driver data:</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Drivers Management</h1>
        <p className="text-muted-foreground">Manage and analyze driver performance with real-time data</p>
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search by name</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Enter driver name..."
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
                placeholder="e.g. 10"
                value={minDeliveries}
                onChange={(e) => setMinDeliveries(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="status">Performance Filter</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Drivers</option>
                <option value="high-performer">High Performers (≥85%)</option>
                <option value="active">Recently Active</option>
                <option value="needs-improvement">Needs Improvement (&lt;85%)</option>
              </select>
            </div>
          </div>
          
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{aggregatedStats.totalDrivers}</p>
                {hasFilters && enhancedDrivers.length !== filteredDrivers.length && (
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
                <p className="text-sm text-muted-foreground">Average Success Rate</p>
                <p className="text-2xl font-bold">{aggregatedStats.avgSuccessRate}%</p>
                <p className="text-xs text-muted-foreground">Across all drivers</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Delivery Time</p>
                <p className="text-2xl font-bold">{aggregatedStats.avgDeliveryTime}min</p>
                <p className="text-xs text-muted-foreground">From pickup to delivery</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Driver List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Driver Performance List</span>
            <Badge variant="outline">{filteredDrivers.length} drivers</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Driver Name</th>
                    <th className="text-left p-3 font-semibold">Total Deliveries</th>
                    <th className="text-left p-3 font-semibold">Success Rate</th>
                    <th className="text-left p-3 font-semibold">Avg Time</th>
                    <th className="text-left p-3 font-semibold">Revenue</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers
                    .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
                    .map((driver) => (
                      <tr 
                        key={driver.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openDriverDetails(driver)}
                        title="Click to view detailed statistics"
                      >
                        <td className="p-3">
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {driver.uniqueCustomers} customers
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{driver.totalDeliveries}</div>
                          <div className="text-sm text-muted-foreground">
                            {driver.recentDeliveries} recent
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              driver.successRate >= 90 ? "default" :
                              driver.successRate >= 75 ? "secondary" : "destructive"
                            }
                          >
                            {driver.successRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{driver.averageTime} min</span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">€{driver.totalRevenue.toFixed(2)}</span>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              driver.recentDeliveries > 0 ? "default" : "secondary"
                            }
                          >
                            {driver.recentDeliveries > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {hasFilters 
                ? 'No drivers found with the applied filters. Try adjusting your search criteria.'
                : 'No driver data available. Please import delivery data to see driver statistics.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Driver Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Driver Details: {selectedDriver?.name}
            </DialogTitle>
            <DialogDescription>
              Comprehensive performance analysis and delivery history
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedDriver.totalDeliveries}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Deliveries</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedDriver.successRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedDriver.averageTime} min
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Time</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      €{selectedDriver.totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Delivery Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Successful</span>
                        <Badge variant="default">
                          {selectedDriver.successfulDeliveries}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Failed</span>
                        <Badge variant="destructive">
                          {selectedDriver.failedDeliveries}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">In Transit</span>
                        <Badge variant="secondary">
                          {selectedDriver.inTransitDeliveries}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pending</span>
                        <Badge variant="outline">
                          {selectedDriver.pendingDeliveries}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Activity Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Unique Customers</span>
                        <Badge variant="outline">
                          {selectedDriver.uniqueCustomers}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Recent Deliveries (7d)</span>
                        <Badge variant="secondary">
                          {selectedDriver.recentDeliveries}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Performance Rating</span>
                        <Badge variant={selectedDriver.successRate >= 85 ? "default" : "secondary"}>
                          {selectedDriver.successRate >= 90 ? "Excellent" : 
                           selectedDriver.successRate >= 75 ? "Good" : "Needs Improvement"}
                        </Badge>
                      </div>
                      {selectedDriver.lastDeliveryDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Last Delivery</span>
                          <span className="text-sm">
                            {new Date(selectedDriver.lastDeliveryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Deliveries List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Deliveries
                    {selectedDriver.deliveries.length > 1 && (
                      <Badge variant="outline" className="ml-2">
                        Individual delivery times shown
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedDriver.deliveries
                      .sort((a, b) => new Date(b.deliveryTime || (b as any).created_at).getTime() - new Date(a.deliveryTime || (a as any).created_at).getTime())
                      .slice(0, 10)
                      .map((delivery, index) => {
                        // Calculate individual delivery time
                        let individualTime = null;
                        if ((delivery as any).collected_at && (delivery as any).delivered_at) {
                          try {
                            const collectedTime = parseISO((delivery as any).collected_at);
                            const deliveredTime = parseISO((delivery as any).delivered_at);
                            const timeInMinutes = differenceInMinutes(deliveredTime, collectedTime);
                            
                            // Only show reasonable times (5 minutes to 8 hours)
                            if (timeInMinutes > 5 && timeInMinutes < 480) {
                              individualTime = timeInMinutes;
                            }
                          } catch (e) {
                            // Invalid dates, skip
                          }
                        }

                        return (
                          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">
                                  {delivery.customerName || (delivery as any).customer_name || 'Customer'}
                                </div>
                                {selectedDriver.deliveries.length > 1 && individualTime && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {individualTime}min
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {delivery.address || (delivery as any).delivery_address || 'Address not available'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {delivery.deliveryTime 
                                  ? new Date(delivery.deliveryTime).toLocaleDateString() + ' ' + new Date(delivery.deliveryTime).toLocaleTimeString()
                                  : (delivery as any).created_at 
                                    ? new Date((delivery as any).created_at).toLocaleDateString() + ' ' + new Date((delivery as any).created_at).toLocaleTimeString()
                                    : 'Date not available'
                                }
                              </div>
                              {selectedDriver.deliveries.length > 1 && individualTime === null && (delivery.status === 'delivered' || (delivery as any).delivered_at) && (
                                <div className="text-xs text-orange-600 mt-1">
                                  Time data incomplete
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  delivery.status === 'delivered' || (delivery as any).delivered_at ? 'default' : 
                                  delivery.status === 'failed' ? 'destructive' : 'secondary'
                                }
                              >
                                {delivery.status || ((delivery as any).delivered_at ? 'delivered' : 'pending')}
                              </Badge>
                              {(delivery as any).cost && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  €{Number((delivery as any).cost).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    
                    {selectedDriver.deliveries.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No delivery history available</p>
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
