import React, { useEffect, useState } from 'react';
import DeliveryAnalysisReport from '@/components/analytics/DeliveryAnalysisReport';
import { fetchDeliveryData } from '@/services/deliveryService';
import { generateMockDeliveries } from '@/utils/mockDeliveryGenerator';
import type { DeliveryData } from '@/types/delivery';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DeliveryAnalysisPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    const loadDeliveryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchDeliveryData();
        
        if (result.error || !result.data || result.data.length === 0) {
          // If there's no real data, use mock data for demonstration
          console.log('Using mock data for demonstration');
          const mockData = generateMockDeliveries(150);
          setDeliveries(mockData);
          setUsingMockData(true);
        } else {
          setDeliveries(result.data);
          setUsingMockData(false);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        // In case of error, still use mock data
        const mockData = generateMockDeliveries(150);
        setDeliveries(mockData);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };

    loadDeliveryData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading delivery data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {usingMockData && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Demo Data:</strong> This report is using simulated data for demonstration purposes. 
            To see real analytics, import your delivery data into the system.
          </AlertDescription>
        </Alert>
      )}
      <DeliveryAnalysisReport deliveries={deliveries} />
    </div>
  );
};

export default DeliveryAnalysisPage;
