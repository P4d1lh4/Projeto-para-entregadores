import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';
import type { DeliveryData } from '@/lib/file-utils';

type RevenueAnalyticsCardProps = {
  deliveries: DeliveryData[];
  className?: string;
};

const RevenueAnalyticsCard: React.FC<RevenueAnalyticsCardProps> = ({ deliveries, className }) => {
  // Process real delivery data by day of week
  const revenueData = React.useMemo(() => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = new Map<number, { revenue: number; deliveryCount: number }>();
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayMap.set(i, { revenue: 0, deliveryCount: 0 });
    }
    
    // Process real delivery data
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
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const mondayIndexedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0 index
        
        const dayData = dayMap.get(mondayIndexedDay)!;
        dayData.deliveryCount++;
        
        // Add revenue from Fox data
        if (foxDelivery.cost) {
          dayData.revenue += foxDelivery.cost;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    // Convert to chart data
    return daysOfWeek.map((day, index) => {
      const dayData = dayMap.get(index)!;
      const revenue = dayData.revenue;
      const profit = revenue * 0.20; // 20% profit margin
      const costs = revenue - profit;
      
      return {
        day,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        costs: Math.round(costs * 100) / 100,
        deliveryCount: dayData.deliveryCount,
      };
    });
  }, [deliveries]);
  
  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
  const totalProfit = revenueData.reduce((sum, day) => sum + day.profit, 0);
  const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const totalDeliveries = revenueData.reduce((sum, day) => sum + day.deliveryCount, 0);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Revenue Analysis by Day (EUR)
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">€{totalRevenue.toLocaleString('en-IE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">{profitMargin}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
              <p className="text-2xl font-bold">{totalDeliveries}</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const formattedName = typeof name === 'string' 
                    ? name.charAt(0).toUpperCase() + name.slice(1) 
                    : String(name);
                  
                  if (name === 'deliveryCount') {
                    return [`${value} deliveries`, 'Deliveries'];
                  }
                  
                  return [`€${Number(value).toFixed(2)}`, formattedName];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return `${label} - ${data.deliveryCount} deliveries`;
                  }
                  return label;
                }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 text-sm mb-1">Revenue Analysis Notes</h4>
            <div className="text-xs text-blue-700">
              <p>• Revenue calculated from real delivery costs in uploaded data</p>
              <p>• Profit estimated at 20% margin after operational costs</p>
              <p>• Data grouped by day of week to show weekly patterns</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueAnalyticsCard;
