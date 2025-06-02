import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Zap,
  CheckCircle,
  Users,
  DollarSign,
  Route,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { parseISO, differenceInMinutes, subDays, format, isAfter, startOfDay, endOfDay } from 'date-fns';

interface RealTimePerformanceDashboardProps {
  deliveries: FoxDelivery[];
}

interface PerformanceMetric {
  label: string;
  current: number;
  previous: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  trendPercent: number;
  target?: number;
  format: 'number' | 'percentage' | 'currency' | 'time';
  icon: React.ReactNode;
  color: string;
}

const RealTimePerformanceDashboard: React.FC<RealTimePerformanceDashboardProps> = ({ deliveries }) => {
  const performanceData = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const last7Days = subDays(now, 7);
    const previous7Days = subDays(now, 14);

    // Filtrar entregas por períodos
    const todayDeliveries = deliveries.filter(d => 
      d.created_at && isAfter(parseISO(d.created_at), today)
    );
    
    const yesterdayDeliveries = deliveries.filter(d => 
      d.created_at && 
      isAfter(parseISO(d.created_at), yesterday) &&
      !isAfter(parseISO(d.created_at), today)
    );

    const currentWeekDeliveries = deliveries.filter(d => 
      d.created_at && isAfter(parseISO(d.created_at), last7Days)
    );

    const previousWeekDeliveries = deliveries.filter(d => 
      d.created_at && 
      isAfter(parseISO(d.created_at), previous7Days) &&
      !isAfter(parseISO(d.created_at), last7Days)
    );

    // Função para calcular métricas
    const calculateMetrics = (deliveriesSet: FoxDelivery[]) => {
      const total = deliveriesSet.length;
      const successful = deliveriesSet.filter(d => d.status === 'delivered').length;
      const successRate = total > 0 ? (successful / total) * 100 : 0;
      
      // Tempo médio de entrega
      const deliveriesWithTime = deliveriesSet.filter(d => d.collected_at && d.delivered_at);
      let avgDeliveryTime = 0;
      
      if (deliveriesWithTime.length > 0) {
        const totalTime = deliveriesWithTime.reduce((sum, delivery) => {
          const collectedAt = parseISO(delivery.collected_at!);
          const deliveredAt = parseISO(delivery.delivered_at!);
          const duration = differenceInMinutes(deliveredAt, collectedAt);
          return sum + (duration > 0 ? duration : 0);
        }, 0);
        avgDeliveryTime = totalTime / deliveriesWithTime.length;
      }

      // Receita total
      const totalRevenue = deliveriesSet.reduce((sum, d) => sum + (d.cost || 0), 0);
      const avgOrderValue = total > 0 ? totalRevenue / total : 0;

      // Motoristas ativos
      const activeDrivers = new Set(
        deliveriesSet
          .map(d => d.delivering_driver || d.collecting_driver)
          .filter(Boolean)
      ).size;

      // Entregas por hora
      const deliveriesPerHour = deliveriesWithTime.length > 0 
        ? deliveriesWithTime.length / (deliveriesWithTime.reduce((sum, delivery) => {
            const collectedAt = parseISO(delivery.collected_at!);
            const deliveredAt = parseISO(delivery.delivered_at!);
            return sum + (differenceInMinutes(deliveredAt, collectedAt) / 60);
          }, 0) || 1)
        : 0;

      return {
        totalDeliveries: total,
        successRate,
        avgDeliveryTime,
        totalRevenue,
        avgOrderValue,
        activeDrivers,
        deliveriesPerHour
      };
    };

    const todayMetrics = calculateMetrics(todayDeliveries);
    const yesterdayMetrics = calculateMetrics(yesterdayDeliveries);
    const currentWeekMetrics = calculateMetrics(currentWeekDeliveries);
    const previousWeekMetrics = calculateMetrics(previousWeekDeliveries);

    // Calcular tendências
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { trend: 'neutral' as const, percent: 0 };
      const change = ((current - previous) / previous) * 100;
      return {
        trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const,
        percent: Math.abs(change)
      };
    };

    // Métricas para hoje vs ontem
    const dailyMetrics: PerformanceMetric[] = [
      {
        label: 'Entregas Hoje',
        current: todayMetrics.totalDeliveries,
        previous: yesterdayMetrics.totalDeliveries,
        unit: '',
        trend: calculateTrend(todayMetrics.totalDeliveries, yesterdayMetrics.totalDeliveries).trend,
        trendPercent: calculateTrend(todayMetrics.totalDeliveries, yesterdayMetrics.totalDeliveries).percent,
        format: 'number',
        icon: <Activity className="h-4 w-4" />,
        color: 'text-blue-600'
      },
      {
        label: 'Taxa de Sucesso',
        current: todayMetrics.successRate,
        previous: yesterdayMetrics.successRate,
        unit: '%',
        target: 85,
        trend: calculateTrend(todayMetrics.successRate, yesterdayMetrics.successRate).trend,
        trendPercent: calculateTrend(todayMetrics.successRate, yesterdayMetrics.successRate).percent,
        format: 'percentage',
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600'
      },
      {
        label: 'Tempo Médio',
        current: todayMetrics.avgDeliveryTime,
        previous: yesterdayMetrics.avgDeliveryTime,
        unit: 'min',
        target: 45,
        trend: calculateTrend(yesterdayMetrics.avgDeliveryTime, todayMetrics.avgDeliveryTime).trend, // Inverso - menor é melhor
        trendPercent: calculateTrend(yesterdayMetrics.avgDeliveryTime, todayMetrics.avgDeliveryTime).percent,
        format: 'time',
        icon: <Clock className="h-4 w-4" />,
        color: 'text-purple-600'
      },
      {
        label: 'Receita Hoje',
        current: todayMetrics.totalRevenue,
        previous: yesterdayMetrics.totalRevenue,
        unit: '$',
        trend: calculateTrend(todayMetrics.totalRevenue, yesterdayMetrics.totalRevenue).trend,
        trendPercent: calculateTrend(todayMetrics.totalRevenue, yesterdayMetrics.totalRevenue).percent,
        format: 'currency',
        icon: <DollarSign className="h-4 w-4" />,
        color: 'text-green-600'
      }
    ];

    // Métricas semanais
    const weeklyMetrics: PerformanceMetric[] = [
      {
        label: 'Entregas esta Semana',
        current: currentWeekMetrics.totalDeliveries,
        previous: previousWeekMetrics.totalDeliveries,
        unit: '',
        trend: calculateTrend(currentWeekMetrics.totalDeliveries, previousWeekMetrics.totalDeliveries).trend,
        trendPercent: calculateTrend(currentWeekMetrics.totalDeliveries, previousWeekMetrics.totalDeliveries).percent,
        format: 'number',
        icon: <BarChart3 className="h-4 w-4" />,
        color: 'text-blue-600'
      },
      {
        label: 'Motoristas Ativos',
        current: currentWeekMetrics.activeDrivers,
        previous: previousWeekMetrics.activeDrivers,
        unit: '',
        trend: calculateTrend(currentWeekMetrics.activeDrivers, previousWeekMetrics.activeDrivers).trend,
        trendPercent: calculateTrend(currentWeekMetrics.activeDrivers, previousWeekMetrics.activeDrivers).percent,
        format: 'number',
        icon: <Users className="h-4 w-4" />,
        color: 'text-orange-600'
      },
      {
        label: 'Valor Médio/Pedido',
        current: currentWeekMetrics.avgOrderValue,
        previous: previousWeekMetrics.avgOrderValue,
        unit: '$',
        trend: calculateTrend(currentWeekMetrics.avgOrderValue, previousWeekMetrics.avgOrderValue).trend,
        trendPercent: calculateTrend(currentWeekMetrics.avgOrderValue, previousWeekMetrics.avgOrderValue).percent,
        format: 'currency',
        icon: <Target className="h-4 w-4" />,
        color: 'text-green-600'
      },
      {
        label: 'Entregas/Hora',
        current: currentWeekMetrics.deliveriesPerHour,
        previous: previousWeekMetrics.deliveriesPerHour,
        unit: '/h',
        trend: calculateTrend(currentWeekMetrics.deliveriesPerHour, previousWeekMetrics.deliveriesPerHour).trend,
        trendPercent: calculateTrend(currentWeekMetrics.deliveriesPerHour, previousWeekMetrics.deliveriesPerHour).percent,
        format: 'number',
        icon: <Zap className="h-4 w-4" />,
        color: 'text-yellow-600'
      }
    ];

    return {
      dailyMetrics,
      weeklyMetrics,
      todayMetrics,
      currentWeekMetrics
    };
  }, [deliveries]);

  const formatValue = (value: number, format: PerformanceMetric['format']) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toFixed(2)}`;
      case 'time':
        return `${Math.round(value)} min`;
      default:
        return value.toFixed(format === 'number' && value < 10 ? 1 : 0);
    }
  };

  const getTrendIcon = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <div className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = (current: number, target?: number) => {
    if (!target) return 'bg-blue-500';
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance em Tempo Real</h2>
          <p className="text-muted-foreground">
            Última atualização: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Ao Vivo
        </Badge>
      </div>

      {/* Métricas Diárias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Performance de Hoje vs Ontem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceData.dailyMetrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={metric.color}>{metric.icon}</span>
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  {metric.trend !== 'neutral' && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                        {metric.trendPercent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {formatValue(metric.current, metric.format)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ontem: {formatValue(metric.previous, metric.format)}
                  </div>
                </div>

                {metric.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Meta: {formatValue(metric.target, metric.format)}</span>
                      <span>{Math.round((metric.current / metric.target) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(metric.current / metric.target) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Semanais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Performance da Semana vs Semana Anterior
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceData.weeklyMetrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={metric.color}>{metric.icon}</span>
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  {metric.trend !== 'neutral' && (
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                        {metric.trendPercent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {formatValue(metric.current, metric.format)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Semana anterior: {formatValue(metric.previous, metric.format)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Geral da Operação */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Status da Operação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Taxa de Sucesso</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {performanceData.todayMetrics.successRate.toFixed(1)}%
                  </span>
                  {performanceData.todayMetrics.successRate >= 85 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </div>
              <Progress 
                value={performanceData.todayMetrics.successRate} 
                className="h-2"
              />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Eficiência Temporal</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {performanceData.todayMetrics.avgDeliveryTime <= 45 ? 'Ótima' : 
                     performanceData.todayMetrics.avgDeliveryTime <= 60 ? 'Boa' : 'Precisa Melhorar'}
                  </span>
                  {performanceData.todayMetrics.avgDeliveryTime <= 45 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </div>
              <Progress 
                value={Math.max(0, 100 - (performanceData.todayMetrics.avgDeliveryTime - 30))} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-green-600" />
              Eficiência da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {performanceData.currentWeekMetrics.activeDrivers}
                </div>
                <div className="text-sm text-muted-foreground">Motoristas Ativos</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {(performanceData.currentWeekMetrics.totalDeliveries / 
                    Math.max(performanceData.currentWeekMetrics.activeDrivers, 1)).toFixed(1)}
                </div>
                <div className="text-sm text-muted-foreground">Entregas/Motorista</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              Performance Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ${performanceData.todayMetrics.totalRevenue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Receita Hoje</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">
                  ${performanceData.todayMetrics.avgOrderValue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Ticket Médio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimePerformanceDashboard; 