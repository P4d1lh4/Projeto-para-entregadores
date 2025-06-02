import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Route, 
  Clock, 
  TrendingUp,
  Target,
  Compass,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Navigation,
  Lightbulb
} from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { parseISO, differenceInMinutes } from 'date-fns';

interface RouteOptimizationAnalysisProps {
  deliveries: FoxDelivery[];
}

interface AreaAnalysis {
  area: string;
  totalDeliveries: number;
  avgDeliveryTime: number;
  successRate: number;
  avgDistance: number;
  driversCount: number;
  totalRevenue: number;
  efficiency: number;
  recommendations: string[];
  bottlenecks: string[];
  opportunities: string[];
}

interface DriverRouteAnalysis {
  driverName: string;
  favoriteAreas: string[];
  avgTimePerArea: Record<string, number>;
  efficiencyByArea: Record<string, number>;
  routeOptimizationScore: number;
  suggestions: string[];
}

const RouteOptimizationAnalysis: React.FC<RouteOptimizationAnalysisProps> = ({ deliveries }) => {
  const routeAnalysis = useMemo(() => {
    // Extrair áreas dos endereços
    const extractArea = (address: string) => {
      if (!address) return 'Unknown';
      const parts = address.split(',');
      return parts[parts.length - 1]?.trim() || 'Unknown';
    };

    // Agrupar entregas por área
    const areaMap = new Map<string, FoxDelivery[]>();
    deliveries.forEach(delivery => {
      const area = extractArea(delivery.delivery_address || '');
      if (!areaMap.has(area)) {
        areaMap.set(area, []);
      }
      areaMap.get(area)!.push(delivery);
    });

    // Análise por área
    const areaAnalyses: AreaAnalysis[] = [];
    areaMap.forEach((areaDeliveries, area) => {
      if (areaDeliveries.length < 3) return; // Mínimo para análise

      const totalDeliveries = areaDeliveries.length;
      const successfulDeliveries = areaDeliveries.filter(d => d.status === 'delivered').length;
      const successRate = (successfulDeliveries / totalDeliveries) * 100;

      // Tempo médio de entrega na área
      const deliveriesWithTime = areaDeliveries.filter(d => d.collected_at && d.delivered_at);
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

      // Distância média
      const deliveriesWithDistance = areaDeliveries.filter(d => d.distance && d.distance > 0);
      const avgDistance = deliveriesWithDistance.length > 0
        ? deliveriesWithDistance.reduce((sum, d) => sum + (d.distance || 0), 0) / deliveriesWithDistance.length
        : 0;

      // Motoristas únicos na área
      const uniqueDrivers = new Set(
        areaDeliveries
          .map(d => d.delivering_driver || d.collecting_driver)
          .filter(Boolean)
      );

      // Receita total
      const totalRevenue = areaDeliveries.reduce((sum, d) => sum + (d.cost || 0), 0);

      // Score de eficiência (baseado em tempo, sucesso e produtividade)
      const timeScore = Math.max(0, 100 - (avgDeliveryTime - 30) * 2); // 30 min = base
      const successScore = successRate;
      const productivityScore = Math.min((totalDeliveries / uniqueDrivers.size) * 10, 100);
      const efficiency = (timeScore + successScore + productivityScore) / 3;

      // Identificar recomendações
      const recommendations: string[] = [];
      const bottlenecks: string[] = [];
      const opportunities: string[] = [];

      if (avgDeliveryTime > 60) {
        bottlenecks.push('Tempo de entrega muito alto');
        recommendations.push('Otimizar rotas na área');
      }
      
      if (successRate < 80) {
        bottlenecks.push('Taxa de sucesso baixa');
        recommendations.push('Investigar problemas específicos da área');
      }

      if (uniqueDrivers.size === 1) {
        opportunities.push('Área dependente de um único motorista');
        recommendations.push('Treinar mais motoristas para esta área');
      }

      if (totalDeliveries / uniqueDrivers.size > 20) {
        opportunities.push('Alta demanda por motorista');
        recommendations.push('Adicionar mais motoristas na área');
      }

      if (avgDistance > 15) {
        bottlenecks.push('Distâncias longas');
        recommendations.push('Considerar hub local ou otimização de sequência');
      }

      if (efficiency > 85) {
        opportunities.push('Área de alta eficiência');
        recommendations.push('Replicar estratégias em outras áreas');
      }

      areaAnalyses.push({
        area,
        totalDeliveries,
        avgDeliveryTime,
        successRate,
        avgDistance,
        driversCount: uniqueDrivers.size,
        totalRevenue,
        efficiency,
        recommendations,
        bottlenecks,
        opportunities
      });
    });

    // Análise por motorista
    const driverMap = new Map<string, FoxDelivery[]>();
    deliveries.forEach(delivery => {
      const driverName = delivery.delivering_driver || delivery.collecting_driver;
      if (!driverName) return;
      
      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, []);
      }
      driverMap.get(driverName)!.push(delivery);
    });

    const driverRouteAnalyses: DriverRouteAnalysis[] = [];
    driverMap.forEach((driverDeliveries, driverName) => {
      if (driverDeliveries.length < 5) return;

      // Áreas favoritas (mais frequentes)
      const areaCounts = driverDeliveries.reduce((acc, d) => {
        const area = extractArea(d.delivery_address || '');
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteAreas = Object.entries(areaCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([area]) => area);

      // Tempo médio por área
      const avgTimePerArea: Record<string, number> = {};
      const efficiencyByArea: Record<string, number> = {};

      Object.keys(areaCounts).forEach(area => {
        const areaDeliveries = driverDeliveries.filter(d => 
          extractArea(d.delivery_address || '') === area
        );
        
        const deliveriesWithTime = areaDeliveries.filter(d => d.collected_at && d.delivered_at);
        if (deliveriesWithTime.length > 0) {
          const totalTime = deliveriesWithTime.reduce((sum, delivery) => {
            const collectedAt = parseISO(delivery.collected_at!);
            const deliveredAt = parseISO(delivery.delivered_at!);
            const duration = differenceInMinutes(deliveredAt, collectedAt);
            return sum + (duration > 0 ? duration : 0);
          }, 0);
          avgTimePerArea[area] = totalTime / deliveriesWithTime.length;
        }

        const successCount = areaDeliveries.filter(d => d.status === 'delivered').length;
        const successRate = (successCount / areaDeliveries.length) * 100;
        efficiencyByArea[area] = successRate;
      });

      // Score de otimização de rota
      const avgTime = Object.values(avgTimePerArea).reduce((sum, time) => sum + time, 0) / Object.values(avgTimePerArea).length || 0;
      const avgEfficiency = Object.values(efficiencyByArea).reduce((sum, eff) => sum + eff, 0) / Object.values(efficiencyByArea).length || 0;
      const specialization = favoriteAreas.length > 0 ? (areaCounts[favoriteAreas[0]] / driverDeliveries.length) * 100 : 0;
      
      const routeOptimizationScore = (
        Math.max(0, 100 - (avgTime - 30) * 2) * 0.4 +  // Tempo
        avgEfficiency * 0.4 +                          // Eficiência
        specialization * 0.2                           // Especialização
      );

      // Sugestões personalizadas
      const suggestions: string[] = [];
      
      if (avgTime > 50) {
        suggestions.push('Otimizar sequência de entregas');
      }
      
      if (specialization < 40) {
        suggestions.push('Focar em áreas específicas para ganhar especialização');
      }
      
      const worstArea = Object.entries(avgTimePerArea)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (worstArea && worstArea[1] > avgTime * 1.5) {
        suggestions.push(`Revisar estratégia na área: ${worstArea[0]}`);
      }

      if (favoriteAreas.length >= 2) {
        suggestions.push('Considerar agrupamento de entregas por proximidade');
      }

      driverRouteAnalyses.push({
        driverName,
        favoriteAreas,
        avgTimePerArea,
        efficiencyByArea,
        routeOptimizationScore,
        suggestions
      });
    });

    return {
      areaAnalyses: areaAnalyses.sort((a, b) => b.efficiency - a.efficiency),
      driverRouteAnalyses: driverRouteAnalyses.sort((a, b) => b.routeOptimizationScore - a.routeOptimizationScore),
      totalAreas: areaAnalyses.length,
      avgAreaEfficiency: areaAnalyses.reduce((sum, a) => sum + a.efficiency, 0) / areaAnalyses.length
    };
  }, [deliveries]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 85) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 85) return 'bg-green-500';
    if (efficiency >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Rotas e Otimização</h2>
          <p className="text-muted-foreground">
            Análise geográfica para otimização da eficiência de entregas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {routeAnalysis.totalAreas} áreas analisadas
          </Badge>
          <Badge className={getEfficiencyBadge(routeAnalysis.avgAreaEfficiency)}>
            {routeAnalysis.avgAreaEfficiency.toFixed(1)}% eficiência média
          </Badge>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{routeAnalysis.totalAreas}</div>
              <div className="text-sm text-muted-foreground">Áreas Ativas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {routeAnalysis.areaAnalyses.filter(a => a.efficiency >= 85).length}
              </div>
              <div className="text-sm text-muted-foreground">Áreas Eficientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {routeAnalysis.areaAnalyses.filter(a => a.efficiency < 70).length}
              </div>
              <div className="text-sm text-muted-foreground">Precisam Otimização</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {routeAnalysis.driverRouteAnalyses.filter(d => d.routeOptimizationScore >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Rotas Otimizadas</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Área */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Performance por Área Geográfica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {routeAnalysis.areaAnalyses.slice(0, 6).map((area, index) => (
              <div key={area.area} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${getEfficiencyBadge(area.efficiency)} flex items-center justify-center text-white font-bold text-xs`}>
                      {index + 1}
                    </div>
                    <h3 className="font-semibold">{area.area}</h3>
                    <Badge className={getEfficiencyBadge(area.efficiency)}>
                      {area.efficiency.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      {area.totalDeliveries} entregas • {area.driversCount} motoristas
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{area.avgDeliveryTime.toFixed(0)} min</div>
                    <div className="text-xs text-muted-foreground">Tempo Médio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{area.successRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Taxa Sucesso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{area.avgDistance.toFixed(1)} km</div>
                    <div className="text-xs text-muted-foreground">Distância Média</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">${area.totalRevenue.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Receita Total</div>
                  </div>
                </div>

                {/* Issues e Oportunidades */}
                <div className="grid md:grid-cols-3 gap-3">
                  {area.bottlenecks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-red-700 mb-1">Gargalos</h4>
                      <div className="space-y-1">
                        {area.bottlenecks.map((bottleneck, i) => (
                          <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            {bottleneck}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {area.opportunities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-blue-700 mb-1">Oportunidades</h4>
                      <div className="space-y-1">
                        {area.opportunities.map((opportunity, i) => (
                          <div key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {opportunity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {area.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-green-700 mb-1">Recomendações</h4>
                      <div className="space-y-1">
                        {area.recommendations.slice(0, 2).map((rec, i) => (
                          <div key={i} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Rotas por Motorista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-green-600" />
            Otimização de Rotas por Motorista
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {routeAnalysis.driverRouteAnalyses.slice(0, 4).map((driver) => (
              <div key={driver.driverName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{driver.driverName}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getEfficiencyColor(driver.routeOptimizationScore)}`}>
                      {driver.routeOptimizationScore.toFixed(0)}
                    </span>
                    <Badge className={getEfficiencyBadge(driver.routeOptimizationScore)}>
                      Score
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Áreas Preferidas</h4>
                    <div className="flex flex-wrap gap-1">
                      {driver.favoriteAreas.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Performance por Área</h4>
                    <div className="space-y-1">
                      {Object.entries(driver.avgTimePerArea).slice(0, 3).map(([area, time]) => (
                        <div key={area} className="flex justify-between text-xs">
                          <span>{area}</span>
                          <span className="font-medium">{time.toFixed(0)} min</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {driver.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Sugestões
                      </h4>
                      <div className="space-y-1">
                        {driver.suggestions.slice(0, 2).map((suggestion, i) => (
                          <div key={i} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Plano de Otimização Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">🚨 Prioridade Alta</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {routeAnalysis.areaAnalyses
                    .filter(a => a.efficiency < 60)
                    .slice(0, 3)
                    .map((area, i) => (
                      <li key={i}>• Otimizar {area.area} (Eficiência: {area.efficiency.toFixed(1)}%)</li>
                    ))}
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Prioridade Média</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {routeAnalysis.areaAnalyses
                    .filter(a => a.efficiency >= 60 && a.efficiency < 75)
                    .slice(0, 3)
                    .map((area, i) => (
                      <li key={i}>• Melhorar {area.area} (Eficiência: {area.efficiency.toFixed(1)}%)</li>
                    ))}
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Benchmarks</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {routeAnalysis.areaAnalyses
                    .filter(a => a.efficiency >= 85)
                    .slice(0, 3)
                    .map((area, i) => (
                      <li key={i}>• {area.area} como modelo (Eficiência: {area.efficiency.toFixed(1)}%)</li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Próximos Passos</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Implementar otimização de sequência de entregas nas áreas críticas</li>
                <li>2. Treinar motoristas especializados para áreas de alta demanda</li>
                <li>3. Considerar hubs locais em áreas com distâncias longas</li>
                <li>4. Replicar estratégias das áreas mais eficientes</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteOptimizationAnalysis; 