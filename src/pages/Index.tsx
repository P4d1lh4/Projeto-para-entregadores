import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Drivers from '@/pages/Drivers';
import Deliveries from '@/pages/Deliveries';
import Companies from '@/pages/Companies';
import Settings from '@/pages/Settings';
import DataImport from '@/pages/DataImport';
import Analytics from './Analytics';

import DeliveryAnalysis from '@/pages/DeliveryAnalysis';
import AIAnalysis from '@/pages/AIAnalysis';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { dataService } from '@/features/deliveries/services/dataService';

// Main component that orchestrates the layout and routes
const Index = () => {
  const { deliveryData, driverData, customerData, loading, error, updateData, setData, setError } = useDeliveryData();
  
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
      console.error('Error in handleDataUploaded:', err);
    }
  };

  const handleClearData = async () => {
    console.log('🔄 User requested data clear. Clearing all data...');
    try {
      // Clear the service data first
      dataService.clearAllData();
      
      // Clear any existing error state
      setError(null);
      
      // Force a re-render by updating the state with empty arrays
      setData({
        deliveryData: [],
        driverData: [],
        customerData: [],
      });
      
      // Wait a small amount to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ Data successfully cleared');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      // Set an error message for the user
      setError('Erro ao limpar dados. Tente novamente.');
    }
  };
  
  if (loading && deliveryData.length === 0) {
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
      <Route path="/" element={<DashboardLayout onClearData={handleClearData} />}>
        <Route index element={
          <Dashboard deliveryData={deliveryData} driverData={driverData} />
        } />
        <Route path="drivers" element={<Drivers driverData={driverData} />} />
        <Route path="deliveries" element={<Deliveries deliveryData={deliveryData} />} />
        <Route path="customers" element={<Companies customerData={customerData} />} />
        <Route path="analytics" element={<Analytics deliveryData={deliveryData} driverData={driverData} customerData={customerData} />} />
        
        <Route path="ai-analysis" element={<AIAnalysis />} />
        <Route path="data-import" element={<DataImport onDataUploaded={handleDataUploaded} />} />
        <Route path="settings" element={<Settings />} />
        <Route path="delivery-analysis" element={<DeliveryAnalysis />} />
      </Route>
    </Routes>
  );
};

export default Index;
