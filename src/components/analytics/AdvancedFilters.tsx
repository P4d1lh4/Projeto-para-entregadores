import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  Filter, 
  X, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { format } from 'date-fns';

export interface DeliveryFilters {
  dateFrom?: string;
  dateTo?: string;
  status: string[];
  drivers: string[];
  areas: string[];
  serviceTypes: string[];
  customers: string[];
}

interface AdvancedFiltersProps {
  deliveries: FoxDelivery[];
  filters: DeliveryFilters;
  onFiltersChange: (filters: DeliveryFilters) => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  deliveries,
  filters,
  onFiltersChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    date: false,
    status: false,
    drivers: false,
    areas: false,
    serviceTypes: false,
    customers: false
  });

  // Extrair opções únicas dos dados
  const filterOptions = useMemo(() => {
    const statusSet = new Set<string>();
    const driversSet = new Set<string>();
    const areasSet = new Set<string>();
    const serviceTypesSet = new Set<string>();
    const customersSet = new Set<string>();

    deliveries.forEach(delivery => {
      if (delivery.status) statusSet.add(delivery.status);
      
      if (delivery.delivering_driver) driversSet.add(delivery.delivering_driver);
      if (delivery.collecting_driver) driversSet.add(delivery.collecting_driver);
      
      if (delivery.delivery_address) {
        const addressParts = delivery.delivery_address.split(',');
        const area = addressParts[addressParts.length - 1]?.trim();
        if (area) areasSet.add(area);
      }
      
      if (delivery.service_type) serviceTypesSet.add(delivery.service_type);
      if (delivery.customer_name) customersSet.add(delivery.customer_name);
    });

    return {
      status: Array.from(statusSet).sort(),
      drivers: Array.from(driversSet).sort(),
      areas: Array.from(areasSet).sort(),
      serviceTypes: Array.from(serviceTypesSet).sort(),
      customers: Array.from(customersSet).sort()
    };
  }, [deliveries]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (filterType: keyof DeliveryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [filterType]: value
    });
  };

  const handleMultiSelectToggle = (filterType: keyof DeliveryFilters, item: string) => {
    const currentArray = filters[filterType] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    
    handleFilterChange(filterType, newArray);
  };

  const handleSelectAll = (filterType: keyof DeliveryFilters, options: string[]) => {
    handleFilterChange(filterType, options);
  };

  const handleDeselectAll = (filterType: keyof DeliveryFilters) => {
    handleFilterChange(filterType, []);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      drivers: [],
      areas: [],
      serviceTypes: [],
      customers: []
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.status.length > 0) count++;
    if (filters.drivers.length > 0) count++;
    if (filters.areas.length > 0) count++;
    if (filters.serviceTypes.length > 0) count++;
    if (filters.customers.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const FilterSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    sectionKey: string;
    children: React.ReactNode;
  }> = ({ title, icon, sectionKey, children }) => (
    <div className="border rounded-lg">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="p-3 border-t bg-muted/20">
          {children}
        </div>
      )}
    </div>
  );

  const MultiSelectFilter: React.FC<{
    options: string[];
    selected: string[];
    onToggle: (item: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
  }> = ({ options, selected, onToggle, onSelectAll, onDeselectAll }) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          disabled={selected.length === options.length}
        >
          Todos ({options.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDeselectAll}
          disabled={selected.length === 0}
        >
          Limpar
        </Button>
      </div>
      <ScrollArea className="h-40">
        <div className="space-y-2">
          {options.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={option}
                checked={selected.includes(option)}
                onCheckedChange={() => onToggle(option)}
              />
              <label htmlFor={option} className="text-sm cursor-pointer flex-1">
                {option}
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge variant="default">
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Filtro de Data */}
          <FilterSection
            title="Período"
            icon={<Calendar className="h-4 w-4 text-blue-600" />}
            sectionKey="date"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom" className="text-xs">Data Inicial</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-xs">Data Final</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </FilterSection>

          {/* Filtro de Status */}
          <FilterSection
            title={`Status (${filters.status.length}/${filterOptions.status.length})`}
            icon={<Clock className="h-4 w-4 text-green-600" />}
            sectionKey="status"
          >
            <MultiSelectFilter
              options={filterOptions.status}
              selected={filters.status}
              onToggle={(item) => handleMultiSelectToggle('status', item)}
              onSelectAll={() => handleSelectAll('status', filterOptions.status)}
              onDeselectAll={() => handleDeselectAll('status')}
            />
          </FilterSection>

          {/* Filtro de Motoristas */}
          <FilterSection
            title={`Motoristas (${filters.drivers.length}/${filterOptions.drivers.length})`}
            icon={<Truck className="h-4 w-4 text-orange-600" />}
            sectionKey="drivers"
          >
            <MultiSelectFilter
              options={filterOptions.drivers}
              selected={filters.drivers}
              onToggle={(item) => handleMultiSelectToggle('drivers', item)}
              onSelectAll={() => handleSelectAll('drivers', filterOptions.drivers)}
              onDeselectAll={() => handleDeselectAll('drivers')}
            />
          </FilterSection>

          {/* Filtro de Áreas */}
          <FilterSection
            title={`Áreas (${filters.areas.length}/${filterOptions.areas.length})`}
            icon={<MapPin className="h-4 w-4 text-red-600" />}
            sectionKey="areas"
          >
            <MultiSelectFilter
              options={filterOptions.areas}
              selected={filters.areas}
              onToggle={(item) => handleMultiSelectToggle('areas', item)}
              onSelectAll={() => handleSelectAll('areas', filterOptions.areas)}
              onDeselectAll={() => handleDeselectAll('areas')}
            />
          </FilterSection>

          {/* Filtro de Tipos de Serviço */}
          <FilterSection
            title={`Tipos de Serviço (${filters.serviceTypes.length}/${filterOptions.serviceTypes.length})`}
            icon={<Package className="h-4 w-4 text-indigo-600" />}
            sectionKey="serviceTypes"
          >
            <MultiSelectFilter
              options={filterOptions.serviceTypes}
              selected={filters.serviceTypes}
              onToggle={(item) => handleMultiSelectToggle('serviceTypes', item)}
              onSelectAll={() => handleSelectAll('serviceTypes', filterOptions.serviceTypes)}
              onDeselectAll={() => handleDeselectAll('serviceTypes')}
            />
          </FilterSection>

          {/* Resumo dos Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-blue-800">
                  Filtros Ativos ({activeFiltersCount})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar Todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.dateFrom && (
                  <Badge variant="secondary" className="text-xs">
                    De: {format(new Date(filters.dateFrom), 'dd/MM/yyyy')}
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="secondary" className="text-xs">
                    Até: {format(new Date(filters.dateTo), 'dd/MM/yyyy')}
                  </Badge>
                )}
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {filters.status.length}
                  </Badge>
                )}
                {filters.drivers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Motoristas: {filters.drivers.length}
                  </Badge>
                )}
                {filters.areas.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Áreas: {filters.areas.length}
                  </Badge>
                )}
                {filters.serviceTypes.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Serviços: {filters.serviceTypes.length}
                  </Badge>
                )}
                {filters.customers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Clientes: {filters.customers.length}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedFilters; 