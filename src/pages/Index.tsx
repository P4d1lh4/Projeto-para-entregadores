
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import MapView from '@/pages/MapView';
import Drivers from '@/pages/Drivers';
import Deliveries from '@/pages/Deliveries';
import Customers from '@/pages/Customers';
import Settings from '@/pages/Settings';
import DataImport from '@/pages/DataImport';
import FileUpload from '@/components/data-upload/FileUpload';
import { 
  generateMockDeliveryData, 
  calculateDriverMetrics, 
  calculateCustomerMetrics, 
  DeliveryData, 
  DriverData, 
  CustomerData 
} from '@/lib/file-utils';

const Index = () => {
  const [deliveryData, setDeliveryData] = useState<DeliveryData[]>([]);
  const [driverData, setDriverData] = useState<DriverData[]>([]);
  const [customerData, setCustomerData] = useState<CustomerData[]>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  useEffect(() => {
    // Check if we have data in localStorage
    const storedData = localStorage.getItem('foxDeliveryData');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as DeliveryData[];
        setDeliveryData(parsedData);
        setDriverData(calculateDriverMetrics(parsedData));
        setCustomerData(calculateCustomerMetrics(parsedData));
        setIsFirstLoad(false);
      } catch (error) {
        console.error('Error parsing stored data:', error);
        // If there's an error, generate mock data
        loadMockData();
      }
    } else {
      // No stored data, generate mock data
      loadMockData();
    }
  }, []);
  
  const loadMockData = () => {
    const mockData = generateMockDeliveryData(50);
    setDeliveryData(mockData);
    setDriverData(calculateDriverMetrics(mockData));
    setCustomerData(calculateCustomerMetrics(mockData));
    localStorage.setItem('foxDeliveryData', JSON.stringify(mockData));
    setIsFirstLoad(false);
  };
  
  const handleDataUploaded = (newData: DeliveryData[]) => {
    setDeliveryData(newData);
    setDriverData(calculateDriverMetrics(newData));
    setCustomerData(calculateCustomerMetrics(newData));
    localStorage.setItem('foxDeliveryData', JSON.stringify(newData));
  };
  
  if (isFirstLoad) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={
          <>
            <div className="mb-6">
              <FileUpload onDataUploaded={handleDataUploaded} />
            </div>
            <Dashboard deliveryData={deliveryData} driverData={driverData} />
          </>
        } />
        <Route path="map" element={<MapView deliveryData={deliveryData} />} />
        <Route path="drivers" element={<Drivers driverData={driverData} />} />
        <Route path="deliveries" element={<Deliveries deliveryData={deliveryData} />} />
        <Route path="customers" element={<Customers customerData={customerData} />} />
        <Route path="data-import" element={<DataImport />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default Index;
