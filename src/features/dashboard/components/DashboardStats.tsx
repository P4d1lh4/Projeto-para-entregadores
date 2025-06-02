import { Truck, Package, Users, Clock } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { 
  calculateSuccessRate, 
  calculateActiveDrivers, 
  calculateAverageDeliveryTime,
  calculateDeliveryTimeTrend,
  formatDeliveryTime,
  formatNumber 
} from '../utils/calculations';

interface DashboardStatsProps {
  deliveryData: any[];
  driverData: any[];
}

const DashboardStats = ({ deliveryData, driverData }: DashboardStatsProps) => {
  const totalDeliveries = deliveryData.length;
  const successRate = calculateSuccessRate(deliveryData);
  const activeDrivers = calculateActiveDrivers(deliveryData);
  const averageDeliveryTime = calculateAverageDeliveryTime(deliveryData);
  const deliveryTimeTrend = calculateDeliveryTimeTrend(deliveryData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Deliveries" 
        value={formatNumber(totalDeliveries)}
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
        value={activeDrivers}
        icon={<Users size={24} />}
        trend={{ value: 0, isPositive: true }}
      />
      <StatCard 
        title="Average Delivery Time" 
        value={formatDeliveryTime(averageDeliveryTime)}
        icon={<Clock size={24} />}
        trend={deliveryTimeTrend}
        description="Average time between order and delivery"
      />
    </div>
  );
};

export default DashboardStats; 