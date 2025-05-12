
import React, { useState, useEffect } from 'react';
import DeliveryMap from '@/components/map/DeliveryMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { FoxDelivery, DeliveryMapFilters } from '@/types/delivery';
import { fetchDeliveryDataWithRoutes } from '@/services/deliveryService';
import { cn } from '@/lib/utils';

const MapView: React.FC = () => {
  const [deliveryData, setDeliveryData] = useState<FoxDelivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<string[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [filters, setFilters] = useState<DeliveryMapFilters>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    loadDeliveryData();
  }, []);

  const loadDeliveryData = async () => {
    setLoading(true);
    const { data, error } = await fetchDeliveryDataWithRoutes({
      driverId: filters.driver,
      customerId: filters.customer,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      status: filters.status
    });

    if (error) {
      setError(error);
    } else if (data) {
      setDeliveryData(data);
      
      // Extract unique drivers and customers for filters
      const uniqueDrivers = new Set<string>();
      const uniqueCustomers = new Set<string>();
      
      data.forEach(delivery => {
        if (delivery.collecting_driver) uniqueDrivers.add(delivery.collecting_driver);
        if (delivery.delivering_driver) uniqueDrivers.add(delivery.delivering_driver);
        if (delivery.customer_name) uniqueCustomers.add(delivery.customer_name);
      });
      
      setDrivers(Array.from(uniqueDrivers).sort());
      setCustomers(Array.from(uniqueCustomers).sort());
    }
    
    setLoading(false);
  };

  const handleFilterChange = (key: keyof DeliveryMapFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    loadDeliveryData();
  };

  const clearFilters = () => {
    setFilters({});
    loadDeliveryData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Map View</h1>
          <p className="text-muted-foreground">Visualize all delivery locations and their routes on the map.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter size={16} />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>
      
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Filters</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                <X size={16} className="mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Driver</label>
                <Select
                  value={filters.driver}
                  onValueChange={(value) => handleFilterChange('driver', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map(driver => (
                      <SelectItem key={driver} value={driver}>
                        {driver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <Select
                  value={filters.customer}
                  onValueChange={(value) => handleFilterChange('customer', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer} value={customer}>
                        {customer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => handleFilterChange('dateFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => handleFilterChange('dateTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleApplyFilters} className="w-full">Apply Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Delivery Routes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading delivery data...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error: {error}</p>
            </div>
          ) : (
            <DeliveryMap deliveries={deliveryData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MapView;
