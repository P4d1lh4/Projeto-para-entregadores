
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DeliveryData } from '@/lib/file-utils';

type DeliveryStatusChartProps = {
  deliveries: DeliveryData[];
};

const DeliveryStatusChart: React.FC<DeliveryStatusChartProps> = ({ deliveries }) => {
  // Calculate status counts
  const statusCounts: { [key: string]: number } = deliveries.reduce((acc, delivery) => {
    acc[delivery.status] = (acc[delivery.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  // Format data for chart
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: formatStatus(status),
    value: count,
  }));
  
  const COLORS = {
    'Delivered': '#4ade80', // Green
    'Failed': '#f87171',    // Red
    'In Transit': '#60a5fa', // Blue
    'Pending': '#fbbf24',   // Yellow
  };
  
  function formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Delivery Status</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusChart;
