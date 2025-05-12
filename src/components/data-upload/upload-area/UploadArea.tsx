
import React, { useRef, useState, useCallback } from 'react';
import { Loader2, Package } from 'lucide-react';

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

  return (
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
  );
};

export default UploadArea;
