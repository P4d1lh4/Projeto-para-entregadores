import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Package, Clock, MapPin, DollarSign, Calendar, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { format, parseISO } from 'date-fns';

interface CustomerDetailAnalysisProps {
  deliveries: FoxDelivery[];
  onCustomerSelect?: (customerId: string) => void;
}

const CustomerDetailAnalysis: React.FC<CustomerDetailAnalysisProps> = ({ 
  deliveries, 
  onCustomerSelect 
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Listar todos os clientes disponíveis
  const availableCustomers = useMemo(() => {
    const customerMap = new Map<string, { name: string; ordersCount: number; totalSpent: number }>();
    
    deliveries.forEach(delivery => {
      const customerId = delivery.customer_name || 'Unknown';
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: customerId,
          ordersCount: 0,
          totalSpent: 0
        });
      }
      
      const customer = customerMap.get(customerId)!;
      customer.ordersCount++;
      customer.totalSpent += delivery.cost || 0;
    });
    
    return Array.from(customerMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.ordersCount - a.ordersCount);
  }, [deliveries]);

  // Filtrar clientes baseado na busca
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return availableCustomers.slice(0, 10);
    
    return availableCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [availableCustomers, searchTerm]);

  // Análise detalhada do cliente selecionado
  const customerAnalysis = useMemo(() => {
    if (!selectedCustomerId) return null;

    const customerDeliveries = deliveries.filter(d => d.customer_name === selectedCustomerId);
    
    if (customerDeliveries.length === 0) return null;

    // Estatísticas básicas
    const totalOrders = customerDeliveries.length;
    const totalSpent = customerDeliveries.reduce((sum, d) => sum + (d.cost || 0), 0);
    const avgOrderValue = totalSpent / totalOrders;
    
    // Análise de status
    const statusCounts = customerDeliveries.reduce((acc, d) => {
      const status = d.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const successRate = statusCounts['delivered'] ? (statusCounts['delivered'] / totalOrders) * 100 : 0;

    // Endereços mais frequentes
    const addressCounts = customerDeliveries.reduce((acc, d) => {
      if (d.delivery_address) {
        acc[d.delivery_address] = (acc[d.delivery_address] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topAddresses = Object.entries(addressCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Tipos de serviço preferidos
    const serviceTypeCounts = customerDeliveries.reduce((acc, d) => {
      if (d.service_type) {
        acc[d.service_type] = (acc[d.service_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const preferredServiceTypes = Object.entries(serviceTypeCounts)
      .sort(([, a], [, b]) => b - a);

    // Análise temporal
    const ordersByMonth = customerDeliveries.reduce((acc, d) => {
      if (d.created_at) {
        const month = format(parseISO(d.created_at), 'yyyy-MM');
        acc[month] = (acc[month] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Última compra
    const lastOrder = customerDeliveries
      .filter(d => d.created_at)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0];

    // Horários preferidos
    const hourCounts = customerDeliveries.reduce((acc, d) => {
      if (d.created_at) {
        const hour = parseISO(d.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    
    const preferredHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    // Identificar padrões e anomalias
    const patterns = [];
    const anomalies = [];
    
    if (totalOrders >= 5) {
      patterns.push(`Cliente frequente com ${totalOrders} pedidos`);
    }
    
    if (avgOrderValue > 75) {
      patterns.push(`Alto valor médio por pedido ($${avgOrderValue.toFixed(2)})`);
    }
    
    if (topAddresses.length === 1 && topAddresses[0][1] >= totalOrders * 0.8) {
      patterns.push(`Sempre entrega no mesmo endereço (${Math.round((topAddresses[0][1] / totalOrders) * 100)}% das vezes)`);
    }
    
    if (successRate < 85) {
      anomalies.push(`Taxa de sucesso baixa (${successRate.toFixed(1)}%)`);
    }
    
    if (totalOrders >= 10) {
      const recentOrders = customerDeliveries
        .filter(d => d.created_at && new Date(d.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000)
        .length;
      
      if (recentOrders === 0) {
        anomalies.push('Sem pedidos nos últimos 30 dias (possível cliente inativo)');
      }
    }

    return {
      customerId: selectedCustomerId,
      totalOrders,
      totalSpent,
      avgOrderValue,
      statusCounts,
      successRate,
      topAddresses,
      preferredServiceTypes,
      ordersByMonth,
      lastOrder,
      preferredHour: preferredHour ? { hour: parseInt(preferredHour[0]), count: preferredHour[1] } : null,
      patterns,
      anomalies,
      deliveries: customerDeliveries.sort((a, b) => 
        new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
      )
    };
  }, [selectedCustomerId, deliveries]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    onCustomerSelect?.(customerId);
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Seleção de Cliente para Análise Detalhada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar cliente por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className={`cursor-pointer transition-colors ${
                  selectedCustomerId === customer.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleCustomerSelect(customer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{customer.name}</div>
                    <Badge variant="outline">{customer.ordersCount} pedidos</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: ${customer.totalSpent.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredCustomers.length === 0 && searchTerm && (
            <div className="text-center text-muted-foreground py-4">
              Nenhum cliente encontrado para "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Análise Detalhada do Cliente Selecionado */}
      {customerAnalysis && (
        <div className="space-y-6">
          {/* Resumo do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Análise Detalhada: {customerAnalysis.customerId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{customerAnalysis.totalOrders}</div>
                  <div className="text-sm text-muted-foreground">Total de Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">${customerAnalysis.totalSpent.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Gasto Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">${customerAnalysis.avgOrderValue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Ticket Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{customerAnalysis.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereços Mais Frequentes
                  </h4>
                  <div className="space-y-2">
                    {customerAnalysis.topAddresses.map(([address, count], index) => (
                      <div key={address} className="p-2 border rounded text-sm">
                        <div className="flex justify-between items-start">
                          <span className="flex-1">{address}</span>
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            {count}x
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Tipos de Serviço Preferidos
                  </h4>
                  <div className="space-y-2">
                    {customerAnalysis.preferredServiceTypes.map(([serviceType, count], index) => (
                      <div key={serviceType} className="flex justify-between items-center">
                        <span className="text-sm">{serviceType}</span>
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          {count} pedidos
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {customerAnalysis.lastOrder && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Última Compra
                  </h4>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <div className="text-muted-foreground">Data</div>
                        <div className="font-semibold">
                          {format(parseISO(customerAnalysis.lastOrder.created_at!), 'dd/MM/yyyy')}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Valor</div>
                        <div className="font-semibold">${customerAnalysis.lastOrder.cost?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <Badge variant={customerAnalysis.lastOrder.status === 'delivered' ? 'default' : 'secondary'}>
                          {customerAnalysis.lastOrder.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Serviço</div>
                        <div className="font-semibold">{customerAnalysis.lastOrder.service_type || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {customerAnalysis.preferredHour && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horário Preferido
                  </h4>
                  <div className="text-sm">
                    <Badge className="mr-2">
                      {customerAnalysis.preferredHour.hour}:00 - {customerAnalysis.preferredHour.hour + 1}:00
                    </Badge>
                    ({customerAnalysis.preferredHour.count} pedidos nesse horário)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Padrões e Anomalias */}
          <div className="grid md:grid-cols-2 gap-6">
            {customerAnalysis.patterns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-5 w-5" />
                    Padrões Identificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {customerAnalysis.patterns.map((pattern, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{pattern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {customerAnalysis.anomalies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="h-5 w-5" />
                    Anomalias Detectadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {customerAnalysis.anomalies.map((anomaly, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-600 mt-1">⚠</span>
                        <span>{anomaly}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Histórico Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Histórico Completo de Pedidos (Últimos 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerAnalysis.deliveries.slice(0, 10).map((delivery) => (
                  <div key={delivery.id} className="p-3 border rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Data</div>
                        <div className="font-semibold">
                          {delivery.created_at ? format(parseISO(delivery.created_at), 'dd/MM/yy') : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Valor</div>
                        <div className="font-semibold">${delivery.cost?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'} className="text-xs">
                          {delivery.status}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Serviço</div>
                        <div className="font-semibold">{delivery.service_type || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Endereço</div>
                        <div className="font-semibold text-xs">{delivery.delivery_address || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedCustomerId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um cliente acima para ver a análise detalhada</p>
              <p className="text-sm mt-2">
                A análise incluirá histórico completo, padrões de pedidos, endereços frequentes e muito mais.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerDetailAnalysis; 