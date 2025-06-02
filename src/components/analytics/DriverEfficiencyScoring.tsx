import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Target, 
  Clock, 
  Route,
  Zap,
  Award,
  AlertTriangle,
  ThumbsUp
} from 'lucide-react';
import type { FoxDelivery } from '@/types/delivery';
import { parseISO, differenceInMinutes } from 'date-fns';

interface DriverEfficiencyScoringProps {
  deliveries: FoxDelivery[];
}

interface DriverScore {
  driverName: string;
  totalScore: number;
  scores: {
    efficiency: number;
    reliability: number;
    speed: number;
    consistency: number;
    costEffectiveness: number;
  };
  metrics: {
    totalDeliveries: number;
    successRate: number;
    avgDeliveryTime: number;
    revenuePerDelivery: number;
    deliveriesPerHour: number;
    recentActivityScore: number;
  };
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  improvements: string[];
  strengths: string[];
}

const DriverEfficiencyScoring: React.FC<DriverEfficiencyScoringProps> = ({ deliveries }) => {
  const driverScores = useMemo(() => {
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

    const scores: DriverScore[] = [];
    
    driverMap.forEach((driverDeliveries, driverName) => {
      if (driverDeliveries.length < 3) return; // Mínimo 3 entregas para análise
      
      // Métricas básicas
      const totalDeliveries = driverDeliveries.length;
      const successfulDeliveries = driverDeliveries.filter(d => d.status === 'delivered').length;
      const successRate = (successfulDeliveries / totalDeliveries) * 100;
      
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
      
      // Receita por entrega
      const totalRevenue = driverDeliveries.reduce((sum, d) => sum + (d.cost || 0), 0);
      const revenuePerDelivery = totalRevenue / totalDeliveries;
      
      // Entregas por hora (baseado no período ativo)
      const deliveryHours = deliveriesWithTime.reduce((sum, delivery) => {
        const collectedAt = parseISO(delivery.collected_at!);
        const deliveredAt = parseISO(delivery.delivered_at!);
        return sum + (differenceInMinutes(deliveredAt, collectedAt) / 60);
      }, 0);
      const deliveriesPerHour = deliveryHours > 0 ? totalDeliveries / deliveryHours : 0;
      
      // Atividade recente (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDeliveries = driverDeliveries.filter(d => {
        if (!d.created_at) return false;
        return parseISO(d.created_at) >= thirtyDaysAgo;
      }).length;
      const recentActivityScore = Math.min((recentDeliveries / totalDeliveries) * 100, 100);
      
      // CÁLCULO DOS SCORES (0-100)
      
      // 1. Eficiência (velocidade + produtividade)
      const speedScore = Math.max(0, 100 - (avgDeliveryTime - 20) * 2); // 20 min = 100 pontos
      const productivityScore = Math.min(deliveriesPerHour * 20, 100); // 5/hora = 100 pontos
      const efficiency = (speedScore + productivityScore) / 2;
      
      // 2. Confiabilidade (taxa de sucesso + consistência)
      const reliability = successRate;
      
      // 3. Velocidade (tempo médio normalizado)
      const speed = Math.max(0, Math.min(100, 100 - ((avgDeliveryTime - 15) * 3)));
      
      // 4. Consistência (baseado na variação de tempos)
      let consistency = 85; // Base score
      if (deliveriesWithTime.length > 5) {
        const times = deliveriesWithTime.map(d => {
          const collectedAt = parseISO(d.collected_at!);
          const deliveredAt = parseISO(d.delivered_at!);
          return differenceInMinutes(deliveredAt, collectedAt);
        }).filter(t => t > 0);
        
        if (times.length > 0) {
          const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
          const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
          const stdDev = Math.sqrt(variance);
          const coefficientOfVariation = stdDev / avgTime;
          consistency = Math.max(0, 100 - (coefficientOfVariation * 100));
        }
      }
      
      // 5. Custo-efetividade (receita por entrega)
      const costEffectiveness = Math.min((revenuePerDelivery / 50) * 100, 100); // $50 = 100 pontos
      
      // Score total (média ponderada)
      const totalScore = (
        efficiency * 0.25 +        // 25% - Eficiência
        reliability * 0.25 +       // 25% - Confiabilidade  
        speed * 0.20 +             // 20% - Velocidade
        consistency * 0.15 +       // 15% - Consistência
        costEffectiveness * 0.15   // 15% - Custo-efetividade
      );
      
      // Determinar grade
      let grade: DriverScore['grade'] = 'D';
      if (totalScore >= 95) grade = 'A+';
      else if (totalScore >= 90) grade = 'A';
      else if (totalScore >= 85) grade = 'B+';
      else if (totalScore >= 80) grade = 'B';
      else if (totalScore >= 70) grade = 'C+';
      else if (totalScore >= 60) grade = 'C';
      
      // Identificar pontos fortes
      const strengths: string[] = [];
      if (reliability >= 95) strengths.push('Extremamente confiável');
      if (speed >= 90) strengths.push('Muito rápido');
      if (efficiency >= 90) strengths.push('Altamente eficiente');
      if (consistency >= 90) strengths.push('Muito consistente');
      if (costEffectiveness >= 85) strengths.push('Excelente custo-benefício');
      if (recentActivityScore >= 80) strengths.push('Alta atividade recente');
      
      // Identificar áreas de melhoria
      const improvements: string[] = [];
      if (reliability < 80) improvements.push('Melhorar taxa de sucesso das entregas');
      if (speed < 70) improvements.push('Reduzir tempo médio de entrega');
      if (efficiency < 70) improvements.push('Aumentar produtividade por hora');
      if (consistency < 70) improvements.push('Manter tempos mais consistentes');
      if (costEffectiveness < 60) improvements.push('Focar em entregas de maior valor');
      if (recentActivityScore < 50) improvements.push('Aumentar atividade recente');
      
      scores.push({
        driverName,
        totalScore: Math.round(totalScore),
        scores: {
          efficiency: Math.round(efficiency),
          reliability: Math.round(reliability),
          speed: Math.round(speed),
          consistency: Math.round(consistency),
          costEffectiveness: Math.round(costEffectiveness)
        },
        metrics: {
          totalDeliveries,
          successRate: Math.round(successRate * 10) / 10,
          avgDeliveryTime: Math.round(avgDeliveryTime),
          revenuePerDelivery: Math.round(revenuePerDelivery * 100) / 100,
          deliveriesPerHour: Math.round(deliveriesPerHour * 10) / 10,
          recentActivityScore: Math.round(recentActivityScore)
        },
        grade,
        improvements,
        strengths
      });
    });
    
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }, [deliveries]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-500';
      case 'A': return 'bg-green-400';
      case 'B+': return 'bg-blue-500';
      case 'B': return 'bg-blue-400';
      case 'C+': return 'bg-yellow-500';
      case 'C': return 'bg-yellow-400';
      default: return 'bg-red-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (driverScores.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Dados insuficientes para calcular scores de eficiência.</p>
            <p className="text-sm mt-2">Mínimo de 3 entregas por motorista necessárias.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ranking Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Ranking de Eficiência dos Motoristas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {driverScores.slice(0, 5).map((driver, index) => (
              <div key={driver.driverName} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${getGradeColor(driver.grade)} flex items-center justify-center text-white font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{driver.driverName}</div>
                      <div className="text-sm text-muted-foreground">
                        {driver.metrics.totalDeliveries} entregas • {driver.metrics.successRate}% sucesso
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(driver.totalScore)}`}>
                      {driver.totalScore}
                    </div>
                    <Badge className={getGradeColor(driver.grade)}>
                      {driver.grade}
                    </Badge>
                  </div>
                  {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                  {index === 1 && <Award className="h-6 w-6 text-gray-400" />}
                  {index === 2 && <Star className="h-6 w-6 text-amber-600" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise Detalhada */}
      <div className="grid md:grid-cols-2 gap-6">
        {driverScores.slice(0, 4).map((driver) => (
          <Card key={driver.driverName}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{driver.driverName}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getScoreColor(driver.totalScore)}`}>
                    {driver.totalScore}
                  </span>
                  <Badge className={getGradeColor(driver.grade)}>
                    {driver.grade}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Métricas de Performance */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Entregas</span>
                  <div className="font-semibold">{driver.metrics.totalDeliveries}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Taxa Sucesso</span>
                  <div className="font-semibold">{driver.metrics.successRate}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tempo Médio</span>
                  <div className="font-semibold">{driver.metrics.avgDeliveryTime} min</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Receita/Entrega</span>
                  <div className="font-semibold">${driver.metrics.revenuePerDelivery}</div>
                </div>
              </div>

              {/* Scores Detalhados */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Eficiência</span>
                  <span className="font-medium">{driver.scores.efficiency}%</span>
                </div>
                <Progress value={driver.scores.efficiency} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Confiabilidade</span>
                  <span className="font-medium">{driver.scores.reliability}%</span>
                </div>
                <Progress value={driver.scores.reliability} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Velocidade</span>
                  <span className="font-medium">{driver.scores.speed}%</span>
                </div>
                <Progress value={driver.scores.speed} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Consistência</span>
                  <span className="font-medium">{driver.scores.consistency}%</span>
                </div>
                <Progress value={driver.scores.consistency} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Custo-Efetividade</span>
                  <span className="font-medium">{driver.scores.costEffectiveness}%</span>
                </div>
                <Progress value={driver.scores.costEffectiveness} className="h-2" />
              </div>

              {/* Pontos Fortes */}
              {driver.strengths.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-green-600" />
                    Pontos Fortes
                  </h4>
                  <div className="space-y-1">
                    {driver.strengths.map((strength, index) => (
                      <div key={index} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Áreas de Melhoria */}
              {driver.improvements.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-600" />
                    Áreas de Melhoria
                  </h4>
                  <div className="space-y-1">
                    {driver.improvements.map((improvement, index) => (
                      <div key={index} className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                        {improvement}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estatísticas Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Estatísticas da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(driverScores.reduce((sum, d) => sum + d.totalScore, 0) / driverScores.length)}
              </div>
              <div className="text-sm text-muted-foreground">Score Médio da Equipe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {driverScores.filter(d => d.grade === 'A+' || d.grade === 'A').length}
              </div>
              <div className="text-sm text-muted-foreground">Motoristas Nível A</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {driverScores.filter(d => d.totalScore < 70).length}
              </div>
              <div className="text-sm text-muted-foreground">Precisam Atenção</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(driverScores.reduce((sum, d) => sum + d.metrics.successRate, 0) / driverScores.length)}%
              </div>
              <div className="text-sm text-muted-foreground">Taxa de Sucesso Média</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverEfficiencyScoring; 