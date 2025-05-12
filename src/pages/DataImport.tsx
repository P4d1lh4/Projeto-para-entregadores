
import React, { useState, useEffect } from 'react';
import DragDropFileUpload from '@/components/data-upload/DragDropFileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchDeliveryData } from '@/services/deliveryService';
import { FoxDelivery } from '@/types/delivery';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, DatabaseIcon, RefreshCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Helper function to format dates
const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '—';
  }
};

const DataImport: React.FC = () => {
  const [deliveries, setDeliveries] = useState<FoxDelivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const { toast } = useToast();
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await fetchDeliveryData();
      
      if (error) {
        toast({
          title: 'Error',
          description: `Failed to load delivery data: ${error}`,
          variant: 'destructive',
        });
        return;
      }
      
      if (data) {
        setDeliveries(data);
        
        // Only show toast if explicitly refreshing
        if (deliveries.length > 0) {
          toast({
            title: 'Data refreshed',
            description: `Loaded ${data.length} delivery records`,
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load delivery data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleDataUploaded = (data: FoxDelivery[]) => {
    // After successful upload, we'll refresh the data
    loadData();
  };
  
  // Calculate pagination
  const totalPages = Math.ceil(deliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDeliveries = deliveries.slice(startIndex, endIndex);
  
  // Column definitions - used to control which columns to display
  const columns = [
    { key: 'job_id', label: 'Job ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'company_name', label: 'Company' },
    { key: 'delivering_driver', label: 'Driver' },
    { key: 'delivery_address', label: 'Delivery Address' },
    { key: 'status', label: 'Status' },
    { key: 'service_type', label: 'Service Type' },
    { key: 'cost', label: 'Cost' },
    { key: 'created_at', label: 'Created', format: formatDate }
  ];
  
  return (
    <div className="container mx-auto p-4 py-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Import</h1>
        <Button 
          variant="outline" 
          onClick={loadData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
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
          <DragDropFileUpload onDataUploaded={handleDataUploaded} />
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
                <div className="flex justify-center items-center h-32">
                  <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : deliveries.length > 0 ? (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns.map((column) => (
                              <TableHead key={column.key}>{column.label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentDeliveries.map((delivery, index) => (
                            <TableRow key={delivery.id || index}>
                              {columns.map((column) => (
                                <TableCell key={`${delivery.id}-${column.key}`}>
                                  {column.format 
                                    ? column.format(delivery[column.key as keyof FoxDelivery] as string)
                                    : column.key === 'cost' 
                                      ? delivery.cost ? `$${delivery.cost.toFixed(2)}` : '—'
                                      : delivery[column.key as keyof FoxDelivery] || '—'}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, deliveries.length)} of {deliveries.length} records
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-muted-foreground mb-2">No delivery records found</div>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Use the Upload tab to import delivery data from Excel files.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImport;
