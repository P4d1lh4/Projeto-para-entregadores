import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  TrendingDown, 
  Clock, 
  MapPin, 
  Zap,
  Target,
  Bell,
  CheckCircle,
  XCircle,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  Info
} from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { parseISO, differenceInMinutes, subDays, isAfter } from 'date-fns';

interface SmartAlertsProps {
  deliveries: FoxDelivery[];
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'performance' | 'efficiency' | 'reliability' | 'cost' | 'route';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  actionable: boolean;
  driverName?: string;
  metric?: {
    current: number;
    target: number;
    unit: string;
  };
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ deliveries }) => {
  const alerts = useMemo(() => {
    const alerts: Alert[] = [];
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Agrupar entregas por motorista
    const driverMap = new Map<string, FoxDelivery[]>();
    deliveries.forEach(delivery => {
      const driverName = delivery.delivering_driver || delivery.collecting_driver;
      if (!driverName) return;
      
      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, []);
      }
      driverMap.get(driverName)!.push(delivery);
    });

    // Analisar cada motorista
    driverMap.forEach((driverDeliveries, driverName) => {
      if (driverDeliveries.length < 5) return; // Mínimo para análise

      // Métricas básicas
      const totalDeliveries = driverDeliveries.length;
      const successfulDeliveries = driverDeliveries.filter(d => d.status === 'delivered').length;
      const successRate = (successfulDeliveries / totalDeliveries) * 100;
      
      // Entregas recentes
      const recentDeliveries = driverDeliveries.filter(d => 
        d.created_at && isAfter(parseISO(d.created_at), last7Days)
      );
      
      // Tempo médio de entrega
      const deliveriesWithTime = driverDeliveries.filter(d => d.collected_at && d.delivered_at);
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

      // ALERTAS CRÍTICOS
      
      // 1. Taxa de sucesso muito baixa
      if (successRate < 70) {
        alerts.push({
          id: `${driverName}-low-success`,
          type: 'critical',
          category: 'reliability',
          title: `${driverName}: Taxa de Sucesso Crítica`,
          description: `Taxa de sucesso de apenas ${successRate.toFixed(1)}% está muito abaixo do aceitável`,
          impact: 'Perda de receita e reputação, insatisfação do cliente',
          recommendation: 'Treinamento urgente, revisão de rotas, acompanhamento diário',
          actionable: true,
          driverName,
          metric: { current: successRate, target: 85, unit: '%' }
        });
      }

      // 2. Tempo de entrega excessivo
      if (avgDeliveryTime > 90) {
        alerts.push({
          id: `${driverName}-slow-delivery`,
          type: 'critical',
          category: 'performance',
          title: `${driverName}: Tempo de Entrega Excessivo`,
          description: `Tempo médio de ${avgDeliveryTime.toFixed(0)} minutos está muito alto`,
          impact: 'Aumento de custos operacionais, insatisfação do cliente',
          recommendation: 'Otimizar rotas, verificar veículo, treinamento de eficiência',
          actionable: true,
          driverName,
          metric: { current: avgDeliveryTime, target: 45, unit: 'min' }
        });
      }

      // 3. Inatividade recente
      if (recentDeliveries.length === 0 && totalDeliveries > 10) {
        alerts.push({
          id: `${driverName}-inactive`,
          type: 'warning',
          category: 'efficiency',
          title: `${driverName}: Sem Atividade Recente`,
          description: 'Nenhuma entrega nos últimos 7 dias',
          impact: 'Perda de produtividade, recursos ociosos',
          recommendation: 'Verificar disponibilidade, redistribuir cargas, contato direto',
          actionable: true,
          driverName
        });
      }

      // ALERTAS DE AVISO

      // 4. Taxa de sucesso em declínio
      if (successRate >= 70 && successRate < 85) {
        alerts.push({
          id: `${driverName}-declining-success`,
          type: 'warning',
          category: 'reliability',
          title: `${driverName}: Taxa de Sucesso em Queda`,
          description: `Taxa de ${successRate.toFixed(1)}% está abaixo da meta de 85%`,
          impact: 'Risco de deterioração da performance',
          recommendation: 'Monitoramento próximo, feedback e suporte adicional',
          actionable: true,
          driverName,
          metric: { current: successRate, target: 85, unit: '%' }
        });
      }

      // 5. Tempo de entrega alto mas não crítico
      if (avgDeliveryTime > 60 && avgDeliveryTime <= 90) {
        alerts.push({
          id: `${driverName}-high-time`,
          type: 'warning',
          category: 'performance',
          title: `${driverName}: Tempo de Entrega Elevado`,
          description: `Tempo médio de ${avgDeliveryTime.toFixed(0)} minutos pode ser melhorado`,
          impact: 'Eficiência reduzida, maior custo por entrega',
          recommendation: 'Revisão de rotas, treinamento de navegação, otimização de agenda',
          actionable: true,
          driverName,
          metric: { current: avgDeliveryTime, target: 45, unit: 'min' }
        });
      }

      // ALERTAS INFORMATIVOS

      // 6. Baixa atividade recente
      if (recentDeliveries.length > 0 && recentDeliveries.length < totalDeliveries * 0.2) {
        alerts.push({
          id: `${driverName}-low-activity`,
          type: 'info',
          category: 'efficiency',
          title: `${driverName}: Atividade Reduzida`,
          description: `Apenas ${recentDeliveries.length} entregas na última semana`,
          impact: 'Subutilização de recursos',
          recommendation: 'Verificar capacidade, oferecer mais rotas, revisar agenda',
          actionable: true,
          driverName
        });
      }

      // ALERTAS DE SUCESSO

      // 7. Performance excepcional
      if (successRate >= 95 && avgDeliveryTime < 30) {
        alerts.push({
          id: `${driverName}-excellent`,
          type: 'success',
          category: 'performance',
          title: `${driverName}: Performance Excepcional`,
          description: `${successRate.toFixed(1)}% de sucesso com tempo médio de ${avgDeliveryTime.toFixed(0)} min`,
          impact: 'Benchmark para outros motoristas',
          recommendation: 'Reconhecer publicamente, usar como mentor, estudar métodos',
          actionable: true,
          driverName
        });
      }
    });

    // ALERTAS GERAIS DO SISTEMA

    // 8. Análise geral da equipe
    const overallSuccessRate = deliveries.length > 0 
      ? (deliveries.filter(d => d.status === 'delivered').length / deliveries.length) * 100 
      : 0;

    if (overallSuccessRate < 80) {
      alerts.push({
        id: 'team-low-success',
        type: 'critical',
        category: 'reliability',
        title: 'Taxa de Sucesso da Equipe Crítica',
        description: `Taxa geral de ${overallSuccessRate.toFixed(1)}% está muito baixa`,
        impact: 'Impacto severo na operação e reputação',
        recommendation: 'Revisão completa de processos, treinamento geral, auditoria operacional',
        actionable: true,
        metric: { current: overallSuccessRate, target: 85, unit: '%' }
      });
    }

    // 9. Horários de pico não otimizados
    const hourCounts = deliveries.reduce((acc, d) => {
      if (d.created_at) {
        const hour = parseISO(d.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (peakHour && parseInt(peakHour[0]) >= 11 && parseInt(peakHour[0]) <= 14) {
      alerts.push({
        id: 'peak-hour-optimization',
        type: 'info',
        category: 'efficiency',
        title: 'Otimização de Horários de Pico',
        description: `Pico de entregas às ${peakHour[0]}:00 com ${peakHour[1]} pedidos`,
        impact: 'Oportunidade de melhor distribuição de recursos',
        recommendation: 'Adicionar motoristas no horário de pico, redistribuir cargas',
        actionable: true
      });
    }

    return alerts.sort((a, b) => {
      const priority = { critical: 3, warning: 2, info: 1, success: 0 };
      return priority[b.type] - priority[a.type];
    });
  }, [deliveries]);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
    }
  };

  const getBadgeColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      case 'info': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'performance': return <Zap className="h-3 w-3" />;
      case 'efficiency': return <Target className="h-3 w-3" />;
      case 'reliability': return <CheckCircle className="h-3 w-3" />;
      case 'cost': return <TrendingDown className="h-3 w-3" />;
      case 'route': return <MapPin className="h-3 w-3" />;
    }
  };

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');
  const successAlerts = alerts.filter(a => a.type === 'success');

  return (
    <div className="space-y-6">
      {/* Resumo de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Sistema de Alertas Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{warningAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Avisos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{infoAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Informativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Sucessos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-600" />
              <p>Ótimas notícias! Nenhum alerta detectado.</p>
              <p className="text-sm mt-2">Todas as operações estão funcionando dentro dos parâmetros normais.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${getAlertColor(alert.type)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getAlertIcon(alert.type)}
                      <h3 className="font-semibold">{alert.title}</h3>
                      <div className="flex items-center gap-1">
                        <Badge className={getBadgeColor(alert.type)}>
                          {alert.type}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCategoryIcon(alert.category)}
                          {alert.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {alert.description}
                    </p>

                    {alert.metric && (
                      <div className="mb-3 p-2 bg-muted rounded-lg">
                        <div className="text-xs text-muted-foreground">Métrica</div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            Atual: {alert.metric.current.toFixed(1)}{alert.metric.unit}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-green-600 font-semibold">
                            Meta: {alert.metric.target}{alert.metric.unit}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-red-700">Impacto: </span>
                        <span className="text-xs text-red-600">{alert.impact}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-blue-700">Recomendação: </span>
                        <span className="text-xs text-blue-600">{alert.recommendation}</span>
                      </div>
                    </div>
                  </div>

                  {alert.actionable && (
                    <div className="ml-4">
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Ação
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Próximas Ações Recomendadas */}
      {alerts.filter(a => a.actionable && (a.type === 'critical' || a.type === 'warning')).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Próximas Ações Prioritárias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts
                .filter(a => a.actionable && (a.type === 'critical' || a.type === 'warning'))
                .slice(0, 5)
                .map((alert, index) => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-muted-foreground">{alert.recommendation}</div>
                    </div>
                    <Badge className={getBadgeColor(alert.type)}>
                      {alert.type}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartAlerts; 