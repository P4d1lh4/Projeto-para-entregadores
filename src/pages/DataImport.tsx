
import React, { useState, useEffect, useMemo } from 'react';
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
  
  // Add stats for monitoring data quality
  const dataStats = useMemo(() => {
    if (deliveries.length === 0) {
      return { complete: 0, incomplete: 0, totalRecords: 0 };
    }
    
    // Count records with all critical fields filled
    const criticalFields = ['job_id', 'customer_name', 'delivery_address', 'status'];
    
    const complete = deliveries.filter(delivery => 
      criticalFields.every(field => delivery[field as keyof FoxDelivery])
    ).length;
    
    return {
      complete,
      incomplete: deliveries.length - complete,
      totalRecords: deliveries.length
    };
  }, [deliveries]);
  
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
        // Process the data to ensure consistency
        const processedData = processImportedData(data);
        setDeliveries(processedData);
        
        if (deliveries.length > 0) {
          // Only show toast if explicitly refreshing
          toast({
            title: 'Data refreshed',
            description: `Loaded ${processedData.length} delivery records`,
          });
        } else if (processedData.length > 0) {
          // First load with data
          toast({
            title: 'Data loaded',
            description: `Found ${processedData.length} delivery records (${dataStats.complete} complete)`,
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
  
  // Process imported data for consistency
  const processImportedData = (data: FoxDelivery[]): FoxDelivery[] => {
    return data.map(delivery => {
      // Ensure all records have a status
      if (!delivery.status) {
        if (delivery.delivered_at) delivery.status = 'delivered';
        else if (delivery.canceled_at) delivery.status = 'canceled';
        else if (delivery.collected_at) delivery.status = 'in_transit';
        else if (delivery.accepted_at) delivery.status = 'accepted';
        else delivery.status = 'pending';
      }
      
      return delivery;
    });
  };
  
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleDataUploaded = (data: FoxDelivery[]) => {
    // After successful upload, refresh the data
    loadData();
    
    // Set to first page after upload
    setCurrentPage(1);
  };
  
  return (
    <div className="container mx-auto p-4 py-6 space-y-6 max-w-7xl">
      <DataImportHeader 
        isLoading={isLoading} 
        onRefresh={loadData} 
        recordCount={deliveries.length}
        dataQuality={dataStats}
      />
      
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
