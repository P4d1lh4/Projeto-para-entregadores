
import React from 'react';
import { Truck, Package, Users, Clock, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import DeliveryStatusChart from '@/components/dashboard/DeliveryStatusChart';
import ChatGptInsights from '@/components/ai/ChatGptInsights';
import DeliveryTable from '@/components/data-display/DeliveryTable';
import type { DeliveryData, DriverData } from '@/lib/file-utils';

type DashboardProps = {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
};

const Dashboard: React.FC<DashboardProps> = ({ deliveryData, driverData }) => {
  const navigate = useNavigate();
  
  // If no data, show empty state
  if (deliveryData.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Package className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
            <CardTitle>No Delivery Data Found</CardTitle>
            <CardDescription>
              Get started by importing your delivery data to see analytics and insights
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate('/data-import')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Delivery Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Upload Excel files with your delivery information
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate quick stats
  const totalDeliveries = deliveryData.length;
  const deliveredCount = deliveryData.filter(d => d.status === 'delivered').length;
  const successRate = totalDeliveries > 0 ? Math.round((deliveredCount / totalDeliveries) * 100) : 0;
  const uniqueDriversCount = new Set(deliveryData.map(d => d.driverId)).size;
  
  // Calculate average delivery time in hours
  const deliveredOrders = deliveryData.filter(d => d.status === 'delivered');
  const avgDeliveryTimeHours = deliveredOrders.length > 0 ? 
    Math.round((deliveredOrders.reduce((sum, delivery) => {
      // Mock calculation - in real scenario this would be based on actual time data
      const deliveryTime = new Date(delivery.deliveryTime);
      const orderTime = new Date(deliveryTime.getTime() - (Math.random() * 24 * 60 * 60 * 1000)); // Random time within 24 hours
      return sum + ((deliveryTime.getTime() - orderTime.getTime()) / (1000 * 60 * 60));
    }, 0) / deliveredOrders.length) * 10) / 10 : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/data-import')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Import More Data
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Deliveries" 
          value={totalDeliveries.toLocaleString()}
          icon={<Package size={24} />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Success Rate" 
          value={`${successRate}%`}
          icon={<Truck size={24} />}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard 
          title="Active Drivers" 
          value={uniqueDriversCount}
          icon={<Users size={24} />}
          trend={{ value: 0, isPositive: true }}
        />
        <StatCard 
          title="Average Delivery Time" 
          value={`${avgDeliveryTimeHours}h`}
          icon={<Clock size={24} />}
          trend={{ value: 8, isPositive: false }}
          description="Average time between order and delivery"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart data={driverData} />
        <DeliveryStatusChart deliveries={deliveryData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryTable deliveries={deliveryData} limit={5} />
        <ChatGptInsights deliveryData={deliveryData} />
      </div>
    </div>
  );
};

export default Dashboard;
