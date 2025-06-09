import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Upload, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import UploadArea from './upload-area/UploadArea';
import PreviewTable from './preview-table/PreviewTable';
import UploadProgress from './upload-progress/UploadProgress';
import { useFileUpload } from './hooks/useFileUpload';
import type { DeliveryData } from '@/features/deliveries/types';

type DragDropFileUploadProps = {
  onDataUploaded?: (data: DeliveryData[]) => void;
  maxFileSizeMB?: number;
};

const DragDropFileUpload: React.FC<DragDropFileUploadProps> = ({ 
  onDataUploaded, 
  maxFileSizeMB = 100
}) => {
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

  const totalPages = Math.ceil(parsedData.length / itemsPerPage);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importar Dados de Entrega
        </CardTitle>
        <CardDescription>
          Envie seus dados de entrega de arquivos Excel (.xlsx, .xls) ou CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parsedData.length === 0 ? (
          <UploadArea 
            onFileSelected={handleFile} 
            isProcessing={isProcessing} 
            maxFileSizeMB={maxFileSizeMB}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-900">Arquivo processado com sucesso</h4>
                  <p className="text-sm text-green-700">
                    <strong>{parsedData.length}</strong> registros prontos para upload.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear} className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Limpar
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
          </div>
        )}
      </CardContent>
      
      {parsedData.length > 0 && (
        <CardFooter className="bg-slate-50 p-4 border-t rounded-b-lg">
          <div className="w-full flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={isUploading || parsedData.length === 0}
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Confirmar Upload
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default DragDropFileUpload;
