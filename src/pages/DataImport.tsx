import React, { useState, useMemo } from 'react';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';
import DataImportHeader from '@/components/data-import/DataImportHeader';
import DragDropFileUpload from '@/components/data-upload/DragDropFileUpload';
import DeliveryTable from '@/components/data-import/DeliveryTable';
import EmptyState from '@/components/data-import/EmptyState';
import LoadingState from '@/components/data-import/LoadingState';
import StorageInfo from '@/components/storage/StorageInfo';
import StorageWarning from '@/components/storage/StorageWarning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseIcon } from 'lucide-react';

interface DataImportProps {
  onDataUploaded?: (data: any[]) => void;
}

const DataImport: React.FC<DataImportProps> = ({ onDataUploaded }) => {
  const {
    deliveryData: data,
    loading,
    error,
    refetch,
    updateData,
    setError,
  } = useDeliveryData();

  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handleDataUpload = async (newData: any[]) => {
    try {
      await updateData(newData);
      await refetch();
      if (onDataUploaded) {
        onDataUploaded(newData);
      }
      toast({
        title: 'Data loaded successfully',
        description: `${newData.length} records were imported.`,
      });
    } catch (error) {
      console.error('Error in handleDataUpload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading data';
      setError(errorMessage);
      toast({
        title: 'Error loading data',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DataImportHeader 
        isLoading={loading}
        onRefresh={refetch}
        recordCount={data.length}
        onClearData={() => {
          dataService.clearAllData();
          refetch();
        }}
      />

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <DatabaseIcon className="h-5 w-5" />
              Data Loading Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Storage Warning */}
      <StorageWarning 
        onClearStorage={() => {
          dataService.clearAllData();
          refetch();
          toast({
            title: 'Data cleared',
            description: 'All locally stored data has been removed.',
          });
        }}
        showDetails={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DragDropFileUpload 
            onDataUploaded={handleDataUpload}
            maxFileSizeMB={200} // Increased from 100MB to 200MB
          />
        </div>
        <div className="space-y-4">
          <StorageInfo />
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <DeliveryTable
          deliveries={data}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={(currentPage - 1) * itemsPerPage}
          endIndex={Math.min(currentPage * itemsPerPage, data.length)}
          setCurrentPage={setCurrentPage}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default DataImport;
