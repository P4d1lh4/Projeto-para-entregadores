
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DeliveryTable from '@/components/data-display/DeliveryTable';
import DeliveryStatusChart from '@/components/dashboard/DeliveryStatusChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DeliveryData } from '@/lib/file-utils';

type DeliveriesProps = {
  deliveryData: DeliveryData[];
};

const Deliveries: React.FC<DeliveriesProps> = ({ deliveryData }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Deliveries</h1>
      <p className="text-muted-foreground">View and analyze all delivery records.</p>
      
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <DeliveryTable deliveries={deliveryData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chart">
          <Card>
            <CardContent className="pt-6">
              <DeliveryStatusChart deliveries={deliveryData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Deliveries;
