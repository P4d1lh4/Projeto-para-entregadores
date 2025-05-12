
import React from 'react';
import { Truck, Package, Users, Map } from 'lucide-react';
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
  const uniqueCustomersCount = new Set(deliveryData.map(d => d.customerId)).size;
  
  // Calculate overall average rating
  const ratings = deliveryData
    .filter(d => d.rating !== undefined)
    .map(d => d.rating as number);
  const averageRating = ratings.length > 0 ? 
    Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10 : 0;
  
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
          title="Customer Satisfaction" 
          value={`${averageRating}/5`}
          icon={<Map size={24} />}
          trend={{ value: 5, isPositive: true }}
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
