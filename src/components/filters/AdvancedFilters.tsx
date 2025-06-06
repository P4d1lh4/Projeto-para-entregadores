import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Filter,
  X,
  Calendar,
  Star,
  MapPin,
  Clock,
  CheckSquare,
  Square,
  Check,
  Minus
} from 'lucide-react';

export interface FilterOptions {
  drivers: string[];
  customers: string[];
  statuses: string[];
  cities: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  ratingRange: number[];
  deliveryCountRange: number[];
  timeRange: number[];
}

interface AdvancedFiltersProps {
  availableDrivers: { id: string; name: string }[];
  availableCustomers: { id: string; name: string }[];
  availableStatuses: string[];
  availableCities: string[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  availableDrivers,
  availableCustomers,
  availableStatuses,
  availableCities,
  filters,
  onFiltersChange,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = useCallback((key: keyof FilterOptions, value: any) => {
    console.log('AdvancedFilters - updateFilter called:', key, value); // Debug temporário
    const newFilters = {
      ...filters,
      [key]: value
    };
    console.log('AdvancedFilters - new filters:', newFilters); // Debug temporário
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const toggleArrayFilter = useCallback((key: 'drivers' | 'customers' | 'statuses' | 'cities', itemId: string) => {
    const currentArray = filters[key];
    const isSelected = currentArray.includes(itemId);
    
    const newArray = isSelected 
      ? currentArray.filter(id => id !== itemId)
      : [...currentArray, itemId];
    
    updateFilter(key, newArray);
  }, [filters, updateFilter]);

  const selectAllItems = useCallback((key: 'drivers' | 'customers' | 'statuses' | 'cities') => {
    let allItems: string[] = [];
    switch (key) {
      case 'drivers':
        allItems = availableDrivers.map(d => d.id);
        break;
      case 'customers':
        allItems = availableCustomers.map(c => c.id);
        break;
      case 'statuses':
        allItems = [...availableStatuses];
        break;
      case 'cities':
        allItems = [...availableCities];
        break;
    }
    updateFilter(key, allItems);
  }, [availableDrivers, availableCustomers, availableStatuses, availableCities, updateFilter]);

  const unselectAllItems = useCallback((key: 'drivers' | 'customers' | 'statuses' | 'cities') => {
    updateFilter(key, []);
  }, [updateFilter]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      drivers: [],
      customers: [],
      statuses: [],
      cities: [],
      dateRange: { from: null, to: null },
      ratingRange: [1, 5],
      deliveryCountRange: [0, 100],
      timeRange: [0, 60]
    });
  }, [onFiltersChange]);

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    const date = value ? new Date(value) : null;
    updateFilter('dateRange', { 
      ...filters.dateRange, 
      [type]: date 
    });
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.drivers.length > 0 ||
      filters.customers.length > 0 ||
      filters.statuses.length > 0 ||
      filters.cities.length > 0 ||
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null ||
      filters.ratingRange[0] !== 1 ||
      filters.ratingRange[1] !== 5 ||
      filters.deliveryCountRange[0] !== 0 ||
      filters.deliveryCountRange[1] !== 100 ||
      filters.timeRange[0] !== 0 ||
      filters.timeRange[1] !== 60
    );
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return (
      filters.drivers.length + 
      filters.customers.length + 
      filters.statuses.length + 
      filters.cities.length +
      (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
      (filters.ratingRange[0] !== 1 || filters.ratingRange[1] !== 5 ? 1 : 0) +
      (filters.deliveryCountRange[0] !== 0 || filters.deliveryCountRange[1] !== 100 ? 1 : 0) +
      (filters.timeRange[0] !== 0 || filters.timeRange[1] !== 60 ? 1 : 0)
    );
  }, [filters]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Advanced Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} active{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Driver Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Drivers ({filters.drivers.length} selected)
              </Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectAllItems('drivers')}
                  disabled={filters.drivers.length === availableDrivers.length}
                >
                  <Check className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => unselectAllItems('drivers')}
                  disabled={filters.drivers.length === 0}
                >
                  <Minus className="h-3 w-3 mr-1" />
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {availableDrivers.map(driver => (
                <div key={driver.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`driver-${driver.id}`}
                    checked={filters.drivers.includes(driver.id)}
                    onCheckedChange={(checked) => {
                      console.log('Checkbox changed:', driver.id, checked, 'current filters.drivers:', filters.drivers); // Debug temporário
                      toggleArrayFilter('drivers', driver.id);
                    }}
                  />
                  <Label 
                    htmlFor={`driver-${driver.id}`} 
                    className="text-sm cursor-pointer truncate"
                  >
                    {driver.name}
                  </Label>
                </div>
              ))}
            </div>
            {filters.drivers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.drivers.map(driverId => {
                  const driver = availableDrivers.find(d => d.id === driverId);
                  return driver ? (
                    <Badge key={driverId} variant="secondary" className="text-xs">
                      {driver.name}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => toggleArrayFilter('drivers', driverId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Customer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Customers ({filters.customers.length} selected)
              </Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectAllItems('customers')}
                  disabled={filters.customers.length === availableCustomers.length}
                >
                  <Check className="h-3 w-3 mr-1" />
                  All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => unselectAllItems('customers')}
                  disabled={filters.customers.length === 0}
                >
                  <Minus className="h-3 w-3 mr-1" />
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {availableCustomers.map(customer => (
                <div key={customer.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`customer-${customer.id}`}
                    checked={filters.customers.includes(customer.id)}
                    onCheckedChange={() => toggleArrayFilter('customers', customer.id)}
                  />
                  <Label 
                    htmlFor={`customer-${customer.id}`} 
                    className="text-sm cursor-pointer truncate"
                  >
                    {customer.name}
                  </Label>
                </div>
              ))}
            </div>
            {filters.customers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.customers.map(customerId => {
                  const customer = availableCustomers.find(c => c.id === customerId);
                  return customer ? (
                    <Badge key={customerId} variant="secondary" className="text-xs">
                      {customer.name}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={() => toggleArrayFilter('customers', customerId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Status and City Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Delivery Status
                </Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectAllItems('statuses')}
                    disabled={filters.statuses.length === availableStatuses.length}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => unselectAllItems('statuses')}
                    disabled={filters.statuses.length === 0}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    None
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {availableStatuses.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={() => toggleArrayFilter('statuses', status)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                      {status === 'delivered' ? 'Delivered' :
                       status === 'pending' ? 'Pending' :
                       status === 'in_transit' ? 'In Transit' :
                       status === 'failed' ? 'Failed' : status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Cities
                </Label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => selectAllItems('cities')}
                    disabled={filters.cities.length === availableCities.length}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => unselectAllItems('cities')}
                    disabled={filters.cities.length === 0}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    None
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {availableCities.map(city => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city}`}
                      checked={filters.cities.includes(city)}
                      onCheckedChange={() => toggleArrayFilter('cities', city)}
                    />
                    <Label htmlFor={`city-${city}`} className="text-sm cursor-pointer">
                      {city}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Delivery Period
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-from" className="text-sm">From:</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={formatDateForInput(filters.dateRange.from)}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="date-to" className="text-sm">To:</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={formatDateForInput(filters.dateRange.to)}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Rating Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Rating Range: {filters.ratingRange[0]} - {filters.ratingRange[1]} stars
            </Label>
            <Slider
              value={filters.ratingRange}
              onValueChange={(value) => updateFilter('ratingRange', value)}
              min={1}
              max={5}
              step={0.5}
              className="w-full"
            />
          </div>

          {/* Delivery Count Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Delivery Count Range: {filters.deliveryCountRange[0]} - {filters.deliveryCountRange[1]}
            </Label>
            <Slider
              value={filters.deliveryCountRange}
              onValueChange={(value) => updateFilter('deliveryCountRange', value)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Time Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Time (min): {filters.timeRange[0]} - {filters.timeRange[1]}
            </Label>
            <Slider
              value={filters.timeRange}
              onValueChange={(value) => updateFilter('timeRange', value)}
              min={0}
              max={60}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}; 