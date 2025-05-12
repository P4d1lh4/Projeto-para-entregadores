
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseFoxDeliveryFile } from '@/utils/excel-parser';
import { uploadDeliveryData } from '@/services/deliveryService';
import type { FoxDelivery } from '@/types/delivery';
import { Progress } from '@/components/ui/progress';

type DragDropFileUploadProps = {
  onDataUploaded?: (data: FoxDelivery[]) => void;
};

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({ onDataUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<FoxDelivery[]>([]);
  const [previewCount, setPreviewCount] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);
  
  const handleFile = async (file: File) => {
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
      const deliveryData = await parseFoxDeliveryFile(file);
      
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
      
      if (onDataUploaded) {
        onDataUploaded(deliveryData);
      }
      
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
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleClear = () => {
    setParsedData([]);
    setUploadProgress(0);
  };
  
  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10); // Initial progress indication
    
    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 300);
      
      // Upload to Supabase
      const result = await uploadDeliveryData(parsedData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        toast({
          title: 'Upload successful',
          description: `${result.count} delivery records have been uploaded`,
        });
      } else {
        toast({
          title: 'Upload failed',
          description: result.error || 'An unknown error occurred',
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
  };
  
  const togglePreviewCount = () => {
    setPreviewCount(previewCount === 5 ? parsedData.length : 5);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Delivery Data
        </CardTitle>
        <CardDescription>
          Upload your delivery data from Excel files (.xlsx, .xls)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parsedData.length === 0 ? (
          <div 
            className={`flex flex-col items-center justify-center border-2 ${
              isDragging ? 'border-primary' : 'border-dashed border-gray-300'
            } rounded-lg p-6 text-center transition-colors duration-200 cursor-pointer`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
              <Package className="h-12 w-12 mx-auto" />
            </div>
            
            <p className="mb-4 text-sm font-medium">
              {isDragging 
                ? 'Drop the file here' 
                : 'Drag and drop your Excel file here, or click to browse'}
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            
            {isProcessing ? (
              <div className="flex items-center mt-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Processing file...</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Supported formats: XLSX, XLS
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span><strong>{parsedData.length}</strong> records parsed successfully</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
            
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Job ID</th>
                      <th className="p-2 text-left">Customer</th>
                      <th className="p-2 text-left">Driver</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, previewCount).map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.job_id || '—'}</td>
                        <td className="p-2">{item.customer_name || '—'}</td>
                        <td className="p-2">{item.delivering_driver || '—'}</td>
                        <td className="p-2">{item.status || '—'}</td>
                        <td className="p-2">
                          {item.created_at 
                            ? new Date(item.created_at).toLocaleDateString() 
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {parsedData.length > 5 && (
                <div className="p-2 text-center border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={togglePreviewCount}
                  >
                    {previewCount === 5 ? `Show all (${parsedData.length})` : 'Show less'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {parsedData.length > 0 && (
        <CardFooter>
          <Button 
            className="w-full"
            onClick={handleUpload}
            disabled={isUploading || parsedData.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload to Database
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default DragDropFileUpload;
