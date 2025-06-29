import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DeliveryData } from '@/lib/file-utils';

type DeliveryTableProps = {
  deliveries: DeliveryData[];
  limit?: number;
};

const DeliveryTable: React.FC<DeliveryTableProps> = ({ deliveries, limit }) => {
  // Sort by most recent
  const sortedDeliveries = [...deliveries].sort((a, b) => 
    new Date(b.deliveryTime).getTime() - new Date(a.deliveryTime).getTime()
  );
  
  // Limit the number of displayed deliveries if needed
  const displayedDeliveries = limit ? sortedDeliveries.slice(0, limit) : sortedDeliveries;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDeliveryTime = (delivery: DeliveryData): string => {
    // Try to use Fox delivery data first (collected_at and delivered_at)
    const foxDelivery = delivery as any;
    if (foxDelivery.collected_at && foxDelivery.delivered_at) {
      try {
        const collectedTime = new Date(foxDelivery.collected_at);
        const deliveredTime = new Date(foxDelivery.delivered_at);
        const durationMinutes = (deliveredTime.getTime() - collectedTime.getTime()) / (1000 * 60);
        
        if (durationMinutes > 0 && durationMinutes < 1440) { // Less than 24 hours
          if (durationMinutes < 60) {
            return `${Math.round(durationMinutes)}min`;
          } else {
            const hours = Math.floor(durationMinutes / 60);
            const minutes = Math.round(durationMinutes % 60);
            return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
          }
        }
      } catch (e) {
        // Invalid dates, fall through to default
      }
    }
    
    // Default fallback - use a reasonable estimate based on delivery data
    return '-';
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'in_transit':
        return 'default';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };
  
  const formatStatus = (status: string): string => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      case 'in_transit':
        return 'In Transit';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deliveries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Delivery Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedDeliveries.map((delivery) => (
              <TableRow key={delivery.id}>
                <TableCell className="font-medium">{delivery.id}</TableCell>
                <TableCell>{delivery.customerName}</TableCell>
                <TableCell>{delivery.driverName}</TableCell>
                <TableCell>
                  {formatDate(delivery.deliveryTime)}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {formatTime(delivery.deliveryTime)}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(delivery.status) as any}>
                    {formatStatus(delivery.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {calculateDeliveryTime(delivery)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DeliveryTable;
