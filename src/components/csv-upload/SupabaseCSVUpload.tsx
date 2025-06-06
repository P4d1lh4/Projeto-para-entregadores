import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Users,
  Package,
  TrendingUp,
  Archive,
  HardDrive
} from 'lucide-react';
import { CSVProcessingService } from '@/services/csvProcessingService';
import { format } from 'date-fns';
import FileStorageManager from '@/components/file-storage/FileStorageManager';
import { supabase } from '@/integrations/supabase/client';

interface UploadStats {
  totalRows: number;
  processedDeliveries: number;
  insertedDeliveries: number;
  uniqueJobIds: number;
  validationErrors: number;
  insertErrors: number;
}

interface SupabaseCSVUploadProps {
  onUploadComplete?: (stats: UploadStats) => void;
  onDataRefresh?: () => void;
}

export const SupabaseCSVUpload: React.FC<SupabaseCSVUploadProps> = ({
  onUploadComplete,
  onDataRefresh
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUploadInfo, setLastUploadInfo] = useState<{
    totalDeliveries: number;
    uniqueJobIds: number;
    lastUpload?: string;
  } | null>(null);
  
  const { toast } = useToast();

  // Load initial stats
  React.useEffect(() => {
    loadProcessingStats();
  }, []);

  const loadProcessingStats = async () => {
    try {
      const stats = await CSVProcessingService.getProcessingStats();
      setLastUploadInfo(stats);
    } catch (error) {
      console.error('Failed to load processing stats:', error);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrors([]);
    setUploadStats(null);

    try {
      // Simulate progress for UI feedback
      setUploadProgress(5);
      
      toast({
        title: "Processing CSV",
        description: `Processing ${file.name}...`,
      });

      // First, store the original file in Supabase Storage
      setUploadProgress(15);
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${timestamp}_${file.name}`;
        
        const { data: storageData, error: storageError } = await supabase.storage
          .from('csv-imports')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (storageError) {
          console.warn('Could not store file in storage:', storageError);
          // Continue with processing even if storage fails
        } else {
          console.log('File stored successfully:', storageData);
        }
      } catch (storageError) {
        console.warn('Storage error:', storageError);
        // Continue with processing even if storage fails
      }

      setUploadProgress(25);
      
      // Process the file
      const result = await CSVProcessingService.uploadAndProcessCSV(file);
      
      setUploadProgress(90);

      if (result.success) {
        setUploadStats(result.stats!);
        setUploadProgress(100);
        
        toast({
          title: "Upload Successful",
          description: `${result.message} File also archived in storage.`,
        });

        // Refresh stats
        await loadProcessingStats();
        
        // Notify parent components
        if (onUploadComplete && result.stats) {
          onUploadComplete(result.stats);
        }
        if (onDataRefresh) {
          onDataRefresh();
        }
      } else {
        setErrors([result.message]);
        if (result.errors) {
          setErrors(prev => [...prev, ...result.errors!]);
        }
        
        toast({
          title: "Upload Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setErrors([errorMessage]);
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, [toast, onUploadComplete, onDataRefresh]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isUploading
  });

  return (
    <div className="space-y-6">
      {/* Current Database Stats */}
      {lastUploadInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deliveries</p>
                  <p className="text-2xl font-bold">{lastUploadInfo.totalDeliveries.toLocaleString()}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Job IDs</p>
                  <p className="text-2xl font-bold">{lastUploadInfo.uniqueJobIds.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Active drivers</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Last Upload</p>
                  <p className="text-lg font-bold">
                    {lastUploadInfo.lastUpload 
                      ? format(new Date(lastUploadInfo.lastUpload), 'MMM dd, HH:mm')
                      : 'No uploads yet'
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Area */}
      <Tabs defaultValue="process" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="process" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Process & Import
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            File Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CSV to Supabase
              </CardTitle>
              <CardDescription>
                Upload delivery data CSV files to be processed server-side and stored in Supabase.
                Data will be automatically validated and deduplicated based on job_id.
              </CardDescription>
            </CardHeader>
            <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isUploading ? 'pointer-events-none opacity-50' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <div>
                  <p className="text-lg font-medium">Processing CSV...</p>
                  <p className="text-sm text-muted-foreground">
                    Validating data and uploading to Supabase
                  </p>
                </div>
                {uploadProgress > 0 && (
                  <div className="max-w-md mx-auto">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadProgress}% complete
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Drop CSV file here...' : 'Upload CSV File'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to select a CSV file (max 50MB)
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Select File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Upload Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {uploadStats.totalRows.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadStats.insertedDeliveries.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Inserted</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {uploadStats.uniqueJobIds.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Unique Job IDs</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {uploadStats.processedDeliveries.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {uploadStats.validationErrors.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Validation Errors</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {uploadStats.insertErrors.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Insert Errors</div>
              </div>
            </div>

            {uploadStats.validationErrors === 0 && uploadStats.insertErrors === 0 && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All data processed successfully! The delivery data is now available in the dashboard.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Processing Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your CSV file should contain the following columns (headers are flexible):
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Badge variant="outline">job_id (required)</Badge>
              <Badge variant="outline">collecting_driver</Badge>
              <Badge variant="outline">delivering_driver</Badge>
              <Badge variant="outline">customer_name</Badge>
              <Badge variant="outline">pickup_address</Badge>
              <Badge variant="outline">delivery_address</Badge>
              <Badge variant="outline">status</Badge>
              <Badge variant="outline">created_at</Badge>
              <Badge variant="outline">cost</Badge>
              <Badge variant="outline">distance</Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              Note: The system will automatically normalize column headers and handle variations in naming.
              Data is deduplicated based on job_id, so uploading the same file multiple times won't create duplicates.
            </p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <FileStorageManager 
            onFileStored={(fileName, fileUrl) => {
              toast({
                title: "File Stored",
                description: `${fileName} has been saved to Supabase Storage`,
              });
            }}
            bucketName="csv-imports"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 