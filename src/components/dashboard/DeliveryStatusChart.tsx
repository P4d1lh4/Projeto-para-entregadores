import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DeliveryData } from '@/lib/file-utils';

type DeliveryStatusChartProps = {
  deliveries: DeliveryData[];
};

const DeliveryStatusChart: React.FC<DeliveryStatusChartProps> = ({ deliveries }) => {
  // Calculate status counts - only for delivered and cancelled/failed
  const statusCounts: { [key: string]: number } = deliveries.reduce((acc, delivery) => {
    // Only count delivered and failed (cancelled) deliveries
    if (delivery.status === 'delivered' || delivery.status === 'failed') {
      acc[delivery.status] = (acc[delivery.status] || 0) + 1;
    }
    return acc;
  }, {} as { [key: string]: number });
  
  // Format data for chart - only delivered and cancelled
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: formatStatus(status),
    value: count,
  }));
  
  const COLORS = {
    'Delivered': '#4ade80', // Green
    'Cancelled': '#f87171', // Red (failed = cancelled)
  };
  
  function formatStatus(status: string): string {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Cancelled';
      default:
        return status
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  }
  
  // Calculate total for delivered and cancelled only
  const totalRelevantDeliveries = (statusCounts['delivered'] || 0) + (statusCounts['failed'] || 0);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Delivery Completion Status</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Show chart only if we have relevant data */}
        {chartData.length > 0 && totalRelevantDeliveries > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'}
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(value) => [`${value} deliveries`, '']} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No Completed Deliveries</p>
              <p className="text-sm">No delivered or cancelled deliveries to display</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusChart;
