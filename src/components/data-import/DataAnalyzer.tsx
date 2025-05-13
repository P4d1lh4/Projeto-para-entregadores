
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { FoxDelivery } from '@/types/delivery';
import { Loader2 } from 'lucide-react';

type DataAnalyzerProps = {
  deliveries: FoxDelivery[];
  isLoading: boolean;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DataAnalyzer: React.FC<DataAnalyzerProps> = ({ deliveries, isLoading }) => {
  const analytics = useMemo(() => {
    if (deliveries.length === 0) return null;
    
    // Status distribution
    const statusCounts: Record<string, number> = {};
    deliveries.forEach(d => {
      const status = d.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const statusData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name: capitalize(name), value }))
      .sort((a, b) => b.value - a.value);
    
    // Service type distribution
    const serviceTypeCounts: Record<string, number> = {};
    deliveries.forEach(d => {
      const serviceType = d.service_type || 'unknown';
      serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] || 0) + 1;
    });
    
    const serviceTypeData = Object.entries(serviceTypeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Calculate cost metrics
    const itemsWithCost = deliveries.filter(d => d.cost !== undefined && d.cost !== null);
    const costs = itemsWithCost.map(d => d.cost as number);
    const totalCost = costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) : 0;
    const avgCost = costs.length > 0 ? totalCost / costs.length : 0;
    const minCost = costs.length > 0 ? Math.min(...costs) : 0;
    const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
    
    // Driver metrics
    const driverDeliveries: Record<string, { count: number, completed: number }> = {};
    deliveries.forEach(d => {
      if (d.delivering_driver) {
        if (!driverDeliveries[d.delivering_driver]) {
          driverDeliveries[d.delivering_driver] = { count: 0, completed: 0 };
        }
        
        driverDeliveries[d.delivering_driver].count++;
        if (d.status === 'delivered') {
          driverDeliveries[d.delivering_driver].completed++;
        }
      }
    });
    
    const driverData = Object.entries(driverDeliveries)
      .map(([name, stats]) => ({
        name,
        deliveries: stats.count,
        completed: stats.completed,
        rate: stats.count > 0 ? Math.round((stats.completed / stats.count) * 100) : 0
      }))
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5); // Top 5 drivers
    
    // Time-based analytics
    const deliveryTimes = deliveries
      .filter(d => d.delivered_at && d.collected_at)
      .map(d => {
        const collectedTime = d.collected_at ? new Date(d.collected_at).getTime() : 0;
        const deliveredTime = d.delivered_at ? new Date(d.delivered_at).getTime() : 0;
        return {
          id: d.job_id || d.id || '',
          minutes: (deliveredTime - collectedTime) / (1000 * 60)
        };
      })
      .filter(d => d.minutes > 0 && d.minutes < 300); // Filter out unreasonable values
    
    const avgDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, item) => sum + item.minutes, 0) / deliveryTimes.length
      : 0;
    
    return {
      statusData,
      serviceTypeData,
      costMetrics: { total: totalCost, average: avgCost, min: minCost, max: maxCost },
      driverData,
      deliveryTimeMetrics: { average: avgDeliveryTime, times: deliveryTimes }
    };
  }, [deliveries]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Analyzing data...</span>
        </CardContent>
      </Card>
    );
  }
  
  if (!analytics || deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of deliveries by status
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} deliveries`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Service Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of deliveries by service type
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.serviceTypeData.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip 
                  formatter={(value: number) => [`${value} deliveries`, 'Count']}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cost Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>
              Summary of delivery costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cost:</span>
              <span className="font-medium">${analytics.costMetrics.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Cost:</span>
              <span className="font-medium">${analytics.costMetrics.average.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum:</span>
              <span className="font-medium">${analytics.costMetrics.min.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum:</span>
              <span className="font-medium">${analytics.costMetrics.max.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Time Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Time</CardTitle>
            <CardDescription>
              Time-based performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Delivery Time:</span>
              <span className="font-medium">{Math.round(analytics.deliveryTimeMetrics.average)} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deliveries with time data:</span>
              <span className="font-medium">{analytics.deliveryTimeMetrics.times.length}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Data Quality */}
        <Card>
          <CardHeader>
            <CardTitle>Data Quality</CardTitle>
            <CardDescription>
              Data completeness metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Records:</span>
              <span className="font-medium">{deliveries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">With Cost Data:</span>
              <span className="font-medium">
                {deliveries.filter(d => d.cost !== undefined && d.cost !== null).length} 
                ({Math.round(deliveries.filter(d => d.cost !== undefined && d.cost !== null).length / deliveries.length * 100)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">With Status:</span>
              <span className="font-medium">
                {deliveries.filter(d => d.status).length}
                ({Math.round(deliveries.filter(d => d.status).length / deliveries.length * 100)}%)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Driver Performance */}
      {analytics.driverData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Driver Performance</CardTitle>
            <CardDescription>
              Delivery metrics for top 5 drivers by volume
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.driverData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar name="Total Deliveries" dataKey="deliveries" fill="#8884d8" />
                <Bar name="Completed" dataKey="completed" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function to capitalize first letter
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default DataAnalyzer;
