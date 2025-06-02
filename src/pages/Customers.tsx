import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Loader2, Filter, Search, Users, Star, Heart, TrendingUp } from 'lucide-react';
import type { CustomerData } from '@/lib/file-utils';

type CustomersProps = {
  customerData?: CustomerData[];
};

const Customers: React.FC<CustomersProps> = ({ customerData: propCustomerData }) => {
  const { deliveryData, customerData: hookCustomerData, loading, error } = useDeliveryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minDeliveries, setMinDeliveries] = useState('');

  // Use hook data as primary source, props as fallback
  const customers = hookCustomerData || propCustomerData || [];
  
  console.log('👥 CUSTOMERS: Rendering with', customers.length, 'customers');

  // Filter customers based on search criteria
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = minRating === '' || 
        (customer.averageRating || 0) >= parseFloat(minRating);
      
      const matchesDeliveries = minDeliveries === '' || 
        (customer.deliveries || 0) >= parseInt(minDeliveries);
      
      return matchesSearch && matchesRating && matchesDeliveries;
    });
  }, [customers, searchTerm, minRating, minDeliveries]);

  // Calculate statistics and segments
  const stats = useMemo(() => {
    if (filteredCustomers.length === 0) {
      return { 
        avgRating: 0, 
        avgDeliveries: 0, 
        vipCustomers: 0, 
        loyalCustomers: 0,
        newCustomers: 0,
        loyaltyRate: 0
      };
    }
    
    const totalRating = filteredCustomers.reduce((sum, c) => sum + (c.averageRating || 0), 0);
    const totalDeliveries = filteredCustomers.reduce((sum, c) => sum + (c.deliveries || 0), 0);
    
    const vipCustomers = filteredCustomers.filter(c => 
      (c.deliveries || 0) >= 20 && (c.averageRating || 0) >= 4.5
    ).length;
    
    const loyalCustomers = filteredCustomers.filter(c => 
      (c.deliveries || 0) >= 10 && (c.averageRating || 0) >= 4
    ).length;
    
    const newCustomers = filteredCustomers.filter(c => 
      (c.deliveries || 0) < 5
    ).length;
    
    const loyaltyRate = (loyalCustomers / filteredCustomers.length) * 100;
    
    return {
      avgRating: totalRating / filteredCustomers.length,
      avgDeliveries: totalDeliveries / filteredCustomers.length,
      vipCustomers,
      loyalCustomers,
      newCustomers,
      loyaltyRate
    };
  }, [filteredCustomers]);

  const getCustomerSegment = (customer: CustomerData) => {
    const deliveries = customer.deliveries || 0;
    const rating = customer.averageRating || 0;
    
    if (deliveries >= 20 && rating >= 4.5) {
      return { label: 'VIP', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' };
    } else if (deliveries >= 10 && rating >= 4) {
      return { label: 'Fiel', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' };
    } else if (deliveries >= 10) {
      return { label: 'Regular', variant: 'outline' as const, color: 'bg-green-100 text-green-800' };
    } else if (deliveries >= 5) {
      return { label: 'Ocasional', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Novo', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setMinRating('');
    setMinDeliveries('');
  };

  const hasFilters = searchTerm || minRating || minDeliveries;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customer data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Customer Analysis</h1>
        <p className="text-muted-foreground">
          Manage and analyze customer behavior
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {hasFilters && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Ativos
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar por nome ou endereço</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o nome ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="minRating">Avaliação mínima</Label>
              <Input
                id="minRating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                placeholder="Ex: 4.0"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="minDeliveries">Minimum Deliveries</Label>
              <Input
                id="minDeliveries"
                type="number"
                min="0"
                placeholder="Ex: 10"
                value={minDeliveries}
                onChange={(e) => setMinDeliveries(e.target.value)}
              />
            </div>
          </div>
          
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{filteredCustomers.length}</p>
                {hasFilters && customers.length !== filteredCustomers.length && (
                  <p className="text-xs text-blue-600">de {customers.length}</p>
                )}
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">VIP Customers</p>
                <p className="text-2xl font-bold">{stats.vipCustomers}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Fidelidade</p>
                <p className="text-2xl font-bold">{stats.loyaltyRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.vipCustomers}</div>
              <div className="text-sm text-muted-foreground">VIP (20+ deliveries, 4.5+ ⭐)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.loyalCustomers}</div>
              <div className="text-sm text-muted-foreground">Loyal (10+ deliveries, 4+ ⭐)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredCustomers.filter(c => (c.deliveries || 0) >= 10).length - stats.loyalCustomers}
              </div>
              <div className="text-sm text-muted-foreground">Regular (10+ deliveries)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredCustomers.filter(c => (c.deliveries || 0) >= 5 && (c.deliveries || 0) < 10).length}
              </div>
              <div className="text-sm text-muted-foreground">Occasional (5-9 deliveries)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.newCustomers}</div>
              <div className="text-sm text-muted-foreground">Novos (menos de 5)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Endereço</th>
                    <th className="text-left p-2">Deliveries</th>
                    <th className="text-left p-2">Avaliação</th>
                    <th className="text-left p-2">Segmento</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers
                    .sort((a, b) => (b.deliveries || 0) - (a.deliveries || 0))
                    .map((customer) => {
                      const segment = getCustomerSegment(customer);
                      return (
                        <tr key={customer.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{customer.name}</td>
                          <td className="p-2 max-w-xs truncate" title={customer.address}>
                            {customer.address}
                          </td>
                          <td className="p-2">{customer.deliveries || 0}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {(customer.averageRating || 0).toFixed(1)}
                            </div>
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${segment.color}`}>
                              {segment.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {hasFilters 
                ? 'No customer found with the applied filters.'
                : 'No customer data available.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
