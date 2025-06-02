import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import type { DeliveryData, DriverData, CustomerData } from '@/lib/file-utils';
import DeliveryTimelinessCard from '@/components/analytics/DeliveryTimelinessCard';
import TimeSeriesAnalyticsCard from '@/components/analytics/TimeSeriesAnalyticsCard';
import RevenueAnalyticsCard from '@/components/analytics/RevenueAnalyticsCard';
import { Calendar, Clock, DollarSign, TrendingUp, MapPin, Target, AlertCircle, Zap } from 'lucide-react';

type AnalyticsProps = {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
};

const Analytics: React.FC<AnalyticsProps> = ({ deliveryData, driverData, customerData }) => {
  // Calculate unique analytics metrics that don't overlap with driver page or dashboard
  const analyticsMetrics = useMemo(() => {
    // Geographic diversity - unique delivery addresses
    const uniqueAddresses = new Set(deliveryData.map(d => d.address)).size;
    const addressDiversityScore = deliveryData.length > 0 ? Math.round((uniqueAddresses / deliveryData.length) * 100) : 0;

    // Peak performance window analysis
    const hourlyDeliveries = deliveryData.reduce((acc, delivery) => {
      const hour = new Date(delivery.deliveryTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const peakHour = Object.entries(hourlyDeliveries).sort(([,a], [,b]) => b - a)[0];
    const peakHourCount = peakHour ? parseInt(peakHour[1].toString()) : 0;
    const peakHourTime = peakHour ? `${peakHour[0]}:00` : 'N/A';

    // Customer retention analysis
    const customerOrders = customerData.reduce((acc, customer) => {
      const orderCount = deliveryData.filter(d => d.customerId === customer.id).length;
      if (orderCount > 1) acc.repeat++;
      acc.total++;
      return acc;
    }, { repeat: 0, total: 0 });
    
    const retentionRate = customerOrders.total > 0 ? Math.round((customerOrders.repeat / customerOrders.total) * 100) : 0;

    // Service reliability - consistent delivery times
    const deliveryTimes = deliveryData
      .filter(d => d.status === 'delivered')
      .map(d => new Date(d.deliveryTime).getHours());
    
    const avgDeliveryHour = deliveryTimes.length > 0 
      ? Math.round(deliveryTimes.reduce((sum, hour) => sum + hour, 0) / deliveryTimes.length)
      : 12;

    // Route efficiency - deliveries per unique location
    const deliveriesPerLocation = deliveryData.length > 0 ? (deliveryData.length / uniqueAddresses) : 0;

    // Performance consistency - driver performance variance
    const driverRatings = driverData.map(d => d.rating).filter(Boolean);
    const avgRating = driverRatings.length > 0 ? driverRatings.reduce((sum, rating) => sum + rating, 0) / driverRatings.length : 0;
    const ratingVariance = driverRatings.length > 1 
      ? Math.sqrt(driverRatings.reduce((sum, rating) => sum + Math.pow(rating - avgRating, 2), 0) / (driverRatings.length - 1))
      : 0;
    const consistencyScore = avgRating > 0 ? Math.max(0, 100 - (ratingVariance * 25)) : 0; // Convert variance to 0-100 score

    return {
      addressDiversityScore,
      peakHourCount,
      peakHourTime,
      retentionRate,
      avgDeliveryHour,
      deliveriesPerLocation: Math.round(deliveriesPerLocation * 10) / 10,
      consistencyScore: Math.round(consistencyScore)
    };
  }, [deliveryData, driverData, customerData]);

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
          title="Route Efficiency"
          value={`${analyticsMetrics.deliveriesPerLocation}`}
          icon={<MapPin size={20} />}
          description="Deliveries per unique location"
          trend={{
            value: analyticsMetrics.deliveriesPerLocation > 1.5 ? 8 : -3,
            isPositive: analyticsMetrics.deliveriesPerLocation > 1.5
          }}
        />
        
        <StatCard 
          title="Peak Hour Performance"
          value={`${analyticsMetrics.peakHourCount} at ${analyticsMetrics.peakHourTime}`}
          icon={<Zap size={20} />}
          description="Highest delivery volume"
        />
        
        <StatCard 
          title="Customer Retention"
          value={`${analyticsMetrics.retentionRate}%`}
          icon={<Target size={20} />}
          description="Repeat customers"
          trend={{
            value: analyticsMetrics.retentionRate,
            isPositive: analyticsMetrics.retentionRate > 60
          }}
        />
        
        <StatCard 
          title="Service Consistency"
          value={`${analyticsMetrics.consistencyScore}%`}
          icon={<AlertCircle size={20} />}
          description="Driver performance variance"
          trend={{
            value: analyticsMetrics.consistencyScore,
            isPositive: analyticsMetrics.consistencyScore > 80
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
                  Revenue Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${Math.round(deliveryData.length * 18.5).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Projected Monthly Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      ${Math.round(deliveryData.length * 18.5 * 0.15).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Est. Commission Income</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      ${Math.round(deliveryData.length * 2.5).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Fuel Surcharge Total</div>
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
                  Business Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Market Expansion</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Geographic Coverage</span>
                        <span className="font-semibold">{analyticsMetrics.addressDiversityScore}% diversity</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service Hours</span>
                        <span className="font-semibold">Peak at {analyticsMetrics.peakHourTime}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Operational Efficiency</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Route Optimization</span>
                        <span className="font-semibold">{analyticsMetrics.deliveriesPerLocation} del/location</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quality Consistency</span>
                        <span className="font-semibold">{analyticsMetrics.consistencyScore}% stable</span>
                      </div>
                    </div>
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
