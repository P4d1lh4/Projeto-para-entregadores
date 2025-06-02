import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Route,
  AlertCircle,
  Lightbulb,
  Target
} from 'lucide-react';
import { useOpenAI } from '@/hooks/useOpenAI';
import type { FoxDelivery } from '@/types/delivery';

interface RouteDensityAnalysisProps {
  deliveries: FoxDelivery[];
  className?: string;
}

interface DensityZone {
  area: string;
  deliveryCount: number;
  density: number;
  avgDistance: number;
  timeSpent: number;
}

interface DriverRoute {
  driver: string;
  totalDeliveries: number;
  uniqueAreas: number;
  efficiency: number;
  avgDistancePerDelivery: number;
}

export const RouteDensityAnalysis: React.FC<RouteDensityAnalysisProps> = ({ 
  deliveries, 
  className 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { isReady, chatWithAI } = useOpenAI();

  // Calculate density zones
  const densityZones = useMemo(() => {
    const areaMap = new Map<string, DensityZone>();
    
    deliveries.forEach(delivery => {
      if (delivery.pickup_address && delivery.delivery_address) {
        // Extract area from addresses (simplified - would need better parsing in production)
        const pickupArea = delivery.pickup_address.split(',')[delivery.pickup_address.split(',').length - 2]?.trim() || 'Unknown';
        const deliveryArea = delivery.delivery_address.split(',')[delivery.delivery_address.split(',').length - 2]?.trim() || 'Unknown';
        
        [pickupArea, deliveryArea].forEach(area => {
          if (!areaMap.has(area)) {
            areaMap.set(area, {
              area,
              deliveryCount: 0,
              density: 0,
              avgDistance: 0,
              timeSpent: 0
            });
          }
          
          const zone = areaMap.get(area)!;
          zone.deliveryCount++;
          if (delivery.distance) {
            zone.avgDistance = (zone.avgDistance + delivery.distance) / 2;
          }
        });
      }
    });

    // Calculate density scores
    const maxDeliveries = Math.max(...Array.from(areaMap.values()).map(z => z.deliveryCount));
    areaMap.forEach(zone => {
      zone.density = maxDeliveries > 0 ? (zone.deliveryCount / maxDeliveries) * 100 : 0;
    });

    return Array.from(areaMap.values())
      .sort((a, b) => b.deliveryCount - a.deliveryCount)
      .slice(0, 10);
  }, [deliveries]);

  // Calculate driver routes efficiency
  const driverRoutes = useMemo(() => {
    const driverMap = new Map<string, DriverRoute>();
    
    deliveries.forEach(delivery => {
      const driver = delivery.delivering_driver || delivery.collecting_driver || 'Unknown';
      
      if (!driverMap.has(driver)) {
        driverMap.set(driver, {
          driver,
          totalDeliveries: 0,
          uniqueAreas: 0,
          efficiency: 0,
          avgDistancePerDelivery: 0
        });
      }
      
      const route = driverMap.get(driver)!;
      route.totalDeliveries++;
      
      if (delivery.distance) {
        route.avgDistancePerDelivery = (route.avgDistancePerDelivery + delivery.distance) / 2;
      }
    });

    // Calculate efficiency scores (simplified)
    driverMap.forEach(route => {
      route.efficiency = route.avgDistancePerDelivery > 0 
        ? Math.max(0, 100 - (route.avgDistancePerDelivery * 2)) 
        : 50;
      
      // Count unique areas (simplified)
      const driverDeliveries = deliveries.filter(d => 
        (d.delivering_driver || d.collecting_driver) === route.driver
      );
      const areas = new Set(driverDeliveries.map(d => 
        d.delivery_address?.split(',')[d.delivery_address.split(',').length - 2]?.trim()
      ).filter(Boolean));
      route.uniqueAreas = areas.size;
    });

    return Array.from(driverMap.values())
      .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
      .slice(0, 5);
  }, [deliveries]);

  const generateAIInsights = async () => {
    if (!isReady) return;

    setIsLoadingAI(true);
    
    const context = `
      Análise de densidade de rotas:
      
      Top 5 áreas com maior densidade:
      ${densityZones.slice(0, 5).map(zone => 
        `- ${zone.area}: ${zone.deliveryCount} entregas (densidade: ${zone.density.toFixed(1)}%)`
      ).join('\n')}
      
      Top 5 entregadores por eficiência:
      ${driverRoutes.map(route => 
        `- ${route.driver}: ${route.totalDeliveries} entregas, eficiência: ${route.efficiency.toFixed(1)}%`
      ).join('\n')}
      
      Total de entregas analisadas: ${deliveries.length}
      Entregas geocodificadas: ${deliveries.filter(d => d.pickup_lat && d.delivery_lat).length}
    `;

    try {
      const response = await chatWithAI(
        'Com base na análise de densidade das rotas, forneça insights sobre otimização, identificação de gargalos e oportunidades de melhoria para a operação de entregas.',
        context
      );
      
      if (response) {
        setAiInsights(response.message);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 80) return 'default';
    if (efficiency >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Análise de Densidade de Rotas</CardTitle>
          </div>
          <Badge variant="outline">
            {deliveries.length} entregas analisadas
          </Badge>
        </div>
        <CardDescription>
          Análise detalhada dos padrões de densidade e eficiência das rotas
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="zones">Zonas de Densidade</TabsTrigger>
            <TabsTrigger value="drivers">Eficiência por Entregador</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Zonas Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{densityZones.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {densityZones[0]?.area} é a mais ativa
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Densidade Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {densityZones.length > 0 
                      ? (densityZones.reduce((acc, zone) => acc + zone.density, 0) / densityZones.length).toFixed(1)
                      : 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Distribuição de entregas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Eficiência Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {driverRoutes.length > 0 
                      ? (driverRoutes.reduce((acc, route) => acc + route.efficiency, 0) / driverRoutes.length).toFixed(1)
                      : 0
                    }%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Média dos entregadores
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Insights da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aiInsights ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{aiInsights}</pre>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">
                      {isReady 
                        ? 'Gere insights personalizados com IA sobre os padrões de densidade das rotas'
                        : 'Configure a API OpenAI nas configurações para obter insights da IA'
                      }
                    </p>
                    <Button 
                      onClick={generateAIInsights}
                      disabled={!isReady || isLoadingAI}
                      className="flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      {isLoadingAI ? 'Analisando...' : 'Gerar Insights'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zones" className="space-y-4">
            <div className="space-y-3">
              {densityZones.map((zone, index) => (
                <Card key={zone.area}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{zone.area}</p>
                          <p className="text-sm text-muted-foreground">
                            {zone.deliveryCount} entregas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {zone.density.toFixed(1)}% densidade
                        </Badge>
                        <div className="mt-2 w-24">
                          <Progress value={zone.density} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <div className="space-y-3">
              {driverRoutes.map((route, index) => (
                <Card key={route.driver}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{route.driver}</p>
                          <p className="text-sm text-muted-foreground">
                            {route.totalDeliveries} entregas • {route.uniqueAreas} áreas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getEfficiencyBadge(route.efficiency)}>
                          {route.efficiency.toFixed(1)}% eficiência
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {route.avgDistancePerDelivery.toFixed(1)}km médio
                        </p>
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