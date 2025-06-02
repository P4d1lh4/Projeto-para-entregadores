
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseFile, formatDeliveryData } from '@/lib/file-utils';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';

type UseFileUploadResult = {
  parsedData: DeliveryData[];
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['xlsx', 'xls'].includes(fileExt)) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    setParsedData([]);
    
    try {
      // Parse the file
      const rawData = await parseFile(file);
      const deliveryData = formatDeliveryData(rawData);
      
      if (deliveryData.length === 0) {
        toast({
          title: 'No data found',
          description: 'The file appears to be empty or in an incorrect format',
          variant: 'destructive',
        });
        setIsProcessing(false);
        return;
      }
      
      // Log a summary of what we found
      console.log(`Found ${deliveryData.length} records with the following fields:`);
      const sampleRecord = deliveryData[0];
      const populatedFields = Object.entries(sampleRecord)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([key]) => key);
      console.log('Populated fields:', populatedFields);
      
      setParsedData(deliveryData);
      setCurrentPage(1);
      
      toast({
        title: 'File parsed successfully',
        description: `Found ${deliveryData.length} delivery records`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleClear = useCallback(() => {
    setParsedData([]);
    setUploadProgress(0);
  }, []);

  const handleUpload = useCallback(async () => {
    if (parsedData.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10); // Initial progress indication
    
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);
      
      // Update data service
      await dataService.updateDeliveryData(parsedData);
      const result = { success: true, count: parsedData.length };
      
      // Clear parsed data after successful upload
      setParsedData([]);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        toast({
          title: 'Upload successful',
          description: `${result.count} delivery records have been uploaded`,
        });
        
        if (onDataUploaded) {
          onDataUploaded(parsedData);
        }
      } else {
        toast({
          title: 'Upload failed',
          description: 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during upload:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [parsedData, toast, onDataUploaded]);

  return {
    parsedData,
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
