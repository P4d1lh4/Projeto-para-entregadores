
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import type { DeliveryData, DriverData } from '@/lib/file-utils';

type WaitingTimeCardProps = {
  deliveries: DeliveryData[];
  driverData: DriverData[];
  className?: string;
};

const WaitingTimeCard: React.FC<WaitingTimeCardProps> = ({ deliveries, driverData, className }) => {
  // Calculate average waiting times per driver
  const driverWaitingTimes = driverData.map(driver => {
    const driverDeliveries = deliveries.filter(d => d.driverId === driver.id);
    
    // Mock waiting times since we don't have real data
    // In a real application, you would use actual waiting time data
    const collectionWaitingTime = 12 + Math.random() * 8; // 12-20 mins
    const deliveryWaitingTime = 8 + Math.random() * 7; // 8-15 mins
    
    return {
      name: driver.name.split(' ')[0], // First name for brevity
      collectionWaiting: Math.round(collectionWaitingTime),
      deliveryWaiting: Math.round(deliveryWaitingTime),
      totalWaiting: Math.round(collectionWaitingTime + deliveryWaitingTime),
    };
  });
  
  // Sort by total waiting time (highest first) and take top 5
  const topWaitingDrivers = [...driverWaitingTimes]
    .sort((a, b) => b.totalWaiting - a.totalWaiting)
    .slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Driver Waiting Time Analysis
        </CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          Average time spent waiting at pickup and delivery locations
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart 
            data={topWaitingDrivers}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={60} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'collectionWaiting') {
                  return [`${value} min`, 'Pickup Wait'];
                }
                if (name === 'deliveryWaiting') {
                  return [`${value} min`, 'Delivery Wait'];
                }
                return [`${value} min`, name];
              }}
              cursor={{ fill: 'transparent' }}
            />
            <Legend />
            <Bar dataKey="collectionWaiting" name="Pickup Wait" stackId="a" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            <Bar dataKey="deliveryWaiting" name="Delivery Wait" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WaitingTimeCard;
