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
    foxData,
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
          Upload your delivery data from Excel files (.xlsx, .xls) or CSV files
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parsedData.length === 0 && foxData.length === 0 ? (
          <UploadArea onFileSelected={handleFile} isProcessing={isProcessing} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {parsedData.length > 0 ? (
                  <span><strong>{parsedData.length}</strong> records parsed successfully</span>
                ) : (
                  <span><strong>{foxData.length}</strong> records processed with company data</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            </div>
            
            <UploadProgress progress={uploadProgress} />
            
            {parsedData.length > 0 && (
              <PreviewTable
                data={parsedData}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
              />
            )}
            
            {foxData.length > 0 && parsedData.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h4 className="text-sm font-semibold text-green-900">XLSX Data Processed Successfully</h4>
                </div>
                <p className="text-sm text-green-700">
                  Your Excel file has been processed and company data has been loaded into the system. 
                  You can now view the companies in the <strong>Companies</strong> page.
                </p>
              </div>
            )}
            
            <DebugInfo data={foxData.length > 0 ? foxData : parsedData} />
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
