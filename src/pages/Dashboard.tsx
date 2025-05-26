
import React from 'react';
import { Truck, Package, Users, Clock } from 'lucide-react';
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
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
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
