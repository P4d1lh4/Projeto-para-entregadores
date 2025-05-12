
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import UploadArea from './upload-area/UploadArea';
import PreviewTable from './preview-table/PreviewTable';
import DebugInfo from './debug-info/DebugInfo';
import UploadProgress from './upload-progress/UploadProgress';
import { useFileUpload } from './hooks/useFileUpload';
import type { FoxDelivery } from '@/types/delivery';

type DragDropFileUploadProps = {
  onDataUploaded?: (data: FoxDelivery[]) => void;
};

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({ onDataUploaded }) => {
  const {
    parsedData,
    isProcessing,
    isUploading,
    uploadProgress,
    currentPage,
    itemsPerPage,
    handleFile,
    handleClear,
    handleUpload,
    setCurrentPage,
  } = useFileUpload(onDataUploaded);

  // Calculate pagination
  const totalPages = Math.ceil(parsedData.length / itemsPerPage);
  
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
          <UploadArea onFileSelected={handleFile} isProcessing={isProcessing} />
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
            
            <UploadProgress progress={uploadProgress} />
            
            <PreviewTable
              data={parsedData}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
            />
            
            <DebugInfo data={parsedData} />
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
