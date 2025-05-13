
import React, { useState, useEffect } from 'react';
import { fetchDeliveryData } from '@/services/deliveryService';
import { useToast } from '@/hooks/use-toast';
import { FoxDelivery } from '@/types/delivery';
import DataImportHeader from '@/components/data-import/DataImportHeader';
import TabsContainer from '@/components/data-import/TabsContainer';

const DataImport: React.FC = () => {
  const [deliveries, setDeliveries] = useState<FoxDelivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const { toast } = useToast();
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchDeliveryData();
      
      if (error) {
        toast({
          title: 'Error',
          description: `Failed to load delivery data: ${error}`,
          variant: 'destructive',
        });
        return;
      }
      
      if (data) {
        setDeliveries(data);
        
        // Only show toast if explicitly refreshing
        if (deliveries.length > 0) {
          toast({
            title: 'Data refreshed',
            description: `Loaded ${data.length} delivery records`,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load delivery data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleDataUploaded = (data: FoxDelivery[]) => {
    // After successful upload, we'll refresh the data
    loadData();
  };
  
  return (
    <div className="container mx-auto p-4 py-6 space-y-6 max-w-7xl">
      <DataImportHeader isLoading={isLoading} onRefresh={loadData} />
      
      <TabsContainer
        deliveries={deliveries}
        isLoading={isLoading}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        setCurrentPage={setCurrentPage}
        onDataUploaded={handleDataUploaded}
      />
    </div>
  );
};

export default DataImport;
