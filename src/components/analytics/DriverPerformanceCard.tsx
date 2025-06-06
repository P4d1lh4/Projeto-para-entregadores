import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Award } from 'lucide-react';
import type { DriverData } from '@/lib/file-utils';
import { cn } from '@/lib/utils';

type DriverPerformanceCardProps = {
  data: DriverData[];
  className?: string;
};

const DriverPerformanceCard: React.FC<DriverPerformanceCardProps> = ({ data, className }) => {
  // Add error handling for empty or invalid data
  if (!data || data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Top 5 Driver Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No driver data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort drivers by deliveries and then by success rate to find top performers
  const sortedDrivers = [...data].sort((a, b) => {
    const deliveriesDiff = (b.deliveries || 0) - (a.deliveries || 0);
    if (deliveriesDiff !== 0) {
      return deliveriesDiff;
    }
    return (b.successRate || 0) - (a.successRate || 0);
  });
  
  // Take the top 5 drivers
  const topDrivers = sortedDrivers.slice(0, 5);
  
  // Format data for the chart with error handling
  const chartData = topDrivers.map((driver, index) => ({
    name: driver.name ? driver.name.split(' ')[0] : `Driver ${index + 1}`,
    deliveries: driver.deliveries || 0,
    successRate: Math.round((driver.successRate || 0) * 100),
  }));

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Top 5 Driver Performance
        </CardTitle>
        <Award className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top 2 drivers summary */}
          <div className="grid gap-4 md:grid-cols-2">
            {topDrivers.slice(0, 2).map((driver, index) => (
              <div key={driver.id || index} className="bg-muted/50 rounded-md p-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">{driver.name || `Driver ${index + 1}`}</p>
                  <p className="text-sm text-muted-foreground">{driver.deliveries || 0} deliveries</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold">
                    {Math.round((driver.successRate || 0) * 100)}%
                  </span>
                  <ArrowUpRight className="ml-1 h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Chart */}
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="deliveries" 
                name="Deliveries" 
                fill="#3b82f6" 
              />
              <Bar 
                yAxisId="right" 
                dataKey="successRate" 
                name="Success Rate %" 
                fill="#10b981" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverPerformanceCard;
