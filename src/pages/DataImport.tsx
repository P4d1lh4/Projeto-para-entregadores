import React, { useState, useMemo } from 'react';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';
import DataImportHeader from '@/components/data-import/DataImportHeader';
import TabsContainer from '@/components/data-import/TabsContainer';

const DataImport: React.FC = () => {
  const { deliveryData: deliveries, loading: isLoading, error, refetch } = useDeliveryData();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const { toast } = useToast();
  
  // Add stats for monitoring data quality
  const dataStats = useMemo(() => {
    if (deliveries.length === 0) {
      return { complete: 0, incomplete: 0, totalRecords: 0 };
    }
    
    // Count records with all critical fields filled
    const criticalFields = ['id', 'customerName', 'address', 'status'];
    
    const complete = deliveries.filter(delivery => 
      criticalFields.every(field => delivery[field as keyof DeliveryData])
    ).length;
    
    return {
      complete,
      incomplete: deliveries.length - complete,
      totalRecords: deliveries.length
    };
  }, [deliveries]);
  
  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: 'Data refreshed',
        description: `Loaded ${deliveries.length} delivery records`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    }
  };

  const handleClearData = async () => {
    try {
      dataService.clearData();
      await refetch();
      toast({
        title: 'Data cleared',
        description: 'All delivery data has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear data',
        variant: 'destructive',
      });
    }
  };
  
  const handleDataUploaded = async (data: DeliveryData[]) => {
    try {
      // The data will be handled by the dataService
      await refetch();
      setCurrentPage(1);
      
      toast({
        title: 'Data uploaded',
        description: `Successfully uploaded ${data.length} records`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload data',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto p-4 py-6 space-y-6 max-w-7xl">
      <DataImportHeader 
        isLoading={isLoading} 
        onRefresh={handleRefresh} 
        onClearData={handleClearData}
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