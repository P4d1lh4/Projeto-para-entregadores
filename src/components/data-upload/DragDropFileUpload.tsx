
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseFoxDeliveryFile } from '@/utils/excel-parser';
import { uploadDeliveryData } from '@/services/deliveryService';
import type { FoxDelivery } from '@/types/delivery';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type DragDropFileUploadProps = {
  onDataUploaded?: (data: FoxDelivery[]) => void;
};

// Helper function to format dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '—';
  }
};

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({ onDataUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<FoxDelivery[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Column definitions - preview columns to display
  const previewColumns = [
    { key: 'job_id', label: 'Job ID' },
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'delivering_driver', label: 'Driver' },
    { key: 'service_type', label: 'Service' },
    { key: 'cost', label: 'Cost' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created', format: formatDate }
  ];
  
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
        
        if (onDataUploaded) {
          onDataUploaded(parsedData);
        }
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
  
  // Calculate pagination
  const totalPages = Math.ceil(parsedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = parsedData.slice(startIndex, endIndex);
  
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
            
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewColumns.map(column => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.map((item, index) => (
                      <TableRow key={index}>
                        {previewColumns.map(column => (
                          <TableCell key={`${index}-${column.key}`}>
                            {column.format 
                              ? column.format(item[column.key as keyof FoxDelivery] as string)
                              : column.key === 'cost'
                                ? item.cost ? `$${item.cost.toFixed(2)}` : '—'
                                : item[column.key as keyof FoxDelivery] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {parsedData.length > itemsPerPage && (
                <div className="flex items-center justify-between p-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, parsedData.length)} of {parsedData.length} records
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Debug information for the user */}
            <div className="mt-4 p-4 bg-slate-50 border rounded-md">
              <h4 className="text-sm font-medium mb-2">Data Preview Information</h4>
              <p className="text-xs text-muted-foreground">
                The following fields were detected in the Excel file:
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(parsedData[0] || {})
                  .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                  .map(([key]) => (
                    <span 
                      key={key} 
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                      bg-slate-200 text-slate-800 font-medium"
                    >
                      {key.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
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
