import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Heart,
  DollarSign,
  Calendar,
  MapPin,
  Star,
  Package,
  AlertTriangle,
  Crown,
  Award
} from 'lucide-react';
import type { DeliveryData, CustomerData } from '@/lib/file-utils';

interface CustomerAnalyticsAdvancedProps {
  deliveries: DeliveryData[];
  customers: CustomerData[];
  selectedCustomerIds: string[];
  className?: string;
}

interface CustomerMetrics {
  id: string;
  name: string;
  totalDeliveries: number;
  averageRating: number;
  loyaltyScore: number;
  satisfactionTrend: 'up' | 'down' | 'stable';
  frequency: number;
  lastOrderDays: number;
  preferredTime: string;
  deliverySuccess: number;
  segment: 'vip' | 'regular' | 'occasional' | 'new';
  riskLevel: 'low' | 'medium' | 'high';
  monthlyTrend: {
    current: number;
    previous: number;
    change: number;
  };
  cityPreference: string;
  avgDeliveryRating: number;
}

export const CustomerAnalyticsAdvanced: React.FC<CustomerAnalyticsAdvancedProps> = ({
  deliveries,
  customers,
  selectedCustomerIds,
  className
}) => {
  const customerMetrics = useMemo(() => {
    const filteredCustomers = selectedCustomerIds.length > 0 
      ? customers.filter(c => selectedCustomerIds.includes(c.id))
      : customers;

    return filteredCustomers.map(customer => {
      const customerDeliveries = deliveries.filter(d => d.customerId === customer.id);
      
      // Calculate frequency (orders per month)
      const daysSinceFirst = customerDeliveries.length > 0 
        ? Math.max(1, (Date.now() - new Date(customerDeliveries[0].deliveryTime).getTime()) / (1000 * 60 * 60 * 24))
        : 1;
      const frequency = (customerDeliveries.length / (daysSinceFirst / 30));

      // Calculate last order days
      const lastOrderDays = customerDeliveries.length > 0
        ? Math.floor((Date.now() - new Date(customerDeliveries[customerDeliveries.length - 1].deliveryTime).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate preferred time
      const timeDistribution = customerDeliveries.reduce((acc, delivery) => {
        const hour = new Date(delivery.deliveryTime).getHours();
        if (hour < 12) acc.morning++;
        else if (hour < 18) acc.afternoon++;
        else acc.evening++;
        return acc;
      }, { morning: 0, afternoon: 0, evening: 0 });

      const preferredTime = 
        timeDistribution.morning > timeDistribution.afternoon && timeDistribution.morning > timeDistribution.evening ? 'Manhã' :
        timeDistribution.afternoon > timeDistribution.evening ? 'Tarde' : 'Noite';

      // Calculate delivery success rate
      const successfulDeliveries = customerDeliveries.filter(d => d.status === 'delivered').length;
      const deliverySuccess = customerDeliveries.length > 0 
        ? (successfulDeliveries / customerDeliveries.length) * 100 
        : 0;

      // Calculate loyalty score
      const recencyScore = Math.max(0, 100 - (lastOrderDays * 2));
      const frequencyScore = Math.min(100, frequency * 10);
      const satisfactionScore = customer.averageRating * 20;
      const loyaltyScore = (recencyScore + frequencyScore + satisfactionScore) / 3;

      // Determine customer segment
      let segment: CustomerMetrics['segment'] = 'new';
      if (customerDeliveries.length >= 20 && loyaltyScore > 80) segment = 'vip';
      else if (customerDeliveries.length >= 10 && loyaltyScore > 60) segment = 'regular';
      else if (customerDeliveries.length >= 5) segment = 'occasional';

      // Calculate risk level
      let riskLevel: CustomerMetrics['riskLevel'] = 'low';
      if (lastOrderDays > 30 || customer.averageRating < 3) riskLevel = 'high';
      else if (lastOrderDays > 14 || customer.averageRating < 4) riskLevel = 'medium';

      // Mock monthly trend
      const currentMonth = Math.floor(customerDeliveries.length * 0.6);
      const previousMonth = customerDeliveries.length - currentMonth;
      const monthlyChange = currentMonth - previousMonth;

      // Satisfaction trend based on recent ratings
      const recentRatings = customerDeliveries.slice(-5).map(d => d.rating).filter(Boolean) as number[];
      const earlyRatings = customerDeliveries.slice(0, 5).map(d => d.rating).filter(Boolean) as number[];
      
      const recentAvg = recentRatings.length > 0 ? recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length : 0;
      const earlyAvg = earlyRatings.length > 0 ? earlyRatings.reduce((sum, r) => sum + r, 0) / earlyRatings.length : 0;
      
      const satisfactionTrend = recentAvg > earlyAvg ? 'up' : recentAvg < earlyAvg ? 'down' : 'stable';

      // Most frequent city
      const cityCount = customerDeliveries.reduce((acc, delivery) => {
        acc[delivery.city] = (acc[delivery.city] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const cityPreference = Object.entries(cityCount).reduce((most, [city, count]) => 
        count > most.count ? { city, count } : most, 
        { city: 'Não informado', count: 0 }
      ).city;

      // Average rating customer gives
      const ratings = customerDeliveries.map(d => d.rating).filter(Boolean) as number[];
      const avgDeliveryRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        id: customer.id,
        name: customer.name,
        totalDeliveries: customer.deliveries,
        averageRating: customer.averageRating,
        loyaltyScore,
        satisfactionTrend,
        frequency,
        lastOrderDays,
        preferredTime,
        deliverySuccess,
        segment,
        riskLevel,
        monthlyTrend: {
          current: currentMonth,
          previous: previousMonth,
          change: monthlyChange
        },
        cityPreference,
        avgDeliveryRating
      } as CustomerMetrics;
    });
  }, [deliveries, customers, selectedCustomerIds]);

  const segmentAnalysis = useMemo(() => {
    const segments = customerMetrics.reduce((acc, customer) => {
      if (!acc[customer.segment]) {
        acc[customer.segment] = {
          count: 0,
          totalDeliveries: 0,
          avgLoyalty: 0,
          avgRating: 0
        };
      }
      acc[customer.segment].count++;
      acc[customer.segment].totalDeliveries += customer.totalDeliveries;
      acc[customer.segment].avgLoyalty += customer.loyaltyScore;
      acc[customer.segment].avgRating += customer.averageRating;
      return acc;
    }, {} as Record<string, any>);

    Object.keys(segments).forEach(segment => {
      const data = segments[segment];
      data.avgLoyalty = data.avgLoyalty / data.count;
      data.avgRating = data.avgRating / data.count;
    });

    return segments;
  }, [customerMetrics]);

  const getSegmentBadge = (segment: CustomerMetrics['segment']) => {
    switch (segment) {
      case 'vip': return { variant: 'default' as const, label: 'VIP', icon: Crown };
      case 'regular': return { variant: 'secondary' as const, label: 'Regular', icon: Star };
      case 'occasional': return { variant: 'outline' as const, label: 'Ocasional', icon: Package };
      case 'new': return { variant: 'secondary' as const, label: 'Novo', icon: Users };
    }
  };

  const getRiskBadge = (risk: CustomerMetrics['riskLevel']) => {
    switch (risk) {
      case 'low': return { variant: 'default' as const, label: 'Baixo', color: 'text-green-600' };
      case 'medium': return { variant: 'secondary' as const, label: 'Médio', color: 'text-yellow-600' };
      case 'high': return { variant: 'destructive' as const, label: 'Alto', color: 'text-red-600' };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  if (customerMetrics.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Análise Avançada de Clientes</CardTitle>
          <CardDescription>Selecione clientes para ver análises detalhadas</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalCustomers = customerMetrics.length;
  const avgLoyalty = customerMetrics.reduce((sum, c) => sum + c.loyaltyScore, 0) / totalCustomers;
  const avgFrequency = customerMetrics.reduce((sum, c) => sum + c.frequency, 0) / totalCustomers;
  const riskCustomers = customerMetrics.filter(c => c.riskLevel === 'high').length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Análise Avançada de Clientes
        </CardTitle>
        <CardDescription>
          Análise detalhada de {totalCustomers} cliente{totalCustomers !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="segments">Segmentação</TabsTrigger>
            <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>
            <TabsTrigger value="risk">Análise de Risco</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Score de Fidelidade</p>
                      <p className="text-2xl font-bold">{avgLoyalty.toFixed(1)}</p>
                    </div>
                    <Heart className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Frequência Média</p>
                      <p className="text-2xl font-bold">{avgFrequency.toFixed(1)}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Clientes VIP</p>
                      <p className="text-2xl font-bold">{customerMetrics.filter(c => c.segment === 'vip').length}</p>
                    </div>
                    <Crown className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Alto Risco</p>
                      <p className="text-2xl font-bold">{riskCustomers}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {customerMetrics.slice(0, 10).map(customer => {
                const segmentBadge = getSegmentBadge(customer.segment);
                const riskBadge = getRiskBadge(customer.riskLevel);
                return (
                  <Card key={customer.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {customer.totalDeliveries} entregas • {customer.preferredTime} • {customer.cityPreference}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(customer.satisfactionTrend)}
                            <Badge {...segmentBadge}>
                              <segmentBadge.icon className="h-3 w-3 mr-1" />
                              {segmentBadge.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">Fidelidade: {customer.loyaltyScore.toFixed(0)}</p>
                            <Badge {...riskBadge} className="text-xs">
                              Risco {riskBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{customer.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(segmentAnalysis).map(([segment, data]) => {
                const segmentInfo = getSegmentBadge(segment as CustomerMetrics['segment']);
                return (
                  <Card key={segment}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <segmentInfo.icon className="h-5 w-5" />
                        Clientes {segmentInfo.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade</p>
                          <p className="text-xl font-bold">{data.count}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Entregas</p>
                          <p className="text-xl font-bold">{data.totalDeliveries}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fidelidade Média</p>
                          <p className="text-xl font-bold">{data.avgLoyalty.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avaliação Média</p>
                          <p className="text-xl font-bold">{data.avgRating.toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-4">
            <div className="space-y-4">
              {customerMetrics
                .sort((a, b) => b.loyaltyScore - a.loyaltyScore)
                .slice(0, 15)
                .map(customer => (
                  <Card key={customer.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-medium">{customer.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Último pedido: {customer.lastOrderDays} dias • Frequência: {customer.frequency.toFixed(1)}/mês
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Score de Fidelidade</p>
                            <div className="flex items-center gap-2">
                              <Progress value={customer.loyaltyScore} className="w-24" />
                              <span className="text-sm font-medium">{customer.loyaltyScore.toFixed(0)}</span>
                            </div>
                          </div>
                          <Badge variant={customer.loyaltyScore > 80 ? "default" : customer.loyaltyScore > 60 ? "secondary" : "outline"}>
                            {customer.loyaltyScore > 80 ? 'Alto' : customer.loyaltyScore > 60 ? 'Médio' : 'Baixo'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="space-y-4">
              {customerMetrics
                .filter(c => c.riskLevel !== 'low')
                .sort((a, b) => {
                  const riskOrder = { high: 3, medium: 2, low: 1 };
                  return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
                })
                .map(customer => {
                  const riskBadge = getRiskBadge(customer.riskLevel);
                  return (
                    <Card key={customer.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-medium">{customer.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {customer.lastOrderDays} dias sem pedido • Avaliação média: {customer.averageRating.toFixed(1)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Nível de Risco</p>
                              <Badge {...riskBadge}>
                                {riskBadge.label}
                              </Badge>
                            </div>
                            {customer.riskLevel === 'high' && (
                              <div className="text-right">
                                <p className="text-xs text-orange-600">Ação necessária</p>
                                <p className="text-xs text-muted-foreground">
                                  {customer.lastOrderDays > 30 ? 'Cliente inativo' : 'Baixa satisfação'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              
              {customerMetrics.filter(c => c.riskLevel !== 'low').length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-medium text-lg">Excelente!</h3>
                    <p className="text-muted-foreground">Todos os clientes estão com baixo risco de churn</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 