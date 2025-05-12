
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { DeliveryData } from '@/lib/file-utils';

type TimeSeriesAnalyticsCardProps = {
  deliveries: DeliveryData[];
  className?: string;
};

const TimeSeriesAnalyticsCard: React.FC<TimeSeriesAnalyticsCardProps> = ({ deliveries, className }) => {
  // Generate weekly data (in a real app, this would come from actual timestamps)
  const last8Weeks = Array.from({ length: 8 }, (_, i) => {
    const week = i + 1;
    const baseDeliveryCount = 50 + Math.floor(Math.random() * 30);
    const growth = Math.min(1 + (week * 0.07), 1.5); // Simulate growth
    
    return {
      name: `Week ${week}`,
      deliveries: Math.floor(baseDeliveryCount * growth),
      revenue: Math.floor((baseDeliveryCount * growth) * (15 + Math.random() * 10)),
      successRate: 70 + Math.floor(Math.random() * 25),
    };
  });
  
  // Calculate week-over-week growth
  const currentWeekDeliveries = last8Weeks[last8Weeks.length - 1].deliveries;
  const previousWeekDeliveries = last8Weeks[last8Weeks.length - 2].deliveries;
  const growthRate = ((currentWeekDeliveries - previousWeekDeliveries) / previousWeekDeliveries) * 100;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Delivery Volume Trends
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Growth</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold">
                  {growthRate.toFixed(1)}%
                </p>
                {growthRate > 0 ? (
                  <span className="ml-2 text-sm text-green-500">↑</span>
                ) : (
                  <span className="ml-2 text-sm text-red-500">↓</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Week</p>
              <p className="text-xl font-bold">{currentWeekDeliveries} deliveries</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={last8Weeks} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [`$${value}`, 'Revenue'];
                  }
                  if (name === 'successRate') {
                    return [`${value}%`, 'Success Rate'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="deliveries" name="Deliveries" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesAnalyticsCard;
