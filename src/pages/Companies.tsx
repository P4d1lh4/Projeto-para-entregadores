import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Loader2, Filter, Search, Building2, Star, Heart, TrendingUp, Package } from 'lucide-react';
import type { CustomerData } from '@/lib/file-utils';

type CompaniesProps = {
  customerData?: CustomerData[];
};

const Companies: React.FC<CompaniesProps> = ({ customerData: propCustomerData }) => {
  const { deliveryData, customerData: hookCustomerData, loading, error } = useDeliveryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState('');
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
      
      const matchesRating = minRating === '' || 
        (company.averageRating || 0) >= parseFloat(minRating);
      
      const matchesDeliveries = minDeliveries === '' || 
        (company.deliveries || 0) >= parseInt(minDeliveries);
      
      return matchesSearch && matchesRating && matchesDeliveries;
    });
  }, [companies, searchTerm, minRating, minDeliveries]);

  // Calculate statistics and segments for companies
  const stats = useMemo(() => {
    if (filteredCompanies.length === 0) {
      return { 
        avgRating: 0, 
        avgDeliveries: 0, 
        premiumCompanies: 0, 
        reliableCompanies: 0,
        newCompanies: 0,
        performanceRate: 0
      };
    }
    
    const totalRating = filteredCompanies.reduce((sum, c) => sum + (c.averageRating || 0), 0);
    const totalDeliveries = filteredCompanies.reduce((sum, c) => sum + (c.deliveries || 0), 0);
    
    const premiumCompanies = filteredCompanies.filter(c => 
      (c.deliveries || 0) >= 50 && (c.averageRating || 0) >= 4.5
    ).length;
    
    const reliableCompanies = filteredCompanies.filter(c => 
      (c.deliveries || 0) >= 20 && (c.averageRating || 0) >= 4
    ).length;
    
    const newCompanies = filteredCompanies.filter(c => 
      (c.deliveries || 0) < 10
    ).length;
    
    const performanceRate = (reliableCompanies / filteredCompanies.length) * 100;
    
    return {
      avgRating: totalRating / filteredCompanies.length,
      avgDeliveries: totalDeliveries / filteredCompanies.length,
      premiumCompanies,
      reliableCompanies,
      newCompanies,
      performanceRate
    };
  }, [filteredCompanies]);

  const getCompanySegment = (company: CustomerData) => {
    const deliveries = company.deliveries || 0;
    const rating = company.averageRating || 0;
    
    if (deliveries >= 50 && rating >= 4.5) {
      return { label: 'Premium', variant: 'default' as const, color: 'bg-purple-100 text-purple-800' };
    } else if (deliveries >= 20 && rating >= 4) {
      return { label: 'Reliable', variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' };
    } else if (deliveries >= 20) {
      return { label: 'Active', variant: 'outline' as const, color: 'bg-green-100 text-green-800' };
    } else if (deliveries >= 10) {
      return { label: 'Growing', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'New', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="minRating">Minimum rating</Label>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm text-muted-foreground">Average Rating</p>
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
                <p className="text-sm text-muted-foreground">Premium Partners</p>
                <p className="text-2xl font-bold">{stats.premiumCompanies}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance Rate</p>
                <p className="text-2xl font-bold">{stats.performanceRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Segments Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Company Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.premiumCompanies}</div>
              <div className="text-sm text-muted-foreground">Premium (50+ deliveries, 4.5+ ⭐)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.reliableCompanies}</div>
              <div className="text-sm text-muted-foreground">Reliable (20+ deliveries, 4+ ⭐)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredCompanies.filter(c => (c.deliveries || 0) >= 20).length - stats.reliableCompanies}
              </div>
              <div className="text-sm text-muted-foreground">Active (20+ deliveries)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredCompanies.filter(c => (c.deliveries || 0) >= 10 && (c.deliveries || 0) < 20).length}
              </div>
              <div className="text-sm text-muted-foreground">Growing (10-19 deliveries)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.newCompanies}</div>
              <div className="text-sm text-muted-foreground">New (less than 10)</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <th className="text-left p-2">Rating</th>
                    <th className="text-left p-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies
                    .sort((a, b) => (b.deliveries || 0) - (a.deliveries || 0))
                    .map((company) => {
                      const segment = getCompanySegment(company);
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
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {(company.averageRating || 0).toFixed(1)}
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
