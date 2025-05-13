
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileSpreadsheet, DatabaseIcon } from 'lucide-react';
import DragDropFileUpload from '@/components/data-upload/DragDropFileUpload';
import type { FoxDelivery } from '@/types/delivery';
import DeliveryTable from './DeliveryTable';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

type TabsContainerProps = {
  deliveries: FoxDelivery[];
  isLoading: boolean;
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  onDataUploaded: (data: FoxDelivery[]) => void;
};

const TabsContainer: React.FC<TabsContainerProps> = ({
  deliveries,
  isLoading,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  onDataUploaded
}) => {
  // Calculate pagination
  const totalPages = Math.ceil(deliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList>
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="database" className="flex items-center gap-2">
          <DatabaseIcon className="h-4 w-4" />
          Imported Data
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload" className="pt-4">
        <DragDropFileUpload onDataUploaded={onDataUploaded} />
      </TabsContent>
      
      <TabsContent value="database" className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="h-5 w-5" />
              Imported Deliveries
            </CardTitle>
            <CardDescription>
              {deliveries.length} records found in database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : deliveries.length > 0 ? (
              <DeliveryTable 
                deliveries={deliveries}
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                endIndex={endIndex}
                setCurrentPage={setCurrentPage}
                isLoading={isLoading}
              />
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default TabsContainer;
