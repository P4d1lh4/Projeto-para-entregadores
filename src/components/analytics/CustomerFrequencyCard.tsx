
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import type { DeliveryData, CustomerData } from '@/lib/file-utils';
import { cn } from '@/lib/utils';

type CustomerFrequencyCardProps = {
  customerData: CustomerData[];
  className?: string;
};

const CustomerFrequencyCard: React.FC<CustomerFrequencyCardProps> = ({ customerData, className }) => {
  // Sort customers by number of deliveries (highest first)
  const sortedCustomers = [...customerData]
    .sort((a, b) => b.deliveries - a.deliveries)
    .slice(0, 6); // Take top 6
  
  const chartData = sortedCustomers.map(customer => ({
    name: customer.name.split(' ')[0], // First name for brevity
    deliveries: customer.deliveries,
    rating: customer.averageRating * 20, // Scale up for better visualization
  }));

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Top Customers by Order Frequency
        </CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {sortedCustomers.slice(0, 2).map((customer, index) => (
              <div 
                key={customer.id} 
                className={cn(
                  "rounded-md p-2",
                  index === 0 ? "bg-blue-100 dark:bg-blue-900/20" : "bg-muted"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{customer.name}</span>
                  <span className="text-sm">{customer.deliveries} orders</span>
                </div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 15, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'rating') {
                    return [`${(Number(value) / 20).toFixed(1)}/5`, 'Rating'];
                  }
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="deliveries" name="Order Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="rating" name="Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerFrequencyCard;
