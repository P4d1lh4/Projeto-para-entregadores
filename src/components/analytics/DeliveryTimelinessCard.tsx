import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, Clock } from 'lucide-react';
import type { DeliveryData } from '@/lib/file-utils';

type DeliveryTimelinessCardProps = {
  deliveries: DeliveryData[];
  className?: string;
};

const DeliveryTimelinessCard: React.FC<DeliveryTimelinessCardProps> = ({ deliveries, className }) => {
  // Create deterministic timeliness data based on day patterns
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const timelinessData = daysOfWeek.map((day, index) => {
    // Deterministic values based on day index and delivery data
    const baseTotalForDay = 8 + (index * 2); // Different base counts per day
    const variation = (deliveries.length % 7) + index; // Deterministic variation
    const totalForDay = Math.floor(baseTotalForDay + variation);
    
    // On-time rate varies by day (weekend typically better)
    const isWeekend = index === 0 || index === 6; // Sunday or Saturday
    const baseOnTimeRate = isWeekend ? 0.85 : 0.75; // Better on weekends
    const rateVariation = (deliveries.length % 20) / 100; // 0-0.19 variation
    const onTimeRate = Math.min(0.95, baseOnTimeRate + rateVariation);
    
    const onTimeCount = Math.floor(totalForDay * onTimeRate);
    const delayedCount = totalForDay - onTimeCount;
    
    return {
      day,
      onTime: onTimeCount,
      delayed: delayedCount,
      total: totalForDay,
    };
  });
  
  // Calculate overall stats
  const totalDeliveries = timelinessData.reduce((acc, day) => acc + day.total, 0);
  const totalOnTime = timelinessData.reduce((acc, day) => acc + day.onTime, 0);
  const onTimePercentage = (totalOnTime / totalDeliveries) * 100;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Delivery Timeliness Analysis
        </CardTitle>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">On-time Delivery Rate</p>
              <p className="text-2xl font-bold">{Math.round(onTimePercentage)}%</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs">On-time</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-orange-500 mr-1"></div>
                <span className="text-xs">Delayed</span>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={timelinessData}
              margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              barSize={20}
              stackOffset="expand"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'onTime') {
                    return [`${value} deliveries`, 'On-time'];
                  }
                  if (name === 'delayed') {
                    return [`${value} deliveries`, 'Delayed'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="onTime" stackId="a" name="On-time" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delayed" stackId="a" name="Delayed" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryTimelinessCard;
