
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Clock, TrendingUp, Award } from 'lucide-react';
import type { DriverData } from '@/lib/file-utils';
import { cn } from '@/lib/utils';

type DriverPerformanceCardProps = {
  data: DriverData[];
  className?: string;
};

const DriverPerformanceCard: React.FC<DriverPerformanceCardProps> = ({ data, className }) => {
  // Sort drivers by success rate for better visualization
  const sortedDrivers = [...data].sort((a, b) => b.successRate - a.successRate);
  
  // Format data for the chart, limiting to top 5 drivers
  const topDrivers = sortedDrivers.slice(0, 5);
  
  const chartData = topDrivers.map(driver => ({
    name: driver.name.split(' ')[0], // First name only for brevity
    deliveries: driver.deliveries,
    successRate: Math.round(driver.successRate * 100),
    rating: driver.rating * 20, // Scale up for better visualization
    averageTime: driver.averageTime,
  }));

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Top Driver Performance
        </CardTitle>
        <Award className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {topDrivers.slice(0, 2).map(driver => (
              <div key={driver.id} className="bg-muted/50 rounded-md p-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.deliveries} deliveries</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold">
                    {Math.round(driver.successRate * 100)}%
                  </span>
                  <ArrowUpRight className="ml-1 h-4 w-4 text-green-500" />
                </div>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 15, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'rating') {
                    return [`${(Number(value) / 20).toFixed(1)}/5`, 'Rating'];
                  }
                  if (name === 'successRate') {
                    return [`${value}%`, 'Success Rate'];
                  }
                  if (name === 'averageTime') {
                    return [`${value} min`, 'Avg Time'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="deliveries" name="Deliveries" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="successRate" name="Success Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="averageTime" name="Avg Time (min)" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverPerformanceCard;
