import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseFile, formatDeliveryData } from '@/lib/file-utils';
import { parseFoxDeliveryFile } from '@/utils/excel-parser';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';
import type { FoxDelivery } from '@/types/delivery';

type UseFileUploadResult = {
  parsedData: DeliveryData[];
  foxData: FoxDelivery[]; // Original XLSX data for debugging
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
  const [foxData, setFoxData] = useState<FoxDelivery[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['xlsx', 'xls', 'csv'].includes(fileExt)) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.',
        variant: 'destructive',
      });
      return;
    }

    // Show file info for large files
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      console.log(`📁 Processing large file: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
      toast({
        title: 'Processing large file',
        description: `File size: ${fileSizeMB.toFixed(2)}MB. This may take a moment to process.`,
      });
    }
    
    setIsProcessing(true);
    setParsedData([]);
    setFoxData([]);
    
    try {
      // For XLSX files, use the specialized Fox parser to get company info
      if (fileExt === 'xlsx' || fileExt === 'xls') {
        console.log('📊 Processing XLSX file with company information...');
        
        // Parse using the Fox delivery parser to preserve company data
        const foxData = await parseFoxDeliveryFile(file);
        
        if (foxData.length === 0) {
          toast({
            title: 'No data found',
            description: 'The file appears to be empty or in an incorrect format',
            variant: 'destructive',
          });
          setIsProcessing(false);
          return;
        }
        
        // Store the fox data for debugging
        setFoxData(foxData);
        
        // Store the fox data directly in the data service for company processing
        await dataService.updateFromFoxData(foxData);
        
        // For XLSX with company data, we'll skip the preview and go directly to success
        setParsedData([]); // Empty for XLSX since we processed it directly
        setCurrentPage(1);
        
        toast({
          title: 'XLSX file processed successfully',
          description: `Found ${foxData.length} delivery records with company information`,
        });
        
        // Log company information found
        const companiesFound = [...new Set(foxData.map(d => d.company_name).filter(Boolean))];
        console.log(`🏢 Found companies: ${companiesFound.join(', ')}`);
        
        // Trigger the callback immediately for XLSX files
        if (onDataUploaded) {
          onDataUploaded([]);
        }
        
      } else {
        // For CSV files, use the regular parser
        console.log('📄 Processing CSV file...');
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
        
        setParsedData(deliveryData);
        setCurrentPage(1);
        
        toast({
          title: 'CSV file parsed successfully',
          description: `Found ${deliveryData.length} delivery records`,
        });
      }
      
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
  }, [toast, onDataUploaded]);

  const handleClear = useCallback(() => {
    setParsedData([]);
    setFoxData([]);
    setUploadProgress(0);
  }, []);

  const handleUpload = useCallback(async () => {
    if (parsedData.length === 0) {
      // For XLSX files that were processed directly, show success message
      toast({
        title: 'Data already loaded',
        description: 'XLSX file data has been processed and loaded into the system',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10); // Initial progress indication
    
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);
      
      // Update data service (for CSV files)
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
    foxData,
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
