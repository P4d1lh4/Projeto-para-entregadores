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
  // Process real delivery data by week
  const weeklyData = React.useMemo(() => {
    // Group deliveries by week
    const weekMap = new Map<string, { deliveries: number; revenue: number; successCount: number }>();
    
    deliveries.forEach(delivery => {
      try {
        // Use Fox delivery data dates if available
        const foxDelivery = delivery as any;
        let dateToUse = delivery.deliveryTime;
        
        if (foxDelivery.created_at) {
          dateToUse = foxDelivery.created_at;
        } else if (foxDelivery.collected_at) {
          dateToUse = foxDelivery.collected_at;
        }
        
        const date = new Date(dateToUse);
        
        // Get week start (Monday)
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(date.setDate(diff));
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { deliveries: 0, revenue: 0, successCount: 0 });
        }
        
        const weekData = weekMap.get(weekKey)!;
        weekData.deliveries++;
        
        // Add revenue from Fox data
        if (foxDelivery.cost) {
          weekData.revenue += foxDelivery.cost;
        }
        
        // Count successful deliveries
        if (delivery.status === 'delivered') {
          weekData.successCount++;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    // Convert to array and sort by date
    const sortedWeeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-8) // Get last 8 weeks
      .map(([weekStart, data], index) => {
        const weekStartDate = new Date(weekStart);
        const weekName = `Week ${index + 1}`;
        const successRate = data.deliveries > 0 ? (data.successCount / data.deliveries) * 100 : 0;
        
        return {
          name: weekName,
          fullDate: weekStartDate.toLocaleDateString('en-IE'),
          deliveries: data.deliveries,
          revenue: data.revenue,
          successRate: Math.round(successRate * 10) / 10,
        };
      });
    
    // If we don't have enough real data, pad with current totals
    if (sortedWeeks.length === 0) {
      const totalDeliveries = deliveries.length;
      const totalRevenue = deliveries.reduce((sum, d) => {
        const foxDelivery = d as any;
        return sum + (foxDelivery.cost || 0);
      }, 0);
      const successCount = deliveries.filter(d => d.status === 'delivered').length;
      const successRate = totalDeliveries > 0 ? (successCount / totalDeliveries) * 100 : 0;
      
      return [{
        name: 'Current Period',
        fullDate: new Date().toLocaleDateString('en-IE'),
        deliveries: totalDeliveries,
        revenue: totalRevenue,
        successRate: Math.round(successRate * 10) / 10,
      }];
    }
    
    return sortedWeeks;
  }, [deliveries]);
  
  // Calculate week-over-week growth
  const currentWeekDeliveries = weeklyData[weeklyData.length - 1]?.deliveries || 0;
  const previousWeekDeliveries = weeklyData[weeklyData.length - 2]?.deliveries || currentWeekDeliveries;
  const growthRate = previousWeekDeliveries > 0 ? ((currentWeekDeliveries - previousWeekDeliveries) / previousWeekDeliveries) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Delivery Volume Trends (Real Data)
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
                  {weeklyData.length > 1 ? `${growthRate.toFixed(1)}%` : 'N/A'}
                </p>
                {weeklyData.length > 1 && (
                  growthRate > 0 ? (
                    <span className="ml-2 text-sm text-green-500">↑</span>
                  ) : growthRate < 0 ? (
                    <span className="ml-2 text-sm text-red-500">↓</span>
                  ) : (
                    <span className="ml-2 text-sm text-gray-500">→</span>
                  )
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Period</p>
              <p className="text-xl font-bold">{currentWeekDeliveries} deliveries</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue') {
                    return [`€${Number(value).toFixed(2)}`, 'Revenue'];
                  }
                  if (name === 'successRate') {
                    return [`${value}%`, 'Success Rate'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${label} (${data.fullDate})`;
                  }
                  return label;
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="deliveries" name="Deliveries" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="successRate" name="Success Rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {weeklyData.reduce((sum, week) => sum + week.deliveries, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Deliveries</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                €{weeklyData.reduce((sum, week) => sum + week.revenue, 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {weeklyData.length > 0 ? 
                  (weeklyData.reduce((sum, week) => sum + week.successRate, 0) / weeklyData.length).toFixed(1)
                  : '0'
                }%
              </div>
              <div className="text-xs text-muted-foreground">Avg Success Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesAnalyticsCard;
