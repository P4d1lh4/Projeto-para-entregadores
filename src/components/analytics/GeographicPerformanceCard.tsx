
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { DeliveryData } from '@/lib/file-utils';

type GeographicPerformanceCardProps = {
  deliveries: DeliveryData[];
  className?: string;
};

// Create a simple heatmap representation of delivery densities by area
const GeographicPerformanceCard: React.FC<GeographicPerformanceCardProps> = ({ deliveries, className }) => {
  // Group deliveries by city/area (in a real app, use more granular location data)
  const locationCounts: { [key: string]: number } = deliveries.reduce((acc, delivery) => {
    const location = delivery.city || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  
  // Sort areas by delivery count
  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6); // Top 6 areas
  
  // Calculate max for scaling
  const maxDeliveries = Math.max(...sortedLocations.map(([_, count]) => count));
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Geographic Delivery Density
        </CardTitle>
        <MapPin className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Top delivery areas by volume
          </div>
          
          <div className="space-y-2">
            {sortedLocations.map(([location, count]) => {
              const percentage = (count / maxDeliveries) * 100;
              return (
                <div key={location} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{location}</span>
                    <span className="font-medium">{count} deliveries</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="pt-2 text-xs text-muted-foreground">
            Regions with higher delivery concentrations may require additional driver allocation.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeographicPerformanceCard;
