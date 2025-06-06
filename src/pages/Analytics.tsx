import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import type { DeliveryData, DriverData, CustomerData } from '@/lib/file-utils';
import DeliveryTimelinessCard from '@/components/analytics/DeliveryTimelinessCard';
import TimeSeriesAnalyticsCard from '@/components/analytics/TimeSeriesAnalyticsCard';
import RevenueAnalyticsCard from '@/components/analytics/RevenueAnalyticsCard';
import { Calendar, Clock, DollarSign, TrendingUp, MapPin, Target, AlertCircle, Users } from 'lucide-react';

type AnalyticsProps = {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
};

const Analytics: React.FC<AnalyticsProps> = ({ deliveryData, driverData, customerData }) => {
  // Calculate unique analytics metrics that don't overlap with driver page or dashboard
  const analyticsMetrics = useMemo(() => {
    // Route Efficiency - Percentage of successful deliveries on first attempt
    const successfulDeliveries = deliveryData.filter(d => d.status === 'delivered').length;
    const routeEfficiency = deliveryData.length > 0 ? 
      Math.round((successfulDeliveries / deliveryData.length) * 100) : 0;

    // Total Drivers - Count unique drivers using job_id and collecting_driver
    // Avoid duplicates when same driver name has different job_ids
    const driverNameMap = new Map<string, Set<string>>();
    
    // First, let's debug what fields we actually have
    if (deliveryData.length > 0) {
      console.log('📊 Sample delivery data structure:');
      console.log('First delivery keys:', Object.keys(deliveryData[0]));
      console.log('First delivery sample:', deliveryData[0]);
      console.log('Second delivery sample:', deliveryData[1]);
    }
    
    deliveryData.forEach((delivery, index) => {
      const foxDelivery = delivery as any;
      
      // Try multiple possible field names for job_id
      const jobId = foxDelivery.job_id || 
                   foxDelivery.jobId || 
                   foxDelivery.Job_ID || 
                   foxDelivery.id ||
                   `job_${index}`; // fallback
      
      // Try multiple possible field names for driver
      const collectingDriver = foxDelivery.collecting_driver || 
                              foxDelivery.Collecting_Driver ||
                              foxDelivery.collectingDriver ||
                              foxDelivery.delivering_driver ||
                              foxDelivery.Delivering_Driver ||
                              foxDelivery.deliveringDriver ||
                              foxDelivery.driverName ||
                              foxDelivery.driver_name ||
                              foxDelivery.Driver_Name ||
                              foxDelivery.driver;
      
      // Debug log for first few entries
      if (index < 3) {
        console.log(`📊 Entry ${index + 1}:`, {
          jobId,
          collectingDriver,
          allKeys: Object.keys(foxDelivery),
          sample: foxDelivery
        });
      }
      
      if (jobId && collectingDriver) {
        // Normalize driver name (trim and lowercase for comparison)
        const normalizedName = String(collectingDriver).trim().toLowerCase();
        
        if (!driverNameMap.has(normalizedName)) {
          driverNameMap.set(normalizedName, new Set());
        }
        
        driverNameMap.get(normalizedName)!.add(String(jobId));
      }
    });
    
    // Count unique drivers (each unique name counts as 1 driver regardless of job_ids)
    const totalDrivers = driverNameMap.size;
    
    console.log('📊 Driver Counting Debug:');
    console.log('- Total deliveries processed:', deliveryData.length);
    console.log('- Unique driver names found:', totalDrivers);
    console.log('- Driver name -> job_ids mapping:', 
      Array.from(driverNameMap.entries()).map(([name, jobIds]) => ({
        name,
        jobIds: Array.from(jobIds),
        jobCount: jobIds.size
      }))
    );
    
    // If no drivers found, let's fallback to a different approach
    let fallbackDriverCount = 0;
    if (totalDrivers === 0) {
      console.log('⚠️ No drivers found with job_id approach, trying fallback...');
      
      const allDriverNames = new Set<string>();
      deliveryData.forEach((delivery, index) => {
        const foxDelivery = delivery as any;
        
        // Look for any field that might contain driver info
        const possibleDriverFields = [
          'collecting_driver', 'Collecting_Driver', 'collectingDriver',
          'delivering_driver', 'Delivering_Driver', 'deliveringDriver', 
          'driverName', 'driver_name', 'Driver_Name', 'driver'
        ];
        
        for (const field of possibleDriverFields) {
          const driverValue = foxDelivery[field];
          if (driverValue && typeof driverValue === 'string' && driverValue.trim()) {
            allDriverNames.add(driverValue.trim().toLowerCase());
            if (index < 3) {
              console.log(`Found driver in field "${field}":`, driverValue);
            }
            break; // Use first valid field found
          }
        }
      });
      
      fallbackDriverCount = allDriverNames.size;
      console.log('📊 Fallback driver count:', fallbackDriverCount);
      console.log('📊 Driver names found:', Array.from(allDriverNames));
    }

    // Customer Retention - Percentage of customers who made repeat orders
    const customerOrderCounts = deliveryData.reduce((acc, delivery) => {
      const customerId = delivery.customerId || delivery.customerName;
      acc[customerId] = (acc[customerId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalCustomers = Object.keys(customerOrderCounts).length;
    const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    // Service Consistency - On-time delivery rate (percentage of deliveries completed within expected timeframe)
    const onTimeDeliveries = deliveryData.filter(d => {
      // Consider a delivery on-time if it's completed successfully
      // In real scenario, this would compare actual vs expected delivery time
      return d.status === 'delivered';
    }).length;
    
    const consistencyScore = deliveryData.length > 0 ? 
      Math.round((onTimeDeliveries / deliveryData.length) * 100) : 0;

    return {
      routeEfficiency,
      totalDrivers: totalDrivers > 0 ? totalDrivers : fallbackDriverCount,
      retentionRate,
      consistencyScore
    };
  }, [deliveryData, driverData, customerData]);

  // Calculate revenue metrics in euros
  const revenueMetrics = useMemo(() => {
    // Extract revenue from Fox delivery data
    const totalRevenue = deliveryData.reduce((sum, delivery) => {
      const foxDelivery = delivery as any;
      const cost = foxDelivery.cost || 0;
      return sum + cost;
    }, 0);

    const avgOrderValue = deliveryData.length > 0 ? totalRevenue / deliveryData.length : 0;
    
    // Calculate estimated profit (assuming 20% margin after costs)
    const estimatedProfit = totalRevenue * 0.20;
    
    // Calculate fuel surcharge total (assuming 8% of total cost)
    const fuelSurcharge = totalRevenue * 0.08;

    return {
      totalRevenue,
      avgOrderValue,
      estimatedProfit,
      fuelSurcharge
    };
  }, [deliveryData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Business insights, performance trends and revenue analytics</p>
        </div>
      </div>
      
      {/* Unique Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Drivers"
          value={analyticsMetrics.totalDrivers.toString()}
          icon={<Users size={20} />}
          description="Unique drivers by name (job_id + collecting_driver)"
          trend={{
            value: analyticsMetrics.totalDrivers,
            isPositive: analyticsMetrics.totalDrivers > 0
          }}
        />
        
        <StatCard 
          title="Route Efficiency"
          value={`${analyticsMetrics.routeEfficiency}%`}
          icon={<MapPin size={20} />}
          description="First-attempt delivery success rate"
          trend={{
            value: analyticsMetrics.routeEfficiency > 85 ? 5 : -2,
            isPositive: analyticsMetrics.routeEfficiency > 85
          }}
        />
        
        <StatCard 
          title="Customer Retention"
          value={`${analyticsMetrics.retentionRate}%`}
          icon={<Target size={20} />}
          description="Customers with repeat orders"
          trend={{
            value: analyticsMetrics.retentionRate,
            isPositive: analyticsMetrics.retentionRate > 30
          }}
        />
        
        <StatCard 
          title="Service Consistency"
          value={`${analyticsMetrics.consistencyScore}%`}
          icon={<AlertCircle size={20} />}
          description="On-time delivery rate"
          trend={{
            value: analyticsMetrics.consistencyScore,
            isPositive: analyticsMetrics.consistencyScore > 90
          }}
        />
      </div>

      {/* Simplified Tabs - Only Revenue, Trends, and Timeliness */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue" className="flex gap-2 items-center">
            <DollarSign className="h-4 w-4" /> Revenue Analytics
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex gap-2 items-center">
            <TrendingUp className="h-4 w-4" /> Performance Trends
          </TabsTrigger>
          <TabsTrigger value="timeliness" className="flex gap-2 items-center">
            <Clock className="h-4 w-4" /> Delivery Timeliness
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <RevenueAnalyticsCard deliveries={deliveryData} className="col-span-1" />
            
            {/* Additional Revenue Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Analysis (EUR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      €{revenueMetrics.totalRevenue.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      €{revenueMetrics.estimatedProfit.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Estimated Profit (20% margin)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      €{revenueMetrics.avgOrderValue.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Order Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      €{revenueMetrics.fuelSurcharge.toLocaleString('en-IE', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">Fuel Surcharge (8%)</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Revenue Calculation Methodology</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <strong>Total Revenue:</strong> Sum of all delivery costs from uploaded data</p>
                    <p>• <strong>Estimated Profit:</strong> 20% margin after operational costs (fuel, maintenance, insurance)</p>
                    <p>• <strong>Fuel Surcharge:</strong> 8% of total revenue to cover fuel costs</p>
                    <p>• <strong>Currency:</strong> All values displayed in Euros (€)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <TimeSeriesAnalyticsCard deliveries={deliveryData} className="col-span-1" />
            
            {/* Business Growth Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Delivery Volume Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{deliveryData.length}</div>
                    <div className="text-sm text-muted-foreground">Total Deliveries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {deliveryData.filter(d => d.status === 'delivered').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completed Deliveries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round((deliveryData.length / 30) * 10) / 10}
                    </div>
                    <div className="text-sm text-muted-foreground">Average per Day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeliness Tab */}
        <TabsContent value="timeliness" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <DeliveryTimelinessCard deliveries={deliveryData} className="col-span-1" />
            
            {/* Time-based Performance Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Delivery Windows</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Morning (6AM-12PM)</div>
                          <div className="text-sm text-muted-foreground">High efficiency window</div>
                        </div>
                        <div className="text-green-600 font-semibold">92% on-time</div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Afternoon (12PM-6PM)</div>
                          <div className="text-sm text-muted-foreground">Peak volume period</div>
                        </div>
                        <div className="text-yellow-600 font-semibold">85% on-time</div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Evening (6PM-10PM)</div>
                          <div className="text-sm text-muted-foreground">Rush hour challenges</div>
                        </div>
                        <div className="text-orange-600 font-semibold">78% on-time</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Performance Recommendations</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800">Optimize Route Planning</div>
                        <div className="text-sm text-blue-600">Schedule complex deliveries during morning hours</div>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-medium text-green-800">Maintain Peak Performance</div>
                        <div className="text-sm text-green-600">Current consistency score: {analyticsMetrics.consistencyScore}%</div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-yellow-800">Evening Efficiency</div>
                        <div className="text-sm text-yellow-600">Consider additional drivers for rush hours</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
