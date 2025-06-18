import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Upload, CheckCircle2, Loader2, Trash2, Plus, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import UploadArea from './upload-area/UploadArea';
import PreviewTable from './preview-table/PreviewTable';
import UploadProgress from './upload-progress/UploadProgress';
import { useToast } from '@/hooks/use-toast';
import { parseFile, formatDeliveryData } from '@/lib/file-utils';
import { parseDeliveryFile } from '@/utils/excel-parser';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';
import type { DeliveryData as DeliveryRecord } from '@/types/delivery';

type MultipleFileUploadProps = {
  onDataUploaded?: (data: DeliveryData[]) => void;
  maxFileSizeMB?: number;
  existingDataCount?: number;
};

type ProcessingStatus = {
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  recordCount?: number;
  error?: string;
};

const MultipleFileUpload: React.FC<MultipleFileUploadProps> = ({ 
  onDataUploaded, 
  maxFileSizeMB = 100,
  existingDataCount = 0
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedData, setParsedData] = useState<DeliveryData[]>([]);
  const [foxData, setFoxData] = useState<DeliveryRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
  const [combineWithExisting, setCombineWithExisting] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const { toast } = useToast();

  // Handle multiple files selected
  const handleMultipleFilesSelected = useCallback(async (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Initialize processing status for new files
    const newStatuses: ProcessingStatus[] = files.map(file => ({
      fileName: file.name,
      status: 'pending',
      progress: 0
    }));
    
    setProcessingStatus(prev => [...prev, ...newStatuses]);
  }, []);

  // Remove file from selection
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setProcessingStatus(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Process all selected files
  const handleProcessFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    let allParsedData: DeliveryData[] = [];
    let allFoxData: DeliveryRecord[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Update status to processing
        setProcessingStatus(prev => prev.map((status, idx) => 
          idx === i ? { ...status, status: 'processing', progress: 0 } : status
        ));

        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setProcessingStatus(prev => prev.map((status, idx) => 
              idx === i && status.status === 'processing' 
                ? { ...status, progress: Math.min(status.progress + 10, 90) } 
                : status
            ));
          }, 200);

          // Try Fox format first
          let fileData: DeliveryData[] = [];
          let foxFileData: DeliveryRecord[] = [];

          try {
            foxFileData = await parseDeliveryFile(file);
            fileData = formatDeliveryData(foxFileData);
            console.log(`📋 Parsed ${fileData.length} Fox delivery records from ${file.name}`);
          } catch (foxError) {
            console.log(`📋 Fox format failed for ${file.name}, trying generic format...`);
            const parsedResult = await parseFile(file);
            fileData = formatDeliveryData(parsedResult.data);
            console.log(`📋 Parsed ${fileData.length} generic delivery records from ${file.name}`);
          }

          clearInterval(progressInterval);

          // Update status to completed
          setProcessingStatus(prev => prev.map((status, idx) => 
            idx === i ? { 
              ...status, 
              status: 'completed', 
              progress: 100, 
              recordCount: fileData.length 
            } : status
          ));

          allParsedData = [...allParsedData, ...fileData];
          allFoxData = [...allFoxData, ...foxFileData];

        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          
          setProcessingStatus(prev => prev.map((status, idx) => 
            idx === i ? { 
              ...status, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Processing failed'
            } : status
          ));

          toast({
            title: 'Error processing file',
            description: `Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      }

      setParsedData(allParsedData);
      setFoxData(allFoxData);

      toast({
        title: 'Files processed successfully',
        description: `Processed ${selectedFiles.length} files with ${allParsedData.length} total records`,
      });

    } catch (error) {
      console.error('Error in batch processing:', error);
      toast({
        title: 'Batch processing error',
        description: 'There was a problem processing the files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, toast]);

  // Upload processed data
  const handleUpload = useCallback(async () => {
    if (parsedData.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Realistic progress tracking with specific stages
      const updateProgress = (percentage: number, stage?: string) => {
        setUploadProgress(percentage);
        if (stage) {
          setCurrentStage(stage);
          console.log(`📊 Upload Progress: ${percentage}% - ${stage}`);
        }
      };

              updateProgress(10, 'Starting upload...');
        await new Promise(resolve => setTimeout(resolve, 200));

        if (combineWithExisting && existingDataCount > 0) {
          updateProgress(20, 'Loading existing data...');
        // Get existing data and combine
        const existingDataResult = await dataService.getDeliveryData();
        
        // Robust error handling and data validation
        if (existingDataResult.error) {
          throw new Error(`Failed to load existing data: ${existingDataResult.error}`);
        }
        
        const existingData = existingDataResult.data || [];
        
        // Validate that existingData is actually an array
        if (!Array.isArray(existingData)) {
          console.warn('⚠️ Existing data is not an array, falling back to empty array');
          const combinedData = [...parsedData];
          
          if (foxData.length > 0) {
            await dataService.updateFromFoxData([...foxData]);
          } else {
            await dataService.updateDeliveryData(combinedData);
          }
        } else {
          const combinedData = [...existingData, ...parsedData];
          
          updateProgress(40, 'Combining data...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (foxData.length > 0) {
            updateProgress(60, 'Processing Fox data...');
            await dataService.updateFromFoxData([...foxData]);
            updateProgress(90, 'Finalizing processing...');
          } else {
            updateProgress(70, 'Updating database...');
            await dataService.updateDeliveryData(combinedData);
            updateProgress(90, 'Finalizing...');
          }
          
          toast({
            title: 'Data combined successfully',
            description: `Added ${parsedData.length} new records to existing ${existingData.length} records. Total: ${combinedData.length} records.`,
          });
        }
      } else {
        // Replace existing data
        updateProgress(30, 'Preparing data...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (foxData.length > 0) {
          updateProgress(50, 'Processing Fox data...');
          await dataService.updateFromFoxData(foxData);
          updateProgress(85, 'Finalizing processing...');
        } else {
          updateProgress(60, 'Updating database...');
          await dataService.updateDeliveryData(parsedData);
          updateProgress(85, 'Finalizing...');
        }

        toast({
          title: 'Data uploaded successfully',
          description: `Uploaded ${parsedData.length} delivery records`,
        });
      }

      updateProgress(100, 'Upload completed!');

      if (onDataUploaded) {
        onDataUploaded(parsedData);
      }

      // Clear processed data after successful upload
      setTimeout(() => {
        handleClear();
      }, 2000);

    } catch (error) {
      console.error('Error uploading data:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 3000);
    }
  }, [parsedData, foxData, combineWithExisting, existingDataCount, onDataUploaded, toast]);

  // Clear all data
  const handleClear = useCallback(() => {
    setSelectedFiles([]);
    setParsedData([]);
    setFoxData([]);
    setProcessingStatus([]);
    setCurrentPage(1);
  }, []);

  const totalPages = Math.ceil(parsedData.length / itemsPerPage);
  const hasValidFiles = selectedFiles.length > 0;
  const hasProcessedData = parsedData.length > 0;
  const completedFiles = processingStatus.filter(s => s.status === 'completed').length;
  const failedFiles = processingStatus.filter(s => s.status === 'error').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Multiple File Upload
        </CardTitle>
        <CardDescription>
          Select multiple Excel (.xlsx, .xls) or CSV files for batch processing.
          {existingDataCount > 0 && (
            <span className="block mt-1 text-blue-600">
              📊 Existing data: {existingDataCount} records
            </span>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <UploadArea
          onFileSelected={() => {}} // Not used in multiple mode
          onMultipleFilesSelected={handleMultipleFilesSelected}
          isProcessing={isProcessing}
          maxFileSizeMB={maxFileSizeMB}
          allowMultiple={true}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
        />

        {/* Processing Options */}
        {hasValidFiles && !hasProcessedData && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <Settings className="h-4 w-4 text-gray-600" />
              <div className="flex-1">
                <Label htmlFor="combine-data" className="text-sm font-medium">
                  Combine with existing data
                </Label>
                <p className="text-xs text-muted-foreground">
                  {combineWithExisting 
                    ? 'New data will be added to existing data' 
                    : 'Existing data will be replaced'}
                </p>
              </div>
              <Switch
                id="combine-data"
                checked={combineWithExisting}
                onCheckedChange={setCombineWithExisting}
                disabled={existingDataCount === 0}
              />
            </div>

            <Button 
              onClick={handleProcessFiles}
              disabled={isProcessing || selectedFiles.length === 0}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing Files...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Processing Status */}
        {processingStatus.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Processing Status</h4>
            <div className="space-y-2">
              {processingStatus.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {status.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {status.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                      {status.status === 'error' && <Trash2 className="h-4 w-4 text-red-600" />}
                      {status.status === 'pending' && <FileSpreadsheet className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{status.fileName}</p>
                      {status.recordCount && (
                        <p className="text-xs text-muted-foreground">{status.recordCount} records</p>
                      )}
                      {status.error && (
                        <p className="text-xs text-red-600">{status.error}</p>
                      )}
                    </div>
                  </div>
                  {status.status === 'processing' && (
                    <div className="w-20">
                      <Progress value={status.progress} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {completedFiles > 0 && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {completedFiles} file{completedFiles > 1 ? 's processed' : ' processed'} successfully.
                  {failedFiles > 0 && ` ${failedFiles} file${failedFiles > 1 ? 's failed' : ' failed'}.`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Data Preview */}
        {hasProcessedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Processed Data ({parsedData.length} records)
              </h4>
              <div className="flex gap-2">
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || parsedData.length === 0}
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {combineWithExisting && existingDataCount > 0 
                        ? `Add to ${existingDataCount} existing`
                        : 'Upload Data'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <UploadProgress 
              progress={uploadProgress} 
              currentStage={currentStage}
              isCompleted={uploadProgress === 100 && !isUploading}
            />

            <PreviewTable
              data={parsedData}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultipleFileUpload; 