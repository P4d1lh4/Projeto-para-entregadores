import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { 
  Upload, 
  File, 
  Download, 
  Calendar, 
  FileText, 
  Database,
  Trash2,
  Archive,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { format } from 'date-fns';

interface FileStorageManagerProps {
  onFileStored?: (fileName: string, fileUrl: string) => void;
  bucketName?: string;
}

export const FileStorageManager: React.FC<FileStorageManagerProps> = ({
  onFileStored,
  bucketName = 'csv-imports'
}) => {
  const storage = useSupabaseStorage({
    bucketName,
    autoCreateBucket: true,
    isPublic: false,
    allowedMimeTypes: [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    fileSizeLimit: 50 * 1024 * 1024 // 50MB
  });

  // Initialize storage and load files on mount
  useEffect(() => {
    const init = async () => {
      const bucketReady = await storage.ensureBucketExists();
      if (bucketReady) {
        await storage.listFiles();
      }
    };
    init();
  }, [storage]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    const result = await storage.uploadFile(file);
    
    if (result.success && onFileStored) {
      const publicUrl = storage.getPublicUrl(file.name) || '';
      onFileStored(file.name, publicUrl);
    }
  };

  // File input handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'xlsx':
      case 'xls':
        return <File className="h-4 w-4 text-blue-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  if (storage.bucketExists === false) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Storage bucket could not be initialized. Please check your Supabase configuration and permissions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Store
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            File Archive ({storage.files.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Store Files in Supabase Storage
              </CardTitle>
              <CardDescription>
                Upload CSV/XLSX files to be permanently stored in Supabase Storage for audit trail and re-processing.
                Files are securely stored and can be downloaded anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {storage.isUploading ? (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto animate-pulse text-primary" />
                    <div>
                      <p className="text-lg font-medium">Uploading to Storage...</p>
                      <p className="text-sm text-muted-foreground">
                        Storing file securely in Supabase
                      </p>
                    </div>
                    {storage.uploadProgress > 0 && (
                      <div className="max-w-md mx-auto">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${storage.uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {storage.uploadProgress}% complete
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Database className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Upload Files to Storage</p>
                      <p className="text-sm text-muted-foreground">
                        Files will be stored permanently for audit and re-processing
                      </p>
                    </div>
                    <label htmlFor="storage-file-upload">
                      <Button variant="outline" size="lg" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Select File to Store
                      </Button>
                    </label>
                    <input
                      id="storage-file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleFileInputChange}
                      disabled={storage.isUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported: CSV, XLSX, XLS (max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Stored Files Archive
              </CardTitle>
              <CardDescription>
                Files permanently stored in Supabase Storage. You can download or delete files as needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {storage.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading stored files...</span>
                </div>
              ) : storage.files.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No files stored yet</p>
                  <p className="text-sm text-muted-foreground">
                    Upload files using the "Upload & Store" tab to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {storage.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.name)}
                        <div>
                          <p className="font-medium">
                            {file.name.split('_').slice(1).join('_')} {/* Remove timestamp prefix */}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(file.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                            <span>{formatFileSize(file.metadata?.size || 0)}</span>
                            <Badge variant="outline" className="text-xs">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => storage.downloadFile(file.name)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => storage.deleteFile(file.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileStorageManager; 