
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DriverTable from '@/components/data-display/DriverTable';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DriverData } from '@/lib/file-utils';

type DriversProps = {
  driverData: DriverData[];
};

const Drivers: React.FC<DriversProps> = ({ driverData }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Drivers</h1>
      <p className="text-muted-foreground">View and analyze driver performance metrics.</p>
      
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <Card>
            <CardContent className="pt-6">
              <DriverTable drivers={driverData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chart">
          <Card>
            <CardContent className="pt-6">
              <PerformanceChart data={driverData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Drivers;
