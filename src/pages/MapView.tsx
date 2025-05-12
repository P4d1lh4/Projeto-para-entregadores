
import React from 'react';
import DeliveryMap from '@/components/map/DeliveryMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeliveryData } from '@/lib/file-utils';

type MapViewProps = {
  deliveryData: DeliveryData[];
};

const MapView: React.FC<MapViewProps> = ({ deliveryData }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Map View</h1>
      <p className="text-muted-foreground">Visualize all delivery locations and their status on the map.</p>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Delivery Locations</CardTitle>
          </CardHeader>
          <CardContent className="p-0 h-[600px]">
            <DeliveryMap deliveries={deliveryData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapView;
