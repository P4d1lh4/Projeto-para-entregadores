import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, MapPin, TrendingUp, Users, Star, AlertTriangle, Zap, Filter, Trophy, Bell, Activity, Route } from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { formatDistanceToNow, parseISO, format, differenceInMinutes, isAfter, isBefore } from 'date-fns';
import CustomerDetailAnalysis from './CustomerDetailAnalysis';
import DriverDetailAnalysis from './DriverDetailAnalysis';
import DriverEfficiencyScoring from './DriverEfficiencyScoring';
import SmartAlerts from './SmartAlerts';
import RealTimePerformanceDashboard from './RealTimePerformanceDashboard';
import RouteOptimizationAnalysis from './RouteOptimizationAnalysis';
import AdvancedFilters, { type DeliveryFilters } from './AdvancedFilters';

interface DeliveryAnalysisReportProps {
  deliveries: FoxDelivery[];
}

const DeliveryAnalysisReport: React.FC<DeliveryAnalysisReportProps> = ({ deliveries }) => {
  const [filters, setFilters] = useState<DeliveryFilters>({
    status: [],
    drivers: [],
    areas: [],
    serviceTypes: [],
    customers: []
  });

  // Aplicar todos os filtros aos dados
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      // Filtro de data
      if (filters.dateFrom && delivery.created_at) {
        const deliveryDate = parseISO(delivery.created_at);
        const fromDate = parseISO(filters.dateFrom);
        if (isBefore(deliveryDate, fromDate)) return false;
      }
      
      if (filters.dateTo && delivery.created_at) {
        const deliveryDate = parseISO(delivery.created_at);
        const toDate = parseISO(filters.dateTo);
        if (isAfter(deliveryDate, toDate)) return false;
      }

      // Filtro de status
      if (filters.status.length > 0 && delivery.status) {
        if (!filters.status.includes(delivery.status)) return false;
      }

      // Filtro de motoristas
      if (filters.drivers.length > 0) {
        const deliveryDriver = delivery.delivering_driver || delivery.collecting_driver;
        if (!deliveryDriver || !filters.drivers.includes(deliveryDriver)) return false;
      }

      // Filtro de áreas
      if (filters.areas.length > 0 && delivery.delivery_address) {
        const addressParts = delivery.delivery_address.split(',');
        const area = addressParts[addressParts.length - 1]?.trim();
        if (!area || !filters.areas.includes(area)) return false;
      }

      // Filtro de tipos de serviço
      if (filters.serviceTypes.length > 0 && delivery.service_type) {
        if (!filters.serviceTypes.includes(delivery.service_type)) return false;
      }

      // Filtro de clientes
      if (filters.customers.length > 0 && delivery.customer_name) {
        if (!filters.customers.includes(delivery.customer_name)) return false;
      }

      return true;
    });
  }, [deliveries, filters]);

  const analysisData = useMemo(() => {
    // 1. Análise Geral de Entregas
    const totalDeliveries = filteredDeliveries.length;
    
    // Calcular tempo médio de entrega
    let totalDurationMinutes = 0;
    let deliveriesWithDuration = 0;
    
    filteredDeliveries.forEach(delivery => {
      if (delivery.collected_at && delivery.delivered_at) {
        const collectedAt = parseISO(delivery.collected_at);
        const deliveredAt = parseISO(delivery.delivered_at);
        const duration = differenceInMinutes(deliveredAt, collectedAt);
        
        if (duration > 0) {
          totalDurationMinutes += duration;
          deliveriesWithDuration++;
        }
      }
    });
    
    const avgDeliveryTime = deliveriesWithDuration > 0 
      ? Math.round(totalDurationMinutes / deliveriesWithDuration) 
      : 0;
    
    // Calcular distância média
    const deliveriesWithDistance = filteredDeliveries.filter(d => d.distance && d.distance > 0);
    const avgDistance = deliveriesWithDistance.length > 0
      ? deliveriesWithDistance.reduce((sum, d) => sum + (d.distance || 0), 0) / deliveriesWithDistance.length
      : 0;
    
    // Taxa de sucesso vs problemas
    const statusCounts = filteredDeliveries.reduce((acc, d) => {
      const status = d.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const successfulDeliveries = statusCounts['delivered'] || 0;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
    
    // Horários de pico
    const hourCounts = filteredDeliveries.reduce((acc, d) => {
      if (d.created_at) {
        const hour = parseISO(d.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
    
    // Áreas geográficas
    const areaCounts = filteredDeliveries.reduce((acc, d) => {
      if (d.delivery_address) {
        // Extrair área aproximada do endereço
        const addressParts = d.delivery_address.split(',');
        const area = addressParts[addressParts.length - 1]?.trim() || 'Unknown';
        acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topAreas = Object.entries(areaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    // 2. Análise de Motoristas
    const driverStats = filteredDeliveries.reduce((acc, d) => {
      const driver = d.delivering_driver || d.collecting_driver || 'Unknown';
      if (!acc[driver]) {
        acc[driver] = {
          name: driver,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          totalDuration: 0,
          deliveriesWithDuration: 0,
          totalRevenue: 0
        };
      }
      
      acc[driver].totalDeliveries++;
      if (d.status === 'delivered') acc[driver].successfulDeliveries++;
      if (d.cost) acc[driver].totalRevenue += d.cost;
      
      if (d.collected_at && d.delivered_at) {
        const duration = differenceInMinutes(parseISO(d.delivered_at), parseISO(d.collected_at));
        if (duration > 0) {
          acc[driver].totalDuration += duration;
          acc[driver].deliveriesWithDuration++;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    const driverMetrics = Object.values(driverStats).map((driver: any) => ({
      ...driver,
      successRate: driver.totalDeliveries > 0 ? (driver.successfulDeliveries / driver.totalDeliveries) * 100 : 0,
      avgDeliveryTime: driver.deliveriesWithDuration > 0 ? Math.round(driver.totalDuration / driver.deliveriesWithDuration) : 0
    }));
    
    const topPerformers = driverMetrics
      .filter(d => d.totalDeliveries >= 3)
      .sort((a, b) => b.successRate - a.successRate || a.avgDeliveryTime - b.avgDeliveryTime)
      .slice(0, 3);
    
    const strugglingDrivers = driverMetrics
      .filter(d => d.totalDeliveries >= 3)
      .sort((a, b) => a.successRate - b.successRate || b.avgDeliveryTime - a.avgDeliveryTime)
      .slice(0, 3);
    
    // 3. Análise de Clientes
    const customerStats = filteredDeliveries.reduce((acc, d) => {
      const customer = d.customer_name || 'Unknown';
      if (!acc[customer]) {
        acc[customer] = {
          name: customer,
          totalOrders: 0,
          totalSpent: 0,
          addresses: new Set(),
          lastOrder: null
        };
      }
      
      acc[customer].totalOrders++;
      if (d.cost) acc[customer].totalSpent += d.cost;
      if (d.delivery_address) acc[customer].addresses.add(d.delivery_address);
      if (d.created_at) {
        const orderDate = parseISO(d.created_at);
        if (!acc[customer].lastOrder || orderDate > acc[customer].lastOrder) {
          acc[customer].lastOrder = orderDate;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    const customerMetrics = Object.values(customerStats).map((customer: any) => ({
      ...customer,
      avgOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
      addressCount: customer.addresses.size
    }));
    
    const valuableCustomers = customerMetrics
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
    
    const frequentCustomers = customerMetrics
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 5);
    
    // Calcular receita total
    const totalRevenue = filteredDeliveries.reduce((sum, d) => sum + (d.cost || 0), 0);
    const avgOrderValue = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;
    
    return {
      general: {
        totalDeliveries,
        avgDeliveryTime,
        avgDistance: Math.round(avgDistance * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        statusCounts,
        peakHours,
        topAreas,
        totalRevenue,
        avgOrderValue
      },
      drivers: {
        totalActiveDrivers: driverMetrics.length,
        topPerformers,
        strugglingDrivers,
        avgDeliveriesPerDriver: driverMetrics.length > 0 ? Math.round(totalDeliveries / driverMetrics.length) : 0
      },
      customers: {
        totalActiveCustomers: customerMetrics.length,
        valuableCustomers,
        frequentCustomers,
        avgOrdersPerCustomer: customerMetrics.length > 0 ? Math.round(totalDeliveries / customerMetrics.length) : 0
      }
    };
  }, [filteredDeliveries]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return filters.dateFrom || filters.dateTo || 
           filters.status.length > 0 || 
           filters.drivers.length > 0 || 
           filters.areas.length > 0 || 
           filters.serviceTypes.length > 0 || 
           filters.customers.length > 0;
  }, [filters]);

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado de delivery disponível para análise.</p>
            <p className="text-sm mt-2">Importe dados de delivery para visualizar as análises.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Sistema Avançado de Análise de Delivery</h1>
        <p className="text-muted-foreground">Análise completa de performance e otimização de entregas</p>
        <p className="text-sm text-muted-foreground mt-1">
          Gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </p>
        {hasActiveFilters && (
          <div className="mt-3">
            <Badge variant="outline" className="flex items-center gap-2 w-fit mx-auto">
              <Filter className="h-3 w-3" />
              Análise com filtros aplicados ({filteredDeliveries.length} de {deliveries.length} entregas)
            </Badge>
          </div>
        )}
      </div>

      {/* Sistema de Filtros Avançados */}
      <AdvancedFilters
        deliveries={deliveries}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {filteredDeliveries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado encontrado para os filtros aplicados.</p>
              <p className="text-sm mt-2">Ajuste os filtros para visualizar as análises.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Eficiência
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-2">
              <Route className="h-4 w-4" />
              Rotas
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Motoristas
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Análise
            </TabsTrigger>
          </TabsList>

          {/* Dashboard de Performance em Tempo Real */}
          <TabsContent value="dashboard">
            <RealTimePerformanceDashboard deliveries={filteredDeliveries} />
          </TabsContent>

          {/* Sistema de Alertas Inteligentes */}
          <TabsContent value="alerts">
            <SmartAlerts deliveries={filteredDeliveries} />
          </TabsContent>

          {/* Sistema de Scoring de Eficiência */}
          <TabsContent value="efficiency">
            <DriverEfficiencyScoring deliveries={filteredDeliveries} />
          </TabsContent>

          {/* Análise de Rotas e Otimização */}
          <TabsContent value="routes">
            <RouteOptimizationAnalysis deliveries={filteredDeliveries} />
          </TabsContent>

          {/* Análise Detalhada de Motoristas */}
          <TabsContent value="drivers">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Análise Detalhada por Motorista
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DriverDetailAnalysis deliveries={filteredDeliveries} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Análise Tradicional (Original) */}
          <TabsContent value="analysis">
            <div className="space-y-8">
              {/* 1. Análise Geral de Entregas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    1. Análise Geral de Entregas
                    {hasActiveFilters && (
                      <Badge variant="outline" className="text-xs">
                        {filteredDeliveries.length} entregas filtradas
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysisData.general.totalDeliveries}</div>
                      <div className="text-sm text-muted-foreground">Total de Entregas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysisData.general.avgDeliveryTime} min</div>
                      <div className="text-sm text-muted-foreground">Tempo Médio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analysisData.general.avgDistance} km</div>
                      <div className="text-sm text-muted-foreground">Distância Média</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{analysisData.general.successRate}%</div>
                      <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Status das Entregas
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(analysisData.general.statusCounts).map(([status, count]) => (
                          <div key={status} className="flex justify-between items-center">
                            <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
                              {status}
                            </Badge>
                            <span className="font-semibold">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Horários de Pico
                      </h4>
                      <div className="space-y-2">
                        {analysisData.general.peakHours.map(({ hour, count }, index) => (
                          <div key={hour} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge variant={index === 0 ? 'default' : 'outline'}>
                                {hour}:00 - {hour + 1}:00
                              </Badge>
                            </div>
                            <span className="font-semibold">{count} pedidos</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Áreas com Maior Volume
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {analysisData.general.topAreas.slice(0, 5).map(([area, count], index) => (
                        <div key={area} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{area}</span>
                          <Badge variant={index < 2 ? 'default' : 'secondary'}>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        ${analysisData.general.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Receita Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        ${analysisData.general.avgOrderValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Valor Médio por Pedido</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Análise de Motoristas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    2. Análise de Motoristas (Drivers)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysisData.drivers.totalActiveDrivers}</div>
                      <div className="text-sm text-muted-foreground">Motoristas Ativos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysisData.drivers.avgDeliveriesPerDriver}</div>
                      <div className="text-sm text-muted-foreground">Entregas Médias/Motorista</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analysisData.drivers.topPerformers.length > 0 
                          ? `${analysisData.drivers.topPerformers[0].successRate.toFixed(1)}%`
                          : 'N/A'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Melhor Taxa de Sucesso</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Top Performers
                      </h4>
                      <div className="space-y-3">
                        {analysisData.drivers.topPerformers.map((driver, index) => (
                          <div key={driver.name} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{driver.name}</div>
                              <Badge className="bg-green-100 text-green-800">
                                #{index + 1}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-muted-foreground">Entregas</div>
                                <div className="font-semibold">{driver.totalDeliveries}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Taxa Sucesso</div>
                                <div className="font-semibold">{driver.successRate.toFixed(1)}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Tempo Médio</div>
                                <div className="font-semibold">{driver.avgDeliveryTime} min</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Necessitam Atenção
                      </h4>
                      <div className="space-y-3">
                        {analysisData.drivers.strugglingDrivers.map((driver, index) => (
                          <div key={driver.name} className="p-3 border rounded-lg border-orange-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{driver.name}</div>
                              <Badge variant="outline" className="border-orange-300 text-orange-700">
                                Atenção
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-muted-foreground">Entregas</div>
                                <div className="font-semibold">{driver.totalDeliveries}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Taxa Sucesso</div>
                                <div className="font-semibold text-orange-600">{driver.successRate.toFixed(1)}%</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Tempo Médio</div>
                                <div className="font-semibold">{driver.avgDeliveryTime} min</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 3. Análise de Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    3. Análise de Clientes (Customers)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analysisData.customers.totalActiveCustomers}</div>
                      <div className="text-sm text-muted-foreground">Clientes Ativos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysisData.customers.avgOrdersPerCustomer}</div>
                      <div className="text-sm text-muted-foreground">Pedidos Médios/Cliente</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ${analysisData.customers.valuableCustomers[0]?.totalSpent.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-muted-foreground">Maior Valor Gasto</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Clientes Mais Valiosos (por valor)
                      </h4>
                      <div className="space-y-3">
                        {analysisData.customers.valuableCustomers.map((customer, index) => (
                          <div key={customer.name} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{customer.name}</div>
                              <Badge className="bg-green-100 text-green-800">
                                ${customer.totalSpent.toFixed(2)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-muted-foreground">Pedidos</div>
                                <div className="font-semibold">{customer.totalOrders}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Ticket Médio</div>
                                <div className="font-semibold">${customer.avgOrderValue.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Endereços</div>
                                <div className="font-semibold">{customer.addressCount}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        Clientes Mais Frequentes (por volume)
                      </h4>
                      <div className="space-y-3">
                        {analysisData.customers.frequentCustomers.map((customer, index) => (
                          <div key={customer.name} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{customer.name}</div>
                              <Badge className="bg-blue-100 text-blue-800">
                                {customer.totalOrders} pedidos
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-muted-foreground">Valor Total</div>
                                <div className="font-semibold">${customer.totalSpent.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Ticket Médio</div>
                                <div className="font-semibold">${customer.avgOrderValue.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Endereços</div>
                                <div className="font-semibold">{customer.addressCount}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 4. Seção de Análise Específica de Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-600" />
                    4. Análise Específica de Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerDetailAnalysis deliveries={filteredDeliveries} />
                </CardContent>
              </Card>

              {/* Insights e Recomendações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Insights e Recomendações
                    {hasActiveFilters && (
                      <Badge variant="outline" className="text-xs">
                        Baseado nos filtros aplicados
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">📈 Oportunidades de Crescimento</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Focar nos horários de pico identificados para otimizar recursos</li>
                        <li>• Expandir operações nas áreas de maior demanda</li>
                        <li>• Implementar programas de fidelidade para clientes valiosos</li>
                        {hasActiveFilters && (
                          <li>• Replicar estratégias bem-sucedidas nos segmentos filtrados</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">⚠️ Áreas de Melhoria</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Treinar motoristas com baixa taxa de sucesso</li>
                        <li>• Otimizar rotas para reduzir tempo médio de entrega</li>
                        <li>• Monitorar entregas problemáticas para identificar padrões</li>
                        {hasActiveFilters && (
                          <li>• Atenção especial aos segmentos analisados</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Próximos Passos Recomendados</h4>
                    <ol className="text-sm text-green-700 space-y-1">
                      <li>1. Implementar sistema de avaliação em tempo real para motoristas</li>
                      <li>2. Criar dashboard de acompanhamento de KPIs por região</li>
                      <li>3. Desenvolver sistema de previsão de demanda baseado nos padrões identificados</li>
                      <li>4. Estabelecer metas de performance para cada motorista</li>
                      {hasActiveFilters && (
                        <li>5. Criar ações específicas para os segmentos analisados</li>
                      )}
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default DeliveryAnalysisReport; 