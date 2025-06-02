import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Drivers from '@/pages/Drivers';
import Deliveries from '@/pages/Deliveries';
import Customers from '@/pages/Customers';
import Settings from '@/pages/Settings';
import DataImport from '@/pages/DataImport';
import Analytics from '@/pages/Analytics';
import AIAssistantPage from '@/pages/AIAssistantPage';
import DeliveryAnalysis from '@/pages/DeliveryAnalysis';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

const Index = () => {
  const { deliveryData, driverData, customerData, loading, error, updateData } = useDeliveryData();
  
  // Debug logs mais detalhados
  console.log('🏠 INDEX PAGE DEBUG:');
  console.log('- Component rendered');
  console.log('- loading:', loading);
  console.log('- error:', error);
  console.log('- deliveryData:', deliveryData, 'length:', deliveryData?.length);
  console.log('- driverData:', driverData, 'length:', driverData?.length);
  console.log('- customerData:', customerData, 'length:', customerData?.length);
  
  const handleDataUploaded = async (newData: any[]) => {
    try {
      await updateData(newData);
    } catch (err) {
      console.error('Error uploading data:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading Dashboard
            </CardTitle>
            <CardDescription>
              Initializing delivery data and analytics...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error && deliveryData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Error Loading Data
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please try uploading a data file to get started.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={
          <Dashboard deliveryData={deliveryData} driverData={driverData} />
        } />
        <Route path="drivers" element={<Drivers driverData={driverData} />} />
        <Route path="deliveries" element={<Deliveries deliveryData={deliveryData} />} />
        <Route path="customers" element={<Customers customerData={customerData} />} />
        <Route path="analytics" element={<Analytics deliveryData={deliveryData} driverData={driverData} customerData={customerData} />} />
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        <Route path="data-import" element={<DataImport />} />
        <Route path="settings" element={<Settings />} />
        <Route path="delivery-analysis" element={<DeliveryAnalysis />} />
      </Route>
    </Routes>
  );
};

export default Index;
