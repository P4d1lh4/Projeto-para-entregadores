import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Route,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Truck,
  Star
} from 'lucide-react';
import type { DeliveryData, DriverData } from '@/lib/file-utils';

interface DriverAnalyticsAdvancedProps {
  deliveries: DeliveryData[];
  drivers: DriverData[];
  selectedDriverIds: string[];
  className?: string;
}

interface DriverMetrics {
  id: string;
  name: string;
  totalDeliveries: number;
  successRate: number;
  avgTime: number;
  rating: number;
  weeklyTrend: number;
  efficiency: number;
  coverage: number;
  consistency: number;
  recentPerformance: {
    lastWeek: number;
    thisWeek: number;
    trend: 'up' | 'down' | 'stable';
  };
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  statusBreakdown: {
    delivered: number;
    failed: number;
    pending: number;
    inTransit: number;
  };
}

export const DriverAnalyticsAdvanced: React.FC<DriverAnalyticsAdvancedProps> = ({
  deliveries,
  drivers,
  selectedDriverIds,
  className
}) => {
  const driverMetrics = useMemo(() => {
    const filteredDrivers = selectedDriverIds.length > 0 
      ? drivers.filter(d => selectedDriverIds.includes(d.id))
      : drivers;

    return filteredDrivers.map(driver => {
      const driverDeliveries = deliveries.filter(d => d.driverId === driver.id);
      
      // Calculate time distribution
      const timeDistribution = driverDeliveries.reduce((acc, delivery) => {
        const hour = new Date(delivery.deliveryTime).getHours();
        if (hour < 12) acc.morning++;
        else if (hour < 18) acc.afternoon++;
        else acc.evening++;
        return acc;
      }, { morning: 0, afternoon: 0, evening: 0 });

      // Calculate status breakdown
      const statusBreakdown = driverDeliveries.reduce((acc, delivery) => {
        acc[delivery.status as keyof typeof acc]++;
        return acc;
      }, { delivered: 0, failed: 0, pending: 0, inTransit: 0 });

      // Calculate efficiency (deliveries per hour worked)
      const efficiency = driver.averageTime > 0 
        ? Math.round((driver.deliveries / (driver.averageTime / 60)) * 10) / 10
        : 0;

      // Calculate coverage (unique areas served)
      const uniqueAreas = new Set(driverDeliveries.map(d => d.city)).size;
      const coverage = Math.min(100, (uniqueAreas / 5) * 100); // Assuming max 5 areas

      // Calculate consistency (standard deviation of daily deliveries)
      const dailyDeliveries = driverDeliveries.reduce((acc, delivery) => {
        const date = delivery.deliveryTime.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const deliveryCounts = Object.values(dailyDeliveries);
      const avgDaily = deliveryCounts.reduce((sum, count) => sum + count, 0) / deliveryCounts.length || 0;
      const variance = deliveryCounts.reduce((sum, count) => sum + Math.pow(count - avgDaily, 2), 0) / deliveryCounts.length || 0;
      const consistency = Math.max(0, 100 - Math.sqrt(variance) * 10);

      // Mock recent performance trend
      const lastWeek = Math.floor(driver.deliveries * 0.4);
      const thisWeek = driver.deliveries - lastWeek;
      const trend = thisWeek > lastWeek ? 'up' : thisWeek < lastWeek ? 'down' : 'stable';

      return {
        id: driver.id,
        name: driver.name,
        totalDeliveries: driver.deliveries,
        successRate: driver.successRate * 100,
        avgTime: driver.averageTime,
        rating: driver.rating,
        weeklyTrend: thisWeek - lastWeek,
        efficiency,
        coverage,
        consistency,
        recentPerformance: {
          lastWeek,
          thisWeek,
          trend
        },
        timeDistribution,
        statusBreakdown
      } as DriverMetrics;
    });
  }, [deliveries, drivers, selectedDriverIds]);

  const aggregatedMetrics = useMemo(() => {
    if (driverMetrics.length === 0) return null;

    const totalDeliveries = driverMetrics.reduce((sum, d) => sum + d.totalDeliveries, 0);
    const avgSuccessRate = driverMetrics.reduce((sum, d) => sum + d.successRate, 0) / driverMetrics.length;
    const avgRating = driverMetrics.reduce((sum, d) => sum + d.rating, 0) / driverMetrics.length;
    const avgEfficiency = driverMetrics.reduce((sum, d) => sum + d.efficiency, 0) / driverMetrics.length;

    return {
      totalDeliveries,
      avgSuccessRate,
      avgRating,
      avgEfficiency,
      topPerformer: driverMetrics.reduce((top, current) => 
        current.efficiency > top.efficiency ? current : top
      ),
      improvementNeeded: driverMetrics.filter(d => d.successRate < 85 || d.efficiency < 2)
    };
  }, [driverMetrics]);

  const getPerformanceBadge = (successRate: number) => {
    if (successRate >= 95) return { variant: 'default' as const, label: 'Excelente' };
    if (successRate >= 85) return { variant: 'secondary' as const, label: 'Bom' };
    if (successRate >= 70) return { variant: 'outline' as const, label: 'Regular' };
    return { variant: 'destructive' as const, label: 'Precisa Melhorar' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  if (driverMetrics.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Advanced Driver Analytics</CardTitle>
          <CardDescription>Select drivers to see detailed analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Advanced Driver Analytics
        </CardTitle>
        <CardDescription>
          Detailed analysis of {driverMetrics.length} driver{driverMetrics.length !== 1 ? 'es' : ''}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {aggregatedMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Deliveries</p>
                        <p className="text-2xl font-bold">{aggregatedMetrics.totalDeliveries}</p>
                      </div>
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Success Rate</p>
                        <p className="text-2xl font-bold">{aggregatedMetrics.avgSuccessRate.toFixed(1)}%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Rating</p>
                        <p className="text-2xl font-bold">{aggregatedMetrics.avgRating.toFixed(1)}</p>
                      </div>
                      <Star className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Efficiency</p>
                        <p className="text-2xl font-bold">{aggregatedMetrics.avgEfficiency.toFixed(1)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="space-y-3">
              {driverMetrics.map(driver => (
                <Card key={driver.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium">{driver.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {driver.totalDeliveries} deliveries • {driver.avgTime}min average
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(driver.recentPerformance.trend)}
                          <span className="text-sm">
                            {driver.weeklyTrend > 0 ? '+' : ''}{driver.weeklyTrend}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge {...getPerformanceBadge(driver.successRate)}>
                          {driver.successRate.toFixed(1)}%
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{driver.rating}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-4">
              {driverMetrics.map(driver => (
                <Card key={driver.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{driver.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={driver.successRate} className="flex-1" />
                          <span className="text-sm font-medium">{driver.successRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Coverage</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={driver.coverage} className="flex-1" />
                          <span className="text-sm font-medium">{driver.coverage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Consistency</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={driver.consistency} className="flex-1" />
                          <span className="text-sm font-medium">{driver.consistency.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Efficiency</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={Math.min(100, driver.efficiency * 20)} className="flex-1" />
                          <span className="text-sm font-medium">{driver.efficiency.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Delivery Status</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Entregues</span>
                            <Badge variant="default">{driver.statusBreakdown.delivered}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Falharam</span>
                            <Badge variant="destructive">{driver.statusBreakdown.failed}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Pendentes</span>
                            <Badge variant="secondary">{driver.statusBreakdown.pending}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {driverMetrics.map(driver => (
                <Card key={driver.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {driver.name}
                      <Badge variant={driver.efficiency >= 3 ? "default" : driver.efficiency >= 2 ? "secondary" : "destructive"}>
                        {driver.efficiency.toFixed(1)} ent/h
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tempo médio por entrega</span>
                        <span className="font-medium">{driver.avgTime}min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Entregas por hora</span>
                        <span className="font-medium">{driver.efficiency.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Taxa de sucesso</span>
                        <span className="font-medium">{driver.successRate.toFixed(1)}%</span>
                      </div>
                      {driver.efficiency < 2 && (
                        <div className="flex items-center gap-2 text-orange-600 text-sm mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          Oportunidade de melhoria na eficiência
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="space-y-4">
              {driverMetrics.map(driver => (
                <Card key={driver.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {driver.name}
                      {getTrendIcon(driver.recentPerformance.trend)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Last Week</p>
                        <p className="text-xl font-bold">{driver.recentPerformance.lastWeek}</p>
                        <p className="text-xs text-muted-foreground">deliveries</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">This Week</p>
                        <p className="text-xl font-bold">{driver.recentPerformance.thisWeek}</p>
                        <p className="text-xs text-muted-foreground">deliveries</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Variation</p>
                        <p className={`text-xl font-bold ${driver.weeklyTrend > 0 ? 'text-green-600' : driver.weeklyTrend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {driver.weeklyTrend > 0 ? '+' : ''}{driver.weeklyTrend}
                        </p>
                        <p className="text-xs text-muted-foreground">deliveries</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 