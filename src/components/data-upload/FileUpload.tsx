import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseFile, formatDeliveryData } from '@/lib/file-utils';

type FileUploadProps = {
  onDataUploaded: (data: any[]) => void;
};

const FileUpload: React.FC<FileUploadProps> = ({ onDataUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !['csv', 'xlsx', 'xls'].includes(fileExt)) {
      toast({
        title: 'Invalid file format',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const parsedResult = await parseFile(file);
      const formattedData = formatDeliveryData(parsedResult.data);
      
      onDataUploaded(formattedData);
      
      toast({
        title: 'File uploaded successfully',
        description: `Processed ${formattedData.length} delivery records`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error parsing file',
        description: 'There was a problem processing your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Delivery Data</CardTitle>
        <CardDescription>
          Upload your delivery data as CSV or Excel file
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="mb-4 text-primary">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          
          <p className="mb-4 text-sm text-muted-foreground">
            Drag and drop your file here, or click to browse
          </p>
          
          <label htmlFor="file-upload">
            <div className="relative">
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="w-full"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          </label>
          
          <p className="mt-2 text-xs text-muted-foreground">
            Supported formats: CSV, XLSX, XLS
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
