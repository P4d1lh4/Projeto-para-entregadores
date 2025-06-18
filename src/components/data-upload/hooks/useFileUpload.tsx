import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseFile, formatDeliveryData } from '@/lib/file-utils';
import { parseDeliveryFile } from '@/utils/excel-parser';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';
import type { DeliveryData as DeliveryRecord } from '@/types/delivery';

type UseFileUploadResult = {
  parsedData: DeliveryData[];
  foxData: DeliveryRecord[]; // Original XLSX data for debugging
  isProcessing: boolean;
  isUploading: boolean;
  uploadProgress: number;
  currentPage: number;
  itemsPerPage: number;
  handleFile: (file: File) => void;
  handleClear: () => void;
  handleUpload: () => Promise<void>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export const useFileUpload = (
  onDataUploaded?: (data: DeliveryData[]) => void
): UseFileUploadResult => {
  const [parsedData, setParsedData] = useState<DeliveryData[]>([]);
  const [foxData, setFoxData] = useState<DeliveryRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['xlsx', 'xls', 'csv'].includes(fileExt)) {
      toast({
        title: 'Formato de arquivo inválido',
        description: 'Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV (.csv).',
        variant: 'destructive',
      });
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      toast({
        title: 'Processando arquivo grande',
        description: `Tamanho do arquivo: ${fileSizeMB.toFixed(2)}MB. Isso pode levar um momento.`,
      });
    }
    
    setIsProcessing(true);
    setParsedData([]);
    setFoxData([]);
    
    try {
      let rawData: any[] = [];
      let foxRawData: DeliveryRecord[] = [];
      
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        console.log('📊 Processando arquivo Excel com parser específico...');
        foxRawData = await parseDeliveryFile(file);
        rawData = foxRawData;
        setFoxData(foxRawData); // Store the original Fox data
      } else {
        console.log('📄 Processando arquivo CSV com PapaParse...');
        const results = await parseFile(file);
        rawData = results.data || [];
      }
      
      if (rawData.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'O arquivo parece estar vazio ou em um formato incorreto.',
          variant: 'destructive',
        });
        return;
      }

      console.log(`✅ Arquivo ${fileExt.toUpperCase()} processado, ${rawData.length} registros brutos encontrados.`);
      
      const deliveryData = formatDeliveryData(rawData);
      
      setParsedData(deliveryData);
      setCurrentPage(1);
      
      toast({
        title: 'Arquivo pronto para upload',
        description: `${deliveryData.length} registros foram processados e estão prontos para serem enviados.`,
      });
      
    } catch (error) {
      console.error('Erro ao processar o arquivo:', error);
      toast({
        title: 'Erro ao processar o arquivo',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleClear = useCallback(() => {
    setParsedData([]);
    setFoxData([]);
    setUploadProgress(0);
  }, []);

  const handleUpload = useCallback(async () => {
    if (parsedData.length === 0) {
      toast({
        title: 'Nenhum dado para enviar',
        description: 'Não há dados processados para carregar.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);
      
      // Use Fox data if available, otherwise use parsed data
      if (foxData.length > 0) {
        await dataService.updateFromFoxData(foxData);
      } else {
      await dataService.updateDeliveryData(parsedData);
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Upload bem-sucedido',
        description: `${parsedData.length} registros de entrega foram carregados.`,
      });
      
      // Clear parsed data after successful upload
      const uploadedData = [...parsedData];
      setParsedData([]);
      setFoxData([]);
      
      if (onDataUploaded) {
        onDataUploaded(uploadedData);
      }
      
    } catch (error) {
      console.error('Erro durante o upload:', error);
      toast({
        title: 'Falha no upload',
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.',
        variant: 'destructive',
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [parsedData, foxData, toast, onDataUploaded]);

  return {
    parsedData,
    foxData, // Return the actual Fox data
    isProcessing,
    isUploading,
    uploadProgress,
    currentPage,
    itemsPerPage,
    handleFile,
    handleClear,
    handleUpload,
    setCurrentPage,
  };
};
