export interface DashboardStats {
  totalDeliveries: number;
  successRate: number;
  activeDrivers: number;
  averageDeliveryTime: number;
  newDrivers: number;
}

export interface DashboardProps {
  deliveryData: any[];
  driverData: any[];
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
} 