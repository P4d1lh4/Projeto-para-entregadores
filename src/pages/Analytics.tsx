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
import { calculateAllTimeMetrics } from '@/utils/timeCalculations';

type AnalyticsProps = {
  deliveryData: DeliveryData[];
  driverData: DriverData[];
  customerData: CustomerData[];
};

const Analytics: React.FC<AnalyticsProps> = ({ deliveryData, driverData, customerData }) => {

  const timeMetrics = useMemo(() => {
    console.log('📊 [Analytics] Iniciando cálculo de métricas de tempo...');
    console.log('📊 [Analytics] Dados recebidos:', {
      totalDeliveries: deliveryData.length,
      firstDelivery: deliveryData[0] ? {
        id: deliveryData[0].id,
        status: deliveryData[0].status,
        deliveryTime: deliveryData[0].deliveryTime,
        timestamps: {
          created_at: deliveryData[0].created_at,
          collected_at: deliveryData[0].collected_at,
          delivered_at: deliveryData[0].delivered_at
        }
      } : 'Nenhuma entrega encontrada'
    });
    
    const result = calculateAllTimeMetrics(deliveryData);
    
    console.log('📊 [Analytics] Métricas calculadas:', {
      collectionTime: `${result.avgCollectionTime.toFixed(2)} min (${result.avgCollectionTimeFormatted})`,
      deliveryTime: `${result.avgDeliveryTime.toFixed(2)} min (${result.avgDeliveryTimeFormatted})`,
      totalTime: `${result.avgCustomerExperienceTime.toFixed(2)} min (${result.avgCustomerExperienceTimeFormatted})`
    });
    
    return result;
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

    // Tendências semanais (últimas 8 semanas)
    const weeklyData = new Map<string, number>();
    const now = new Date();
    
    // Inicializar todas as semanas com 0
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekKey = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      weeklyData.set(weekKey, 0);
    }

    deliveryData.forEach(delivery => {
      if (delivery.deliveryTime) {
        try {
          const createdDate = new Date(delivery.deliveryTime);
          if (!isNaN(createdDate.getTime())) {
            const weekKey = `${createdDate.getDate().toString().padStart(2, '0')}/${(createdDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (weeklyData.has(weekKey)) {
              weeklyData.set(weekKey, weeklyData.get(weekKey)! + 1);
            }
          }
        } catch (error) {
          console.warn('Erro ao processar data:', delivery.deliveryTime, error);
        }
      }
    });

    const weeklyTrends = Array.from(weeklyData.entries()).map(([week, orders]) => ({
      week,
      orders
    }));

    return {
      cancellationRate,
      retentionRate,
      totalUniqueCustomers,
      repeatCustomers,
      weeklyTrends
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

  const formatTimeSimple = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  };

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
                  title="Taxa de Cancelamento"
                  value={`${operationalMetrics.cancellationRate}%`}
                  icon={<XCircle size={20} />}
                  description="Entregas canceladas vs total"
                  trend={{
                    value: operationalMetrics.cancellationRate < 5 ? 5 : -operationalMetrics.cancellationRate,
                    isPositive: operationalMetrics.cancellationRate < 5
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cálculo: (nº entregas com status 'failed') / (total entregas) × 100</p>
              <p>Meta ideal: &lt; 5%</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Tempo Médio de Coleta"
                  value={timeMetrics.avgCollectionTimeFormatted}
                  icon={<Timer size={20} />}
                  description="Tempo de pedido à coleta"
                  trend={{
                    value: timeMetrics.avgCollectionTime < 60 ? 5 : -2,
                    isPositive: timeMetrics.avgCollectionTime < 60
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cálculo: Collected Date/Time - Created Date/Time</p>
              <p>Meta ideal: &lt; 1 hora</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Tempo Médio de Entrega"
                  value={timeMetrics.avgDeliveryTimeFormatted}
                  icon={<ArrowDownCircle size={20} />}
                  description="Tempo da coleta à entrega"
                  trend={{
                    value: timeMetrics.avgDeliveryTime < 45 ? 5 : -2,
                    isPositive: timeMetrics.avgDeliveryTime < 45
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p><strong>Cálculo:</strong> delivered_at - collected_at</p>
              <p><strong>Descrição:</strong> Tempo entre a coleta pelo motorista e a entrega final</p>
              <p><strong>Fonte:</strong> Colunas collected_at e delivered_at do arquivo importado</p>
              <p><strong>Meta ideal:</strong> &lt; 45 minutos</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <StatCard 
                  title="Retenção de Clientes"
                  value={`${operationalMetrics.retentionRate}%`}
                  icon={<UserCheck size={20} />}
                  description={`${operationalMetrics.repeatCustomers} de ${operationalMetrics.totalUniqueCustomers} clientes`}
                  trend={{
                    value: operationalMetrics.retentionRate > 30 ? operationalMetrics.retentionRate : -5,
                    isPositive: operationalMetrics.retentionRate > 30
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cálculo: (clientes com mais de 1 pedido) / (total clientes únicos) × 100</p>
              <p>Baseado em 'Customer Name'</p>
              <p>Meta ideal: &gt; 30%</p>
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
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends" className="flex gap-2 items-center">
              <TrendingUp className="h-4 w-4" /> Tendências Semanais
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex gap-2 items-center">
              <AlertTriangle className="h-4 w-4" /> Performance Operacional
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex gap-2 items-center">
              <Users className="h-4 w-4" /> Análise de Clientes
            </TabsTrigger>
          </TabsList>

          {/* Tendências Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tendência Semanal de Pedidos (Últimas 8 Semanas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={operationalMetrics.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="week" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => [value, 'Pedidos']}
                        labelFormatter={(label) => `Semana: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="orders" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Insights da Tendência</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Dados baseados na coluna 'Delivery Time' dos arquivos carregados</p>
                    <p>• Inclui <strong>todos os dias da semana</strong> (não apenas segunda-feira)</p>
                    <p>• Use esta tendência para planejar recursos e capacidade operacional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Seção informativa sobre cálculo de tempo de entrega */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <ArrowDownCircle className="h-5 w-5" />
                  📊 Cálculo de Tempo Médio de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-700">Fórmula:</span>
                    <code className="bg-white px-2 py-1 rounded border">
                      Tempo de Entrega = delivered_at - collected_at
                    </code>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-700 mt-0.5">Descrição:</span>
                    <div className="text-blue-600">
                      <p>Calcula o tempo entre o momento em que o motorista coleta o item (<strong>collected_at</strong>) até a entrega final ao cliente (<strong>delivered_at</strong>).</p>
                      <p className="mt-1">Este é um indicador crítico de eficiência logística, incluindo tempo de trânsito, localização do endereço e processo de entrega.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-700">Resultado Atual:</span>
                    <span className="font-bold text-blue-800 text-lg">
                      {timeMetrics.avgDeliveryTimeFormatted}
                    </span>
                    <span className="text-blue-600">
                      ({formatTimeSimple(timeMetrics.avgDeliveryTime)})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                        <div className="text-xs text-blue-600 mt-1">
                          ⏱️ collected_at → delivered_at
                        </div>
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
                    <div className="text-sm text-muted-foreground">Clientes Únicos</div>
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
