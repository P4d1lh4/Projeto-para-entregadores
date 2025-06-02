import React, { useEffect, useState } from 'react';
import DeliveryAnalysisReport from '@/components/analytics/DeliveryAnalysisReport';
import { fetchDeliveryData } from '@/services/deliveryService';
import { generateMockFoxDeliveries } from '@/utils/mockDeliveryGenerator';
import type { FoxDelivery } from '@/types/delivery';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DeliveryAnalysisPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<FoxDelivery[]>([]);
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
          // Se não há dados reais, usar dados mock para demonstração
          console.log('Usando dados mock para demonstração');
          const mockData = generateMockFoxDeliveries(150);
          setDeliveries(mockData);
          setUsingMockData(true);
        } else {
          setDeliveries(result.data);
          setUsingMockData(false);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        // Em caso de erro, ainda assim usar dados mock
        const mockData = generateMockFoxDeliveries(150);
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
          <p className="text-muted-foreground">Carregando dados de delivery...</p>
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
            <strong>Dados de Demonstração:</strong> Este relatório está usando dados simulados para demonstração. 
            Para ver análises reais, importe seus dados de delivery no sistema.
          </AlertDescription>
        </Alert>
      )}
      <DeliveryAnalysisReport deliveries={deliveries} />
    </div>
  );
};

export default DeliveryAnalysisPage; 