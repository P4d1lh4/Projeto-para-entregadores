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
    percentage: count > 0 ? Math.round((count / (statusCounts['delivered'] + statusCounts['failed'])) * 100) : 0
  }));
  
  const COLORS = {
    'Delivered': '#10b981', // Green
    'Cancelled': '#ef4444', // Red (failed = cancelled)
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
  const deliveredCount = statusCounts['delivered'] || 0;
  const successPercentage = totalRelevantDeliveries > 0 ? Math.round((deliveredCount / totalRelevantDeliveries) * 100) : 0;
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Delivery Completion Status
        </CardTitle>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Success Rate</p>
              <p className="text-2xl font-bold">{successPercentage}%</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {totalRelevantDeliveries} completed deliveries
            </div>
          </div>
          
          {/* Only show chart if we have relevant data */}
          {chartData.length > 0 && (
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
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
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
          )}
          
          {/* Show message if no relevant data */}
          {chartData.length === 0 && (
            <div className="flex items-center justify-center h-60 text-muted-foreground">
              <p>No completed deliveries (delivered or cancelled) to display</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryStatusCard;
