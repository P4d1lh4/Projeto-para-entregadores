
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import type { DeliveryData } from '@/lib/file-utils';

type PriorityDistributionCardProps = {
  deliveries: DeliveryData[];
  className?: string;
};

const PriorityDistributionCard: React.FC<PriorityDistributionCardProps> = ({ deliveries, className }) => {
  // Create mock priority data since original data might not have explicit priority fields
  // In a real app, you'd use actual priority data
  const priorityMap: { [key: string]: string } = {};
  
  deliveries.forEach((delivery, index) => {
    // Assign priorities based on some logic (just for demo)
    if (index % 5 === 0) priorityMap[delivery.id] = 'Urgent';
    else if (index % 3 === 0) priorityMap[delivery.id] = 'High';
    else if (index % 2 === 0) priorityMap[delivery.id] = 'Medium';
    else priorityMap[delivery.id] = 'Low';
  });
  
  // Count priorities
  const priorityCounts = deliveries.reduce((acc, delivery) => {
    const priority = priorityMap[delivery.id] || 'Medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  // Format for chart
  const chartData = Object.entries(priorityCounts).map(([priority, count]) => ({
    name: priority,
    value: count,
  }));
  
  const COLORS = {
    'Urgent': '#ef4444', // Red
    'High': '#f97316',   // Orange
    'Medium': '#f59e0b', // Amber
    'Low': '#22c55e',    // Green
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Job Priority Distribution
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(priorityCounts).map(([priority, count]) => (
              <div key={priority} className="flex justify-between text-sm">
                <span>{priority}</span>
                <span className="font-medium">{count} jobs</span>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} deliveries`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriorityDistributionCard;
