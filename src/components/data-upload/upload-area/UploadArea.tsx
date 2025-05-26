
import React, { useRef, useState, useCallback } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

type UploadAreaProps = {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
};

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      onFileSelected(files[0]);
    }
  }, [onFileSelected]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  }, [onFileSelected]);

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
        <FileSpreadsheet className="h-16 w-16 mx-auto" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {isDragging 
          ? 'Drop your Excel file here' 
          : 'Import Excel Delivery Data'}
      </h3>
      
      <p className="mb-6 text-sm text-muted-foreground max-w-md">
        {isDragging 
          ? 'Release to upload your file' 
          : 'Upload your delivery data from Excel files (.xlsx, .xls) by clicking the button below or dragging files here'}
      </p>
      
      <Button 
        onClick={handleButtonClick}
        disabled={isProcessing}
        size="lg"
        className="mb-4"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Select Excel File
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      
      {isProcessing ? (
        <div className="flex items-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Processing file...</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Supported formats: Excel (.xlsx, .xls)
        </p>
      )}
    </div>
  );
};

export default UploadArea;
