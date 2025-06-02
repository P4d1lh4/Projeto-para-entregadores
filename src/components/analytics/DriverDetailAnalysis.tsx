import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Truck, 
  Clock, 
  MapPin, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Calendar,
  DollarSign,
  Route,
  Star
} from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { formatDistanceToNow, parseISO, format, differenceInMinutes } from 'date-fns';

interface DriverDetailAnalysisProps {
  deliveries: FoxDelivery[];
}

const DriverDetailAnalysis: React.FC<DriverDetailAnalysisProps> = ({ deliveries }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // Extrair todos os motoristas únicos
  const availableDrivers = useMemo(() => {
    const driversMap = new Map<string, {
      name: string;
      totalDeliveries: number;
      successfulDeliveries: number;
      totalRevenue: number;
      lastDelivery?: Date;
    }>();

    deliveries.forEach(delivery => {
      const driverName = delivery.delivering_driver || delivery.collecting_driver;
      if (!driverName) return;

      if (!driversMap.has(driverName)) {
        driversMap.set(driverName, {
          name: driverName,
          totalDeliveries: 0,
          successfulDeliveries: 0,
          totalRevenue: 0
        });
      }

      const driver = driversMap.get(driverName)!;
      driver.totalDeliveries++;
      
      if (delivery.status === 'delivered') {
        driver.successfulDeliveries++;
      }
      
      if (delivery.cost) {
        driver.totalRevenue += delivery.cost;
      }

      if (delivery.delivered_at || delivery.created_at) {
        const deliveryDate = parseISO(delivery.delivered_at || delivery.created_at!);
        if (!driver.lastDelivery || deliveryDate > driver.lastDelivery) {
          driver.lastDelivery = deliveryDate;
        }
      }
    });

    return Array.from(driversMap.values())
      .map(driver => ({
        ...driver,
        successRate: driver.totalDeliveries > 0 ? (driver.successfulDeliveries / driver.totalDeliveries) * 100 : 0
      }))
      .sort((a, b) => b.totalDeliveries - a.totalDeliveries);
  }, [deliveries]);

  // Filtrar motoristas baseado na busca
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return availableDrivers;
    
    return availableDrivers.filter(driver =>
      driver.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableDrivers, searchTerm]);

  // Análise detalhada do motorista selecionado
  const driverAnalysis = useMemo(() => {
    if (!selectedDriver) return null;

    const driverDeliveries = deliveries.filter(d => 
      d.delivering_driver === selectedDriver || d.collecting_driver === selectedDriver
    );

    if (driverDeliveries.length === 0) return null;

    // Estatísticas básicas
    const totalDeliveries = driverDeliveries.length;
    const successfulDeliveries = driverDeliveries.filter(d => d.status === 'delivered').length;
    const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
    const totalRevenue = driverDeliveries.reduce((sum, d) => sum + (d.cost || 0), 0);
    const avgRevenue = totalDeliveries > 0 ? totalRevenue / totalDeliveries : 0;

    // Tempo médio de entrega
    let totalDurationMinutes = 0;
    let deliveriesWithDuration = 0;
    
    driverDeliveries.forEach(delivery => {
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

    // Distância média
    const deliveriesWithDistance = driverDeliveries.filter(d => d.distance && d.distance > 0);
    const avgDistance = deliveriesWithDistance.length > 0
      ? deliveriesWithDistance.reduce((sum, d) => sum + (d.distance || 0), 0) / deliveriesWithDistance.length
      : 0;

    // Análise por status
    const statusAnalysis = driverDeliveries.reduce((acc, d) => {
      const status = d.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Horários preferidos
    const hourCounts = driverDeliveries.reduce((acc, d) => {
      if (d.created_at) {
        const hour = parseISO(d.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const topHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));

    // Áreas mais frequentes
    const areaCounts = driverDeliveries.reduce((acc, d) => {
      if (d.delivery_address) {
        const addressParts = d.delivery_address.split(',');
        const area = addressParts[addressParts.length - 1]?.trim() || 'Unknown';
        acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topAreas = Object.entries(areaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Tipos de serviço
    const serviceTypeCounts = driverDeliveries.reduce((acc, d) => {
      if (d.service_type) {
        acc[d.service_type] = (acc[d.service_type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topServiceTypes = Object.entries(serviceTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Tendências temporais (últimos 30 dias)
    const recentDeliveries = driverDeliveries.filter(d => {
      if (!d.created_at) return false;
      const deliveryDate = parseISO(d.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return deliveryDate >= thirtyDaysAgo;
    });

    // Detecção de padrões e anomalias
    const patterns = [];
    const anomalies = [];

    // Padrão: Alta consistência
    if (successRate >= 95) {
      patterns.push("Motorista extremamente confiável com taxa de sucesso alta");
    }

    // Padrão: Especialização em área
    const dominantArea = topAreas[0];
    if (dominantArea && dominantArea[1] / totalDeliveries > 0.6) {
      patterns.push(`Especializado na região: ${dominantArea[0]} (${Math.round((dominantArea[1] / totalDeliveries) * 100)}% das entregas)`);
    }

    // Padrão: Horário preferido
    const dominantHour = topHours[0];
    if (dominantHour && dominantHour.count / totalDeliveries > 0.3) {
      patterns.push(`Mais ativo no período: ${dominantHour.hour}:00-${dominantHour.hour + 1}:00`);
    }

    // Anomalia: Taxa de sucesso baixa
    if (successRate < 80 && totalDeliveries >= 5) {
      anomalies.push(`Taxa de sucesso baixa: ${successRate.toFixed(1)}% (requer atenção)`);
    }

    // Anomalia: Tempo de entrega alto
    if (avgDeliveryTime > 60 && deliveriesWithDuration >= 3) {
      anomalies.push(`Tempo médio de entrega elevado: ${avgDeliveryTime} minutos`);
    }

    // Anomalia: Poucos pedidos recentes
    if (recentDeliveries.length < totalDeliveries * 0.3 && totalDeliveries >= 10) {
      anomalies.push("Atividade reduzida nos últimos 30 dias");
    }

    return {
      driverName: selectedDriver,
      totalDeliveries,
      successfulDeliveries,
      successRate,
      totalRevenue,
      avgRevenue,
      avgDeliveryTime,
      avgDistance,
      statusAnalysis,
      topHours,
      topAreas,
      topServiceTypes,
      recentDeliveries: recentDeliveries.length,
      patterns,
      anomalies,
      deliveries: driverDeliveries.sort((a, b) => {
        const dateA = a.created_at ? parseISO(a.created_at) : new Date(0);
        const dateB = b.created_at ? parseISO(b.created_at) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
    };
  }, [selectedDriver, deliveries]);

  if (availableDrivers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum motorista encontrado nos dados de delivery.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Motorista */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar motorista por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
          {filteredDrivers.map((driver) => (
            <button
              key={driver.name}
              onClick={() => setSelectedDriver(driver.name)}
              className={`p-3 text-left border rounded-lg transition-all hover:shadow-md ${
                selectedDriver === driver.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm mb-1">{driver.name}</div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>{driver.totalDeliveries} entregas</span>
                <span>•</span>
                <span className={`${driver.successRate >= 90 ? 'text-green-600' : driver.successRate >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                  {driver.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ${driver.totalRevenue.toFixed(2)} total
              </div>
            </button>
          ))}
        </div>

        {filteredDrivers.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            Nenhum motorista encontrado para "{searchTerm}"
          </div>
        )}
      </div>

      {/* Análise Detalhada */}
      {driverAnalysis && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              Análise Detalhada: {driverAnalysis.driverName}
            </h3>
          </div>

          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{driverAnalysis.totalDeliveries}</div>
                  <div className="text-sm text-muted-foreground">Total Entregas</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{driverAnalysis.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Taxa Sucesso</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{driverAnalysis.avgDeliveryTime} min</div>
                  <div className="text-sm text-muted-foreground">Tempo Médio</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">${driverAnalysis.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Receita Total</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance e Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Performance por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(driverAnalysis.statusAnalysis).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Receita Média</span>
                    <div className="font-semibold">${driverAnalysis.avgRevenue.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distância Média</span>
                    <div className="font-semibold">{driverAnalysis.avgDistance.toFixed(1)} km</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Horários e Áreas Preferidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Padrões de Trabalho
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Horários Preferidos</h4>
                  <div className="space-y-1">
                    {driverAnalysis.topHours.map(({ hour, count }, index) => (
                      <div key={hour} className="flex justify-between text-sm">
                        <span>{hour}:00 - {hour + 1}:00</span>
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Principais Áreas</h4>
                  <div className="space-y-1">
                    {driverAnalysis.topAreas.slice(0, 3).map(([area, count], index) => (
                      <div key={area} className="flex justify-between text-sm">
                        <span className="truncate">{area}</span>
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de Serviço */}
            {driverAnalysis.topServiceTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Tipos de Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {driverAnalysis.topServiceTypes.map(([serviceType, count], index) => (
                      <div key={serviceType} className="flex justify-between items-center">
                        <span className="text-sm">{serviceType}</span>
                        <Badge variant={index === 0 ? 'default' : 'outline'}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Atividade Recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-blue-600">{driverAnalysis.recentDeliveries}</div>
                  <div className="text-sm text-muted-foreground">Entregas nos últimos 30 dias</div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {((driverAnalysis.recentDeliveries / driverAnalysis.totalDeliveries) * 100).toFixed(1)}% do total de entregas
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Padrões Identificados */}
          {driverAnalysis.patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Padrões Identificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {driverAnalysis.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <Star className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-green-800">{pattern}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomalias Detectadas */}
          {driverAnalysis.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Pontos de Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {driverAnalysis.anomalies.map((anomaly, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-orange-800">{anomaly}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico Recente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Histórico de Entregas (Últimas 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {driverAnalysis.deliveries.slice(0, 10).map((delivery, index) => (
                  <div key={delivery.id || index} className="flex justify-between items-start p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={delivery.status === 'delivered' ? 'default' : 'secondary'}>
                          {delivery.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {delivery.created_at ? format(parseISO(delivery.created_at), 'dd/MM/yyyy HH:mm') : 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{delivery.customer_name || 'Cliente não informado'}</div>
                        <div className="text-muted-foreground text-xs">{delivery.delivery_address}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">${delivery.cost?.toFixed(2) || '0.00'}</div>
                      {delivery.distance && (
                        <div className="text-xs text-muted-foreground">{delivery.distance} km</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedDriver && (
        <div className="text-center text-muted-foreground py-8">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecione um motorista acima para ver a análise detalhada.</p>
        </div>
      )}
    </div>
  );
};

export default DriverDetailAnalysis; 