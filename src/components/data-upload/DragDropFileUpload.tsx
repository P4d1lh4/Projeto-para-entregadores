import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Upload, CheckCircle2, Loader2, Trash2, Files } from 'lucide-react';
import UploadArea from './upload-area/UploadArea';
import MultipleFileUpload from './MultipleFileUpload';
import PreviewTable from './preview-table/PreviewTable';
import UploadProgress from './upload-progress/UploadProgress';
import { useFileUpload } from './hooks/useFileUpload';
import { dataService } from '@/features/deliveries/services/dataService';
import type { DeliveryData } from '@/features/deliveries/types';
import type { FoxDelivery } from '@/types/delivery';

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
    foxData, // Get the original Fox data for preview
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

  const totalPages = Math.ceil((foxData || parsedData).length / itemsPerPage);

  // Get existing data count for the multiple upload component
  const [existingDataCount, setExistingDataCount] = React.useState(0);

  React.useEffect(() => {
    const loadExistingDataCount = async () => {
      try {
        const result = await dataService.getDeliveryData();
        setExistingDataCount(result.data?.length || 0);
      } catch (error) {
        console.error('Error loading existing data count:', error);
        setExistingDataCount(0);
      }
    };

    loadExistingDataCount();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Delivery Data
        </CardTitle>
        <CardDescription>
          Upload your delivery data from Excel (.xlsx, .xls) or CSV files. 
          Choose between single or multiple upload.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Single Upload
            </TabsTrigger>
            <TabsTrigger value="multiple" className="flex items-center gap-2">
              <Files className="h-4 w-4" />
              Multiple Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="space-y-4">
          <UploadArea 
            onFileSelected={handleFile} 
            isProcessing={isProcessing} 
            maxFileSizeMB={maxFileSizeMB}
          />
            
            {(parsedData.length > 0 || (foxData && foxData.length > 0)) && (
          <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {(foxData && foxData.length > 0 ? foxData.length : parsedData.length)} registros encontrados
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            <Button 
              onClick={handleUpload}
                      disabled={isUploading || (parsedData.length === 0 && (!foxData || foxData.length === 0))}
                      size="sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                          Enviar Dados
                </>
              )}
            </Button>
          </div>
                </div>

                <UploadProgress progress={uploadProgress} />

                <PreviewTable
                  data={foxData || []}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  setCurrentPage={setCurrentPage}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="multiple" className="space-y-4">
            <MultipleFileUpload
              onDataUploaded={onDataUploaded}
              maxFileSizeMB={maxFileSizeMB}
              existingDataCount={existingDataCount}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DragDropFileUpload;
