
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DeliveryData, DriverData, CustomerData } from '@/lib/file-utils';
import DriverPerformanceCard from '@/components/analytics/DriverPerformanceCard';
import DeliveryStatusCard from '@/components/analytics/DeliveryStatusCard';
import WaitingTimeCard from '@/components/analytics/WaitingTimeCard';
import CustomerFrequencyCard from '@/components/analytics/CustomerFrequencyCard';
import PriorityDistributionCard from '@/components/analytics/PriorityDistributionCard';
import DeliveryTimelinessCard from '@/components/analytics/DeliveryTimelinessCard';
import TimeSeriesAnalyticsCard from '@/components/analytics/TimeSeriesAnalyticsCard';
import GeographicPerformanceCard from '@/components/analytics/GeographicPerformanceCard';
import RevenueAnalyticsCard from '@/components/analytics/RevenueAnalyticsCard';
import { Calendar, Clock, DollarSign, Map, TrendingUp, Truck, Users } from 'lucide-react';

type AnalyticsProps = {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
};

const Analytics: React.FC<AnalyticsProps> = ({ deliveryData, driverData, customerData }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into delivery operations and performance</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex gap-2 items-center">
            <TrendingUp className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex gap-2 items-center">
            <Truck className="h-4 w-4" /> Drivers
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex gap-2 items-center">
            <Users className="h-4 w-4" /> Customers
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex gap-2 items-center">
            <Clock className="h-4 w-4" /> Timeliness
          </TabsTrigger>
          <TabsTrigger value="geography" className="flex gap-2 items-center">
            <Map className="h-4 w-4" /> Geography
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex gap-2 items-center">
            <DollarSign className="h-4 w-4" /> Revenue
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex gap-2 items-center">
            <Calendar className="h-4 w-4" /> Trends
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DriverPerformanceCard data={driverData} />
            <DeliveryStatusCard deliveries={deliveryData} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TimeSeriesAnalyticsCard deliveries={deliveryData} />
            <WaitingTimeCard deliveries={deliveryData} driverData={driverData} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CustomerFrequencyCard customerData={customerData} />
            <PriorityDistributionCard deliveries={deliveryData} />
          </div>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <DriverPerformanceCard data={driverData} className="col-span-1" />
            <WaitingTimeCard 
              deliveries={deliveryData} 
              driverData={driverData} 
              className="col-span-1" 
            />
            <DeliveryTimelinessCard deliveries={deliveryData} className="col-span-1" />
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <CustomerFrequencyCard customerData={customerData} className="col-span-1" />
            <GeographicPerformanceCard deliveries={deliveryData} className="col-span-1" />
            <DeliveryStatusCard deliveries={deliveryData} className="col-span-1" />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <DeliveryTimelinessCard deliveries={deliveryData} className="col-span-1" />
            <WaitingTimeCard 
              deliveries={deliveryData} 
              driverData={driverData} 
              className="col-span-1" 
            />
            <PriorityDistributionCard deliveries={deliveryData} className="col-span-1" />
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <GeographicPerformanceCard deliveries={deliveryData} className="col-span-1" />
            <TimeSeriesAnalyticsCard deliveries={deliveryData} className="col-span-1" />
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <RevenueAnalyticsCard deliveries={deliveryData} className="col-span-1" />
            <TimeSeriesAnalyticsCard deliveries={deliveryData} className="col-span-1" />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <TimeSeriesAnalyticsCard deliveries={deliveryData} className="col-span-1" />
            <RevenueAnalyticsCard deliveries={deliveryData} className="col-span-1" />
            <DriverPerformanceCard data={driverData} className="col-span-1" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
