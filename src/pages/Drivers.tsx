import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';
import { Loader2, Filter, Search, Users, Star, TrendingUp, Clock, MapPin, Package, Calendar, Phone, Mail, Award } from 'lucide-react';
import type { DriverData, DeliveryData } from '@/features/deliveries/types';

interface DetailedDriverStats {
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
  pendingCount: number;
  inTransitCount: number;
  recentDeliveries: number;
  uniqueCustomers: number;
  avgRating: number;
  deliveries: DeliveryData[];
}

interface DetailedDriverData extends DriverData {
  detailedStats?: DetailedDriverStats;
}

type DriversProps = {
  driverData?: DriverData[];
};

const Drivers: React.FC<DriversProps> = ({ driverData: propDriverData }) => {
  const { deliveryData, driverData: hookDriverData, loading, error } = useDeliveryData();
  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minDeliveries, setMinDeliveries] = useState('');
  
  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<DetailedDriverData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use prop data if available, otherwise hook data
  const drivers = propDriverData && propDriverData.length > 0 ? propDriverData : hookDriverData;
  
  console.log('🚛 DRIVERS: Rendering with', drivers.length, 'drivers');

  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const nameMatch = !searchTerm || driver.name.toLowerCase().includes(searchTerm.toLowerCase());
      const ratingMatch = !minRating || (driver.rating && driver.rating >= parseFloat(minRating));
      const deliveriesMatch = !minDeliveries || (driver.deliveries && driver.deliveries >= parseInt(minDeliveries));
      
      return nameMatch && ratingMatch && deliveriesMatch;
    });
  }, [drivers, searchTerm, minRating, minDeliveries]);

  const stats = useMemo(() => {
    if (filteredDrivers.length === 0) {
      return { avgRating: 0, avgSuccessRate: 0, avgTime: 0, totalDrivers: 0 };
    }

    const validRatings = filteredDrivers.filter(driver => driver.rating && driver.rating > 0);
    const validSuccessRates = filteredDrivers.filter(driver => driver.successRate && driver.successRate > 0);
    const validTimes = filteredDrivers.filter(driver => driver.averageTime && driver.averageTime > 0);

    const avgRating = validRatings.length > 0 
      ? validRatings.reduce((sum, driver) => sum + driver.rating, 0) / validRatings.length 
      : 0;
    const avgSuccessRate = validSuccessRates.length > 0 
      ? validSuccessRates.reduce((sum, driver) => sum + driver.successRate, 0) / validSuccessRates.length 
      : 0;
    const avgTime = validTimes.length > 0 
      ? validTimes.reduce((sum, driver) => sum + driver.averageTime, 0) / validTimes.length 
      : 0;

    return { avgRating, avgSuccessRate, avgTime, totalDrivers: filteredDrivers.length };
  }, [filteredDrivers]);

  const clearFilters = () => {
    setSearchTerm('');
    setMinRating('');
    setMinDeliveries('');
  };

  const hasFilters = searchTerm || minRating || minDeliveries;

  // Function to get detailed driver information
  const getDriverDetails = (driver: DriverData): DetailedDriverData => {
    // Get deliveries for this specific driver (if deliveryData is available)
    const driverDeliveries = deliveryData ? deliveryData.filter(delivery => 
      delivery.driverId === driver.id || delivery.driverName === driver.name
    ) : [];

    // Calculate detailed statistics
    const totalDeliveries = driverDeliveries.length;
    const deliveredCount = driverDeliveries.filter(d => d.status === 'delivered').length;
    const failedCount = driverDeliveries.filter(d => d.status === 'failed').length;
    const pendingCount = driverDeliveries.filter(d => d.status === 'pending').length;
    const inTransitCount = driverDeliveries.filter(d => d.status === 'in_transit').length;

    // Recent deliveries (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentDeliveries = driverDeliveries.filter(d => {
      try {
        return d.deliveryTime && new Date(d.deliveryTime) >= sevenDaysAgo;
      } catch {
        return false;
      }
    });

    // Get unique customers
    const uniqueCustomers = new Set(driverDeliveries.map(d => d.customerName).filter(Boolean));

    // Average rating from delivered orders
    const ratedDeliveries = driverDeliveries.filter(d => d.rating && d.status === 'delivered');
    const avgRating = ratedDeliveries.length > 0 
      ? ratedDeliveries.reduce((sum, d) => sum + (d.rating || 0), 0) / ratedDeliveries.length 
      : driver.rating || 0;

    return {
      ...driver,
      detailedStats: {
        totalDeliveries: totalDeliveries || driver.deliveries || 0,
        deliveredCount,
        failedCount,
        pendingCount,
        inTransitCount,
        recentDeliveries: recentDeliveries.length,
        uniqueCustomers: uniqueCustomers.size,
        avgRating: Math.round(avgRating * 10) / 10,
        deliveries: driverDeliveries.sort((a, b) => {
          try {
            return new Date(b.deliveryTime).getTime() - new Date(a.deliveryTime).getTime();
          } catch {
            return 0;
          }
        }).slice(0, 10) // Last 10 deliveries
      }
    };
  };

  // Function to open driver details modal
  const openDriverDetails = (driver: DriverData) => {
    const detailedDriver = getDriverDetails(driver);
    setSelectedDriver(detailedDriver);
    setIsModalOpen(true);
  };

  // Function to close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando dados dos entregadores...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Análise de Entregadores</h1>
        <p className="text-muted-foreground">
          Gerencie e analise o desempenho dos entregadores
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
              <Label htmlFor="search">Buscar por nome</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite o nome..."
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
              <Label htmlFor="minDeliveries">Entregas mínimas</Label>
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
                <p className="text-sm text-muted-foreground">Total de Entregadores</p>
                <p className="text-2xl font-bold">{filteredDrivers.length}</p>
                {hasFilters && drivers.length !== filteredDrivers.length && (
                  <p className="text-xs text-blue-600">de {drivers.length}</p>
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
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{(stats.avgSuccessRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{stats.avgTime.toFixed(0)}min</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Entregadores</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDrivers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Entregas</th>
                    <th className="text-left p-2">Avaliação</th>
                    <th className="text-left p-2">Taxa de Sucesso</th>
                    <th className="text-left p-2">Tempo Médio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .map((driver) => (
                      <tr 
                        key={driver.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openDriverDetails(driver)}
                        title="Clique para ver detalhes"
                      >
                        <td className="p-2 font-medium">{driver.name}</td>
                        <td className="p-2">{driver.deliveries || 0}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {(driver.rating || 0).toFixed(1)}
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-sm ${
                            (driver.successRate || 0) >= 0.8 
                              ? 'bg-green-100 text-green-800'
                              : (driver.successRate || 0) >= 0.6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {((driver.successRate || 0) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2">{(driver.averageTime || 0).toFixed(0)} min</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {hasFilters 
                ? 'Nenhum entregador encontrado com os filtros aplicados.'
                : 'Nenhum dados de entregadores disponível.'
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Detalhes do Entregador: {selectedDriver?.name}
            </DialogTitle>
            <DialogDescription>
              Estatísticas detalhadas e histórico de entregas
            </DialogDescription>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-6">
              {/* Driver Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedDriver.detailedStats?.totalDeliveries || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total de Entregas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {((selectedDriver.successRate || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(selectedDriver.averageTime || 0).toFixed(0)} min
                      </div>
                      <div className="text-sm text-muted-foreground">Tempo Médio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                        <Star className="h-5 w-5" />
                        {(selectedDriver.detailedStats?.avgRating || 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Avaliação Média</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Distribuição de Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold">{selectedDriver.detailedStats?.deliveredCount || 0}</div>
                        <div className="text-sm text-muted-foreground">Entregues</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold">{selectedDriver.detailedStats?.inTransitCount || 0}</div>
                        <div className="text-sm text-muted-foreground">Em Trânsito</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold">{selectedDriver.detailedStats?.pendingCount || 0}</div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold">{selectedDriver.detailedStats?.failedCount || 0}</div>
                        <div className="text-sm text-muted-foreground">Falharam</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity & Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Últimos 7 dias</span>
                        <span className="font-semibold">{selectedDriver.detailedStats?.recentDeliveries || 0} entregas</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clientes únicos</span>
                        <span className="font-semibold">{selectedDriver.detailedStats?.uniqueCustomers || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Posição no ranking</span>
                        <Badge variant="secondary">
                          #{filteredDrivers.findIndex(d => d.id === selectedDriver.id) + 1} de {filteredDrivers.length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={selectedDriver.successRate >= 0.8 ? "default" : "secondary"}>
                          {selectedDriver.successRate >= 0.8 ? "Excelente" : selectedDriver.successRate >= 0.6 ? "Bom" : "Precisa melhorar"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Deliveries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Últimas 10 Entregas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedDriver.detailedStats?.deliveries?.map((delivery, index) => (
                      <div key={delivery.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              delivery.status === 'delivered' ? 'default' : 
                              delivery.status === 'in_transit' ? 'secondary' : 
                              delivery.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {delivery.status === 'delivered' ? 'Entregue' :
                               delivery.status === 'in_transit' ? 'Em Trânsito' :
                               delivery.status === 'pending' ? 'Pendente' : 'Falhou'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(delivery.deliveryTime).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{delivery.customerName}</div>
                            <div className="text-muted-foreground">{delivery.address}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          {delivery.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-semibold">{delivery.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-4">
                        Nenhuma entrega encontrada
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Drivers;
