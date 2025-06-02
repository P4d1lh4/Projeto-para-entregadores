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
  // Generate deterministic revenue data by day of week
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const revenueData = daysOfWeek.map((day, index) => {
    // Deterministic values based on day index and delivery data
    const baseCount = 15 + (index * 3); // Base count varies by day
    const deliveryCount = Math.floor(baseCount + (deliveries.length % 10));
    const avgDeliveryCost = 18 + (index % 5); // Cost varies by day
    const revenue = deliveryCount * avgDeliveryCost;
    const commissions = revenue * 0.15; // 15% commission
    
    return {
      day,
      revenue: Math.round(revenue),
      commissions: Math.round(commissions),
      profit: Math.round(revenue - commissions),
    };
  });
  
  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
  const totalProfit = revenueData.reduce((sum, day) => sum + day.profit, 0);
  const profitMargin = Math.round((totalProfit / totalRevenue) * 100);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Revenue Analysis
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Margin</p>
              <p className="text-2xl font-bold">{profitMargin}%</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  // Fix: Properly format the tooltip label by checking if name is a string
                  const formattedName = typeof name === 'string' 
                    ? name.charAt(0).toUpperCase() + name.slice(1) 
                    : String(name);
                  
                  return [`$${value}`, formattedName];
                }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueAnalyticsCard;
