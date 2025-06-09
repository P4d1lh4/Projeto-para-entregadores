import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Loader2, Filter, Search, Building2, TrendingUp, Package } from 'lucide-react';
import type { CustomerData } from '@/lib/file-utils';

type CompaniesProps = {
  customerData?: CustomerData[];
};

const Companies: React.FC<CompaniesProps> = ({ customerData: propCustomerData }) => {
  const { customerData: hookCustomerData, loading, error } = useDeliveryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [minDeliveries, setMinDeliveries] = useState('');

  // Use hook data as primary source, props as fallback
  const companies = hookCustomerData || propCustomerData || [];
  
  console.log('🏢 COMPANIES: Rendering with', companies.length, 'companies');

  // Filter companies based on search criteria
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = searchTerm === '' || 
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDeliveries = minDeliveries === '' || 
        (company.deliveries || 0) >= parseInt(minDeliveries);
      
      return matchesSearch && matchesDeliveries;
    });
  }, [companies, searchTerm, minDeliveries]);

  // Calculate statistics for companies
  const stats = useMemo(() => {
    if (filteredCompanies.length === 0) {
      return { 
        totalDeliveries: 0,
        avgDeliveries: 0, 
      };
    }
    
    const totalDeliveries = filteredCompanies.reduce((sum, c) => sum + (c.deliveries || 0), 0);
    
    return {
      totalDeliveries,
      avgDeliveries: totalDeliveries / filteredCompanies.length,
    };
  }, [filteredCompanies]);

  const clearFilters = () => {
    setSearchTerm('');
    setMinDeliveries('');
  };

  const hasFilters = searchTerm || minDeliveries;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading company data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Delivery Companies</h1>
        <p className="text-muted-foreground">
          Manage and analyze food delivery company partnerships
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
            Filters
            {hasFilters && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Active
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Search by company name or location</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Enter company name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="minDeliveries">Minimum Deliveries</Label>
              <Input
                id="minDeliveries"
                type="number"
                min="0"
                placeholder="Ex: 20"
                value={minDeliveries}
                onChange={(e) => setMinDeliveries(e.target.value)}
              />
            </div>
          </div>
          
          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Companies</p>
                <p className="text-2xl font-bold">{filteredCompanies.length}</p>
                {hasFilters && companies.length !== filteredCompanies.length && (
                  <p className="text-xs text-blue-600">of {companies.length}</p>
                )}
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Deliveries</p>
                <p className="text-2xl font-bold">{stats.avgDeliveries.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Company List</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Company Name</th>
                    <th className="text-left p-2">Location</th>
                    <th className="text-left p-2">Total Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies
                    .sort((a, b) => (b.deliveries || 0) - (a.deliveries || 0))
                    .map((company) => {
                      return (
                        <tr key={company.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{company.name}</span>
                            </div>
                          </td>
                          <td className="p-2 max-w-xs truncate" title={company.address}>
                            {company.address}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {company.deliveries || 0}
                            </div>
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
                ? 'No company found with the applied filters.'
                : 'No company data available.'
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Companies;
