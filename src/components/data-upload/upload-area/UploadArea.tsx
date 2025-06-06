import React, { useRef, useState, useCallback } from 'react';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type UploadAreaProps = {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  maxFileSizeMB?: number; // Maximum file size in MB
};

// Default maximum file size: 100MB
const DEFAULT_MAX_FILE_SIZE_MB = 100;

const UploadArea: React.FC<UploadAreaProps> = ({ 
  onFileSelected, 
  isProcessing, 
  maxFileSizeMB = DEFAULT_MAX_FILE_SIZE_MB 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to validate file size
  const validateFileSize = (file: File): boolean => {
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileSizeError(
        `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${maxFileSizeMB}MB. Please choose a smaller file.`
      );
      return false;
    }
    setFileSizeError(null);
    return true;
  };
  
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
      const file = files[0];
      if (validateFileSize(file)) {
        onFileSelected(file);
      }
    }
  }, [onFileSelected, validateFileSize]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFileSize(file)) {
        onFileSelected(file);
      }
    }
    // Clear the input so the same file can be selected again
    e.target.value = '';
  }, [onFileSelected, validateFileSize]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center border-2 ${
        isDragging ? 'border-primary bg-primary/5' : 'border-dashed border-gray-300'
      } rounded-lg p-8 text-center transition-all duration-200`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`mb-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}>
        <FileText className="h-16 w-16 mx-auto" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {isDragging 
          ? 'Drop your file here' 
          : 'Import Delivery Data'}
      </h3>
      
      <p className="mb-6 text-sm text-muted-foreground max-w-md">
        {isDragging 
          ? 'Release to upload your file' 
          : 'Upload your delivery data from Excel (.xlsx, .xls) or CSV (.csv) files by clicking the button below or dragging files here.'}
      </p>
      
      <Button 
        onClick={handleButtonClick}
        disabled={isProcessing}
        size="lg"
        className="mb-4"
      >
        <FileText className="h-4 w-4 mr-2" />
        Select File
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      
      {fileSizeError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileSizeError}</AlertDescription>
        </Alert>
      )}

      {isProcessing ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Processing file...</span>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Supported formats: .xlsx, .xls, .csv
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: {maxFileSizeMB}MB
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
