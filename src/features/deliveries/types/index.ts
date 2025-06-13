export interface DeliveryData {
  id: string;
  driverId: string;
  driverName: string;
  customerId: string;
  customerName: string;
  address: string;
  city: string;
  status: 'delivered' | 'failed' | 'pending' | 'in_transit';
  deliveryTime: string;
  latitude: number;
  longitude: number;
  rating?: number;
  // Support both snake_case (from CSV) and camelCase (legacy)
  created_at?: string;
  collected_at?: string;
  delivered_at?: string;
  createdAt?: string;
  collectedAt?: string;
  deliveredAt?: string;
  collectedWaitingTime?: string | number; // Aceita HH:mm:ss (string) ou minutos (number)
  deliveredWaitingTime?: string | number; // Aceita HH:mm:ss (string) ou minutos (number)
}

export interface DriverData {
  id: string;
  name: string;
  deliveries: number;
  successRate: number;
  averageTime: number;
}

export interface CustomerData {
  id: string;
  name: string;
  address: string;
  deliveries: number;
  averageRating: number;
}

export interface DeliveryFilters {
  status?: string;
  driverId?: string; // Can be either driver ID or driver name
  customerId?: string; // Can be either customer ID or customer name  
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DeliveryTableProps {
  deliveries: DeliveryData[];
  limit?: number;
  showPagination?: boolean;
}
