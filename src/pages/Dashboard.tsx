
import React from 'react';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardStats } from '@/features/dashboard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import DeliveryStatusChart from '@/components/dashboard/DeliveryStatusChart';
import ChatGptInsights from '@/components/ai/ChatGptInsights';
import DeliveryTable from '@/components/data-display/DeliveryTable';
import EmptyState from '@/components/dashboard/EmptyState';
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
        <EmptyState />
      </div>
    );
  }
  
  // Stats are now calculated in the DashboardStats component
  
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
      
      <DashboardStats deliveryData={deliveryData} driverData={driverData} />
      
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
