
import React, { useMemo } from 'react';
import { Package, Clock, DollarSign, Gauge, Flag } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import type { FoxDelivery } from '@/types/delivery';
import { differenceInMinutes, parseISO } from 'date-fns';

type DeliveryKpiSectionProps = {
  deliveries: FoxDelivery[];
  className?: string;
};

const DeliveryKpiSection: React.FC<DeliveryKpiSectionProps> = ({ deliveries, className }) => {
  const metrics = useMemo(() => {
    // Get total number of deliveries
    const totalDeliveries = deliveries.length;
    
    // Calculate average delivery duration in minutes
    let totalDuration = 0;
    let deliveriesWithDuration = 0;
    
    deliveries.forEach(delivery => {
      if (delivery.collected_at && delivery.delivered_at) {
        const collectedAt = parseISO(delivery.collected_at);
        const deliveredAt = parseISO(delivery.delivered_at);
        const duration = differenceInMinutes(deliveredAt, collectedAt);
        
        if (duration > 0) {
          totalDuration += duration;
          deliveriesWithDuration++;
        }
      }
    });
    
    const avgDeliveryDuration = deliveriesWithDuration > 0 
      ? Math.round(totalDuration / deliveriesWithDuration) 
      : 0;
    
    // Calculate total invoiced amount
    const totalInvoiced = deliveries.reduce((sum, delivery) => {
      return sum + (delivery.cost || 0);
    }, 0);
    
    // Calculate fuel surcharge trends
    const currentFuelSurcharges = deliveries
      .filter(d => d.created_at && new Date(d.created_at).getMonth() === new Date().getMonth())
      .reduce((sum, d) => sum + (d.fuel_surcharge || 0), 0);
    
    const previousFuelSurcharges = deliveries
      .filter(d => {
        if (!d.created_at) return false;
        const date = new Date(d.created_at);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return date.getMonth() === lastMonth.getMonth();
      })
      .reduce((sum, d) => sum + (d.fuel_surcharge || 0), 0);
    
    const fuelSurchargeChange = previousFuelSurcharges > 0 
      ? ((currentFuelSurcharges - previousFuelSurcharges) / previousFuelSurcharges) * 100 
      : 0;
    
    // Count urgent jobs
    const urgentJobs = deliveries.filter(d => 
      d.priority && d.priority.toLowerCase().includes('urgent')
    ).length;
    
    return {
      totalDeliveries,
      avgDeliveryDuration,
      totalInvoiced,
      currentFuelSurcharges,
      fuelSurchargeChange,
      urgentJobs
    };
  }, [deliveries]);
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 ${className || ''}`}>
      <StatCard 
        title="Total Deliveries"
        value={metrics.totalDeliveries.toLocaleString()}
        icon={<Package size={20} />}
        trend={deliveries.length > 10 ? {
          value: 5,
          isPositive: true
        } : undefined}
      />
      
      <StatCard 
        title="Avg. Delivery Duration"
        value={`${metrics.avgDeliveryDuration} mins`}
        icon={<Clock size={20} />}
        description="From collection to delivery"
      />
      
      <StatCard 
        title="Total Invoiced"
        value={`$${metrics.totalInvoiced.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        icon={<DollarSign size={20} />}
        description="Based on delivery costs"
      />
      
      <StatCard 
        title="Fuel Surcharges"
        value={`$${metrics.currentFuelSurcharges.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        icon={<Gauge size={20} />}
        trend={metrics.fuelSurchargeChange !== 0 ? {
          value: Math.abs(Math.round(metrics.fuelSurchargeChange)),
          isPositive: metrics.fuelSurchargeChange >= 0
        } : undefined}
        description="Current month vs. previous"
      />
      
      <StatCard 
        title="Urgent Jobs"
        value={metrics.urgentJobs.toString()}
        icon={<Flag size={20} />}
        description="Priority marked as urgent"
      />
    </div>
  );
};

export default DeliveryKpiSection;
