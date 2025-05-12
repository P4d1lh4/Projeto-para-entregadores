
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Layers } from 'lucide-react';
import type { DeliveryData } from '@/lib/file-utils';

type DeliveryStatusCardProps = {
  deliveries: DeliveryData[];
  className?: string;
};

const DeliveryStatusCard: React.FC<DeliveryStatusCardProps> = ({ deliveries, className }) => {
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
    'Delivered': '#10b981', // Green
    'Failed': '#ef4444',    // Red
    'In Transit': '#3b82f6', // Blue
    'Pending': '#f59e0b',   // Yellow
  };
  
  function formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Calculate on-time vs delayed percentage
  const totalDeliveries = deliveries.length;
  const deliveredCount = statusCounts['delivered'] || 0;
  const onTimePercentage = totalDeliveries > 0 ? (deliveredCount / totalDeliveries) * 100 : 0;
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Delivery Status Overview
        </CardTitle>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">On-time Deliveries</p>
              <p className="text-2xl font-bold">{Math.round(onTimePercentage)}%</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {totalDeliveries} deliveries
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} deliveries`, '']} />
              <Legend 
                formatter={(value, entry) => (
                  <span style={{ color: 'var(--foreground)' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusCard;
