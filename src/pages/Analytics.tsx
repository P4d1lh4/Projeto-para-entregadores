import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Clock, Users, XCircle, Timer, ArrowDownCircle, UserCheck, 
  Calendar, AlertTriangle
} from 'lucide-react';
import type { DeliveryData, DriverData, CustomerData } from '@/lib/file-utils';
import StatCard from '@/components/dashboard/StatCard';
import { 
  calculateAllTimeMetrics, 
  debugDeliveredWaitingTime,
  calculateAllTimeMetricsFromWaitingColumn, 
  testDeliveredWaitingTimeColumn,
  advancedTimeDataDiagnosis
} from '@/utils/timeCalculations';

type AnalyticsProps = {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
};

function formatTimeSimple(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) return '0 min';
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  if (mins > 0) {
    return `${mins} min ${secs > 0 ? `${secs} s` : ''}`.trim();
  }
  return `${secs} s`;
}

const Analytics: React.FC<AnalyticsProps> = ({ deliveryData, driverData, customerData }) => {
  const timeMetrics = useMemo(() => {
    if (deliveryData.length === 0) {
      return {
        avgCollectionTime: 0,
        avgDeliveryTime: 0,
        avgCustomerExperienceTime: 0,
        avgCollectionTimeFormatted: '00:00:00',
        avgDeliveryTimeFormatted: '00:00:00',
        avgCustomerExperienceTimeFormatted: '00:00:00',
        usedWaitingTimeForCollection: false,
        usedWaitingTimeForDelivery: false,
        collectionTimeMethod: 'N/A',
        deliveryTimeMethod: 'N/A'
      };
    }
      
    console.log('📊 [Analytics] Iniciando cálculos de métricas de tempo...');
    
    // Diagnósticos (executados apenas em desenvolvimento, idealmente)
    advancedTimeDataDiagnosis(deliveryData);
    testDeliveredWaitingTimeColumn(deliveryData);
    debugDeliveredWaitingTime(deliveryData);
    
    const metrics = calculateAllTimeMetricsFromWaitingColumn(deliveryData);
    console.log('📊 [Analytics] Métricas calculadas:', metrics);
    return metrics;
  }, [deliveryData]);

  const operationalMetrics = useMemo(() => {
    console.log('🔄 Calculando métricas operacionais com dados:', {
      deliveries: deliveryData.length,
      drivers: driverData.length,
      customers: customerData.length
    });

    // Taxa de cancelamento (baseada no status)
    const canceledDeliveries = deliveryData.filter(d => d.status === 'failed');
    const cancellationRate = deliveryData.length > 0 ? 
      Math.round((canceledDeliveries.length / deliveryData.length) * 100) : 0;

    // Taxa de retenção de clientes
    const customerOrderCounts = new Map<string, number>();
    
    deliveryData.forEach(delivery => {
      const customerKey = delivery.customerName || 'unknown';
      if (customerKey !== 'unknown') {
        customerOrderCounts.set(customerKey, (customerOrderCounts.get(customerKey) || 0) + 1);
      }
    });

    const totalUniqueCustomers = customerOrderCounts.size;
    const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
    const retentionRate = totalUniqueCustomers > 0 ? 
      Math.round((repeatCustomers / totalUniqueCustomers) * 100) : 0;

    return {
      cancellationRate,
      retentionRate,
      totalUniqueCustomers,
      repeatCustomers,
    };
  }, [deliveryData, driverData, customerData]);

  const secondaryMetrics = useMemo(() => {
    const successfulDeliveries = deliveryData.filter(d => d.status === 'delivered');
    const successRate = deliveryData.length > 0 ? 
      Math.round((successfulDeliveries.length / deliveryData.length) * 100) : 0;

    return {
      successRate,
      validDeliveries: successfulDeliveries.length
    };
  }, [deliveryData]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Indicadores operacionais baseados em dados reais para tomada de decisão</p>
          </div>
        </div>
        
        {/* Principais KPIs Operacionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Cancellation Rate"
                  value={`${operationalMetrics.cancellationRate}%`}
                  icon={<XCircle size={20} />}
                  description="Cancelled vs total deliveries"
                  trend={{
                    value: operationalMetrics.cancellationRate < 5 ? 5 : -operationalMetrics.cancellationRate,
                    isPositive: operationalMetrics.cancellationRate < 5
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Calculation: (number of deliveries with 'failed' status) / (total deliveries) × 100</p>
              <p>Ideal target: &lt; 5%</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Average Collection Time"
                  value={timeMetrics.avgCollectionTimeFormatted}
                  icon={<Timer size={20} />}
                  description={timeMetrics.usedWaitingTimeForCollection ? 'Pre-calculated (CSV)' : 'Order to collection'}
                  trend={{
                    value: timeMetrics.avgCollectionTime < 60 ? 5 : -2,
                    isPositive: timeMetrics.avgCollectionTime < 60
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p><strong>Source:</strong> {timeMetrics.collectionTimeMethod}</p>
              <p><strong>Description:</strong> {timeMetrics.usedWaitingTimeForCollection ? 
                'Pre-calculated waiting time from the source system.' : 
                'Time between order creation and collection by driver.'}</p>
              <p><strong>Ideal target:</strong> &lt; 1 hour</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Average Delivery Time"
                  value={timeMetrics.avgDeliveryTimeFormatted}
                  icon={<ArrowDownCircle size={20} />}
                  description={timeMetrics.usedWaitingTimeForDelivery ? 'Pre-calculated (CSV)' : 'Collection to delivery'}
                  trend={{
                    value: timeMetrics.avgDeliveryTime < 45 ? 5 : -2,
                    isPositive: timeMetrics.avgDeliveryTime < 45
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p><strong>Source:</strong> {timeMetrics.deliveryTimeMethod}</p>
              <p><strong>Description:</strong> {timeMetrics.usedWaitingTimeForDelivery ? 
                'Pre-calculated delivery time from the source system.' : 
                'Time between collection by driver and final delivery.'}</p>
              <p><strong>Ideal target:</strong> &lt; 45 minutes</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Customer Retention"
                  value={`${operationalMetrics.retentionRate}%`}
                  icon={<UserCheck size={20} />}
                  description={`${operationalMetrics.repeatCustomers} of ${operationalMetrics.totalUniqueCustomers} customers`}
                  trend={{
                    value: operationalMetrics.retentionRate > 30 ? operationalMetrics.retentionRate : -5,
                    isPositive: operationalMetrics.retentionRate > 30
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Calculation: (customers with more than 1 order) / (total unique customers) × 100</p>
              <p>Based on 'Customer Name'</p>
              <p>Ideal target: &gt; 30%</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* KPIs Secundários */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Taxa de Sucesso"
            value={`${secondaryMetrics.successRate}%`}
            icon={<TrendingUp size={20} />}
            description="Entregas bem-sucedidas"
            trend={{
              value: secondaryMetrics.successRate,
              isPositive: secondaryMetrics.successRate > 90
            }}
          />
          
          <StatCard 
            title="Tempo Médio Total"
            value={timeMetrics.avgCustomerExperienceTimeFormatted}
            icon={<Clock size={20} />}
            description="Experiência completa do cliente"
            trend={{
              value: timeMetrics.avgCustomerExperienceTime < 120 ? 5 : -2,
              isPositive: timeMetrics.avgCustomerExperienceTime < 120
            }}
          />

          <StatCard 
            title="Total de Entregas"
            value={deliveryData.length.toString()}
            icon={<Users size={20} />}
            description="Volume total processado"
            trend={{
              value: deliveryData.length,
              isPositive: deliveryData.length > 0
            }}
          />
        </div>

        {/* Tabs com análises detalhadas */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance" className="flex gap-2 items-center">
              <AlertTriangle className="h-4 w-4" /> Performance Operacional
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex gap-2 items-center">
              <Users className="h-4 w-4" /> Análise de Clientes
            </TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Tempos Operacionais Detalhados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-orange-50">
                      <div>
                        <div className="font-medium">Tempo Médio de Coleta</div>
                        <div className="text-sm text-muted-foreground">
                          {timeMetrics.avgCollectionTimeFormatted}
                        </div>
                        {timeMetrics.usedWaitingTimeForCollection && (
                        <div className="text-xs text-green-600 mt-1">
                          ⏱️ Usando "Collected Waiting Time"
                        </div>
                        )}
                      </div>
                      <div className="text-orange-600 font-bold text-lg">
                        {formatTimeSimple(timeMetrics.avgCollectionTime)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 border rounded-lg bg-blue-50">
                      <div>
                        <div className="font-medium">Tempo Médio de Entrega</div>
                        <div className="text-sm text-muted-foreground">
                          {timeMetrics.avgDeliveryTimeFormatted}
                        </div>
                        {timeMetrics.usedWaitingTimeForDelivery && (
                        <div className="text-xs text-green-600 mt-1">
                          ⏱️ Usando "Delivered Waiting Time"
                        </div>
                        )}
                      </div>
                      <div className="text-blue-600 font-bold text-lg">
                        {formatTimeSimple(timeMetrics.avgDeliveryTime)}
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 border rounded-lg bg-green-50">
                      <div>
                        <div className="font-medium">Tempo Total Médio</div>
                        <div className="text-sm text-muted-foreground">
                          {timeMetrics.avgCustomerExperienceTimeFormatted}
                        </div>
                      </div>
                      <div className="text-green-600 font-bold text-lg">
                        {formatTimeSimple(timeMetrics.avgCustomerExperienceTime)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Indicadores de Alerta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className={`p-3 border rounded-lg ${
                      operationalMetrics.cancellationRate > 5 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className={`font-medium ${
                        operationalMetrics.cancellationRate > 5 ? 'text-red-800' : 'text-green-800'
                      }`}>
                        Taxa de Cancelamento {operationalMetrics.cancellationRate > 5 ? 'Alta' : 'Normal'}
                      </div>
                      <div className={`text-sm ${
                        operationalMetrics.cancellationRate > 5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {operationalMetrics.cancellationRate}% {operationalMetrics.cancellationRate > 5 ? '(acima da meta de 5%)' : '(dentro da meta)'}
                      </div>
                    </div>

                    <div className={`p-3 border rounded-lg ${
                      timeMetrics.avgCollectionTime > 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className={`font-medium ${
                        timeMetrics.avgCollectionTime > 60 ? 'text-yellow-800' : 'text-green-800'
                      }`}>
                        Tempo de Coleta {timeMetrics.avgCollectionTime > 60 ? 'Elevado' : 'Eficiente'}
                      </div>
                      <div className={`text-sm ${
                        timeMetrics.avgCollectionTime > 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {formatTimeSimple(timeMetrics.avgCollectionTime)} {timeMetrics.avgCollectionTime > 60 ? '(revisar processos)' : '(boa performance)'}
                      </div>
                    </div>

                    <div className={`p-3 border rounded-lg ${
                      timeMetrics.avgDeliveryTime > 45 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className={`font-medium ${
                        timeMetrics.avgDeliveryTime > 45 ? 'text-red-800' : 'text-green-800'
                      }`}>
                        Tempo de Entrega {timeMetrics.avgDeliveryTime > 45 ? 'Lento' : 'Rápido'}
                      </div>
                      <div className={`text-sm ${
                        timeMetrics.avgDeliveryTime > 45 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatTimeSimple(timeMetrics.avgDeliveryTime)} {timeMetrics.avgDeliveryTime > 45 ? '(melhorar rotas)' : '(excelente performance)'}
                      </div>
                    </div>

                    <div className={`p-3 border rounded-lg ${
                      operationalMetrics.retentionRate < 30 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}>
                      <div className={`font-medium ${
                        operationalMetrics.retentionRate < 30 ? 'text-red-800' : 'text-green-800'
                      }`}>
                        Retenção {operationalMetrics.retentionRate < 30 ? 'Baixa' : 'Saudável'}
                      </div>
                      <div className={`text-sm ${
                        operationalMetrics.retentionRate < 30 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {operationalMetrics.retentionRate}% {operationalMetrics.retentionRate < 30 ? '(focar em fidelização)' : '(boa base de clientes)'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Análise de Base de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {operationalMetrics.totalUniqueCustomers}
                    </div>
                    <div className="text-sm text-muted-foreground">Total de Clientes</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {operationalMetrics.repeatCustomers}
                    </div>
                    <div className="text-sm text-muted-foreground">Clientes Recorrentes</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {operationalMetrics.totalUniqueCustomers - operationalMetrics.repeatCustomers}
                    </div>
                    <div className="text-sm text-muted-foreground">Clientes Únicos</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Insights de Retenção</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Taxa de retenção: <strong>{operationalMetrics.retentionRate}%</strong></p>
                    <p>• Clientes que fizeram múltiplos pedidos representam uma base sólida</p>
                    <p>• {operationalMetrics.retentionRate > 30 ? 'Excelente' : 'Oportunidade de'} desempenho em fidelização</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Analytics;
