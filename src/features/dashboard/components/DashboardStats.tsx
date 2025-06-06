import { Truck, Package, Users, Clock, UserPlus } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { formatDeliveryTime, formatNumber } from '../utils/formatters';

interface DashboardStatsProps {
  deliveryData: any[];
  driverData: any[];
}

const DashboardStats = ({ deliveryData, driverData }: DashboardStatsProps) => {
  const {
    totalDeliveries,
    successRate,
    activeDrivers,
    averageDeliveryTime,
    newDrivers,
  } = useDashboardStats(deliveryData, driverData);

  const deliveryTimeTrend = { value: 5, isPositive: false };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Deliveries" 
        value={formatNumber(totalDeliveries)}
        icon={<Package size={24} />}
        trend={{ value: 12, isPositive: true }}
        description="Compared to last week"
      />
      <StatCard 
        title="Success Rate" 
        value={`${successRate}%`}
        icon={<Truck size={24} />}
        trend={{ value: 3, isPositive: true }}
        description="Compared to last week"
      />
      <StatCard 
        title="New Drivers" 
        value={formatNumber(newDrivers)}
        icon={<UserPlus size={24} />}
        trend={{ value: 2, isPositive: true }}
        description="Joined in the last 30 days"
      />
      <StatCard 
        title="Average Delivery Time" 
        value={formatDeliveryTime(averageDeliveryTime)}
        icon={<Clock size={24} />}
        trend={deliveryTimeTrend}
        description="Average time from pickup to delivery"
      />
    </div>
  );
};

export default DashboardStats; 