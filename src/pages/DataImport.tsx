
import React, { useState, useEffect } from 'react';
import DragDropFileUpload from '@/components/data-upload/DragDropFileUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchDeliveryData } from '@/services/deliveryService';
import DeliveryTable from '@/components/data-display/DeliveryTable';
import { FoxDelivery } from '@/types/delivery';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, DatabaseIcon, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DataImport: React.FC = () => {
  const [deliveries, setDeliveries] = useState<FoxDelivery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Job ID</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Delivery Address</th>
                        <th className="p-2 text-left">Driver</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.slice(0, 10).map((delivery, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{delivery.job_id || '—'}</td>
                          <td className="p-2">{delivery.customer_name || '—'}</td>
                          <td className="p-2">{delivery.delivery_address || '—'}</td>
                          <td className="p-2">{delivery.delivering_driver || '—'}</td>
                          <td className="p-2">{delivery.status || '—'}</td>
                          <td className="p-2">
                            {delivery.created_at 
                              ? new Date(delivery.created_at).toLocaleDateString() 
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {deliveries.length > 10 && (
                    <div className="p-2 text-center border-t">
                      <span className="text-xs text-muted-foreground">
                        Showing 10 of {deliveries.length} records
                      </span>
                    </div>
                  )}
                </div>
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
