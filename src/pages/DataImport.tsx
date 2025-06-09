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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseIcon } from 'lucide-react';

interface DataImportProps {
  onDataUploaded?: (data: any[]) => void;
}

const DataImport: React.FC<DataImportProps> = ({ onDataUploaded }) => {
  const { deliveryData: deliveries, loading: isLoading, error, refetch } = useDeliveryData();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const { toast } = useToast();
  
  // Configure maximum file size (in MB) - can be adjusted based on needs
  const maxFileSizeMB = 200; // 200MB limit for large datasets
  
  // Add stats for monitoring data quality
  const dataStats = useMemo(() => {
    if (deliveries.length === 0) {
      return { complete: 0, incomplete: 0, totalRecords: 0 };
    }
    
    // Count records with all critical fields filled
    const criticalFields: (keyof DeliveryData)[] = ['id', 'customerName', 'address', 'status'];
    
    const complete = deliveries.filter(delivery => 
      criticalFields.every(field => delivery[field])
    ).length;
    
    return {
      complete,
      incomplete: deliveries.length - complete,
      totalRecords: deliveries.length
    };
  }, [deliveries]);
  
  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Dados atualizados',
      description: `Foram carregados ${deliveries.length} registros de entrega.`,
    });
  };

  const handleClearData = async () => {
    try {
      await dataService.clearData();
      await refetch();
      toast({
        title: 'Dados Limpos',
        description: 'Todos os dados de entrega foram removidos do sistema.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao Limpar',
        description: 'Não foi possível limpar os dados.',
        variant: 'destructive',
      });
    }
  };
  
  const handleFileUploadSuccess = async (uploadedData: DeliveryData[]) => {
    // A lógica de salvar os dados agora é responsabilidade do componente pai,
    // que tem acesso ao 'updateData' do hook.
    if (onDataUploaded) {
      onDataUploaded(uploadedData);
    } else {
      // Fallback: se nenhuma função for passada, apenas busca os dados novamente.
      // Isso pode não refletir imediatamente os dados novos se a atualização for assíncrona.
      await refetch();
    }
    
    setCurrentPage(1); // Reseta a paginação para a primeira página
    
    toast({
      title: 'Upload Concluído',
      description: `O sistema foi atualizado com ${uploadedData.length} novos registros.`,
    });
  };
  
  const totalPages = Math.ceil(deliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <div className="container mx-auto p-4 py-6 space-y-8 max-w-7xl">
      <DataImportHeader 
        isLoading={isLoading} 
        onRefresh={handleRefresh} 
        onClearData={handleClearData}
        recordCount={deliveries.length}
        dataQuality={dataStats}
      />
      
      <DragDropFileUpload 
        onDataUploaded={handleFileUploadSuccess}
        maxFileSizeMB={maxFileSizeMB}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Dados Atuais no Sistema
          </CardTitle>
          <CardDescription>
            {deliveries.length > 0
              ? `Exibindo ${deliveries.length} registros de entrega. Utilize a importação acima para adicionar ou substituir dados.`
              : 'Nenhum dado carregado. Importe um arquivo para começar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : deliveries.length > 0 ? (
            <DeliveryTable 
              deliveries={deliveries}
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              setCurrentPage={setCurrentPage}
              isLoading={isLoading}
            />
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImport; 