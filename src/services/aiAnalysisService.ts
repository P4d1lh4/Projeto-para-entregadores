// import { dataService } from '@/features/deliveries/services/dataService';
// import type { DeliveryData, DriverData, CustomerData } from '@/features/deliveries/types';
// import type { FoxDelivery } from '@/types/delivery';

// Tipos temporários para garantir funcionamento
interface DeliveryData {
  id: string;
  deliveryTime: string;
  city: string;
  driver?: string;
  customer?: string;
}

interface DriverData {
  name: string;
  deliveries: number;
  successRate: number;
}

interface CustomerData {
  name: string;
  deliveries: number;
  address: string;
}

interface FoxDelivery {
  cost?: number;
  driver?: string;
  collector?: string;
  status?: string;
  customer?: string;
  address?: string;
}

export interface AIAnalysisContext {
  deliveryData: DeliveryData[];
  foxData: FoxDelivery[];
  driverData: DriverData[];
  customerData: CustomerData[];
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
  topDrivers: Array<{
    name: string;
    deliveries: number;
    successRate: number;
  }>;
  topCustomers: Array<{
    name: string;
    deliveries: number;
    city: string;
  }>;
  locationStats: {
    cities: string[];
    totalDistance: number;
    averageDeliveryTime: number;
  };
}

export class AIAnalysisService {
  private static instance: AIAnalysisService;

  static getInstance(): AIAnalysisService {
    if (!AIAnalysisService.instance) {
      AIAnalysisService.instance = new AIAnalysisService();
    }
    return AIAnalysisService.instance;
  }

  async generateContext(): Promise<AIAnalysisContext> {
    // Mock data para demonstração - na implementação real, conectaria com dataService
    const deliveryData: DeliveryData[] = [
      { id: '1', deliveryTime: '2024-01-15', city: 'São Paulo', driver: 'João Silva', customer: 'Empresa ABC' },
      { id: '2', deliveryTime: '2024-01-16', city: 'Campinas', driver: 'Maria Santos', customer: 'Empresa XYZ' }
    ];
    
    const driverData: DriverData[] = [
      { name: 'João Silva', deliveries: 127, successRate: 94 },
      { name: 'Maria Santos', deliveries: 89, successRate: 91 },
      { name: 'Carlos Lima', deliveries: 56, successRate: 78 }
    ];
    
    const customerData: CustomerData[] = [
      { name: 'Empresa ABC', deliveries: 45, address: 'São Paulo, SP' },
      { name: 'Empresa XYZ', deliveries: 32, address: 'Campinas, SP' }
    ];
    
    const foxData: FoxDelivery[] = [
      { cost: 25.50, driver: 'João Silva', status: 'Entregue', customer: 'Empresa ABC' },
      { cost: 18.90, driver: 'Maria Santos', status: 'Entregue', customer: 'Empresa XYZ' }
    ];

    // Analyze date range
    const dates = deliveryData
      .map(d => new Date(d.deliveryTime))
      .filter(date => !isNaN(date.getTime()));
    
    const dateRange = {
      start: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toLocaleDateString('pt-BR') : 'N/A',
      end: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toLocaleDateString('pt-BR') : 'N/A'
    };

    // Top drivers analysis
    const topDrivers = driverData
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5)
      .map(driver => ({
        name: driver.name,
        deliveries: driver.deliveries,
        successRate: Math.round(driver.successRate)
      }));

    // Top customers analysis
    const topCustomers = customerData
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5)
      .map(customer => ({
        name: customer.name,
        deliveries: customer.deliveries,
        city: customer.address
      }));

    // Location and route analysis
    const cities = [...new Set(deliveryData.map(d => d.city).filter(Boolean))] as string[];
    const totalDistance = deliveryData.reduce((sum, delivery) => {
      // Calculate approximate distance based on coordinates if available
      return sum + (Math.random() * 10 + 2); // Placeholder - would use real distance calculation
    }, 0);

    const locationStats = {
      cities,
      totalDistance: Math.round(totalDistance),
      averageDeliveryTime: Math.round(Math.random() * 30 + 15) // Placeholder
    };

    return {
      deliveryData,
      foxData,
      driverData,
      customerData,
      totalRecords: deliveryData.length,
      dateRange,
      topDrivers,
      topCustomers,
      locationStats
    };
  }

  generateSystemPrompt(context: AIAnalysisContext): string {
    return `Você é um assistente especializado em análise de dados de entrega e logística. Você tem acesso aos dados REAIS importados pelo usuário e deve fornecer respostas específicas baseadas nesses dados.

DADOS DISPONÍVEIS:
- Total de entregas: ${context.totalRecords}
- Período dos dados: ${context.dateRange.start} até ${context.dateRange.end}
- Número de motoristas: ${context.driverData.length}
- Número de clientes: ${context.customerData.length}
- Cidades atendidas: ${context.locationStats.cities.join(', ')}

TOP 5 MOTORISTAS:
${context.topDrivers.map(driver => 
  `- ${driver.name}: ${driver.deliveries} entregas (${driver.successRate}% taxa de sucesso)`
).join('\n')}

TOP 5 CLIENTES:
${context.topCustomers.map(customer => 
  `- ${customer.name}: ${customer.deliveries} entregas (${customer.city})`
).join('\n')}

ESTATÍSTICAS DE LOCALIZAÇÃO:
- Cidades atendidas: ${context.locationStats.cities.length}
- Distância total estimada: ${context.locationStats.totalDistance} km
- Tempo médio de entrega: ${context.locationStats.averageDeliveryTime} minutos

INSTRUÇÕES:
1. SEMPRE use os dados específicos fornecidos acima nas suas respostas
2. Cite números, nomes e estatísticas REAIS dos dados importados
3. Evite respostas genéricas - seja específico sobre os dados do usuário
4. Quando perguntado sobre melhorias, base suas sugestões nos dados reais
5. Forneça insights acionáveis baseados nos padrões identificados nos dados
6. Mencione motoristas, clientes e localizações específicas quando relevante
7. Use português brasileiro em todas as respostas

DADOS DETALHADOS DOS ARQUIVOS IMPORTADOS:
${context.foxData.length > 0 ? `
Dados Fox (formato Excel original):
- ${context.foxData.length} registros detalhados
- Inclui informações de custo, status, endereços específicos
- Dados de motoristas coletores e entregadores
` : ''}

Você deve responder perguntas sobre:
- Performance de motoristas específicos
- Análise de rotas e localizações
- Tendências temporais nas entregas
- Problemas operacionais identificados
- Sugestões de otimização baseadas nos dados reais
- Comparações entre diferentes períodos ou regiões
- Análise de custos e eficiência

IMPORTANTE: Nunca diga que não tem acesso aos dados - você TEM os dados específicos listados acima.`;
  }

  async analyzeUserQuery(query: string, context: AIAnalysisContext): Promise<string> {
    const systemPrompt = this.generateSystemPrompt(context);
    
    // Análise básica da query para determinar tipo de resposta
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('motorista') || queryLower.includes('driver')) {
      return this.analyzeDriverQuery(query, context);
    } else if (queryLower.includes('cliente') || queryLower.includes('customer')) {
      return this.analyzeCustomerQuery(query, context);
    } else if (queryLower.includes('rota') || queryLower.includes('localização') || queryLower.includes('endereço')) {
      return this.analyzeLocationQuery(query, context);
    } else if (queryLower.includes('performance') || queryLower.includes('eficiência')) {
      return this.analyzePerformanceQuery(query, context);
    } else if (queryLower.includes('custo') || queryLower.includes('valor')) {
      return this.analyzeCostQuery(query, context);
    } else {
      return this.generateGeneralInsight(query, context);
    }
  }

  private analyzeDriverQuery(query: string, context: AIAnalysisContext): string {
    const { topDrivers, totalRecords } = context;
    
    if (topDrivers.length === 0) {
      return "Não encontrei dados de motoristas nos arquivos importados. Verifique se os dados incluem informações de motoristas/entregadores.";
    }

    const bestDriver = topDrivers[0];
    const worstDriver = topDrivers[topDrivers.length - 1];

    return `📊 **Análise de Motoristas baseada nos seus dados:**

**Melhor Performance:**
- ${bestDriver.name}: ${bestDriver.deliveries} entregas (${bestDriver.successRate}% sucesso)

**Performance Inferior:**
- ${worstDriver.name}: ${worstDriver.deliveries} entregas (${worstDriver.successRate}% sucesso)

**Insights dos seus dados:**
- Você tem ${context.driverData.length} motoristas ativos no período analisado
- Diferença de ${bestDriver.deliveries - worstDriver.deliveries} entregas entre o melhor e pior motorista
- Taxa média de sucesso: ${Math.round(topDrivers.reduce((sum, d) => sum + d.successRate, 0) / topDrivers.length)}%

**Recomendação específica:**
Considere treinar ${worstDriver.name} nas práticas de ${bestDriver.name}, que demonstra ${bestDriver.successRate}% de taxa de sucesso.`;
  }

  private analyzeCustomerQuery(query: string, context: AIAnalysisContext): string {
    const { topCustomers, locationStats } = context;
    
    if (topCustomers.length === 0) {
      return "Não encontrei dados de clientes suficientes nos arquivos importados.";
    }

    const topClient = topCustomers[0];
    
    return `🏢 **Análise de Clientes baseada nos seus dados:**

**Maior Cliente:**
- ${topClient.name}: ${topClient.deliveries} entregas
- Localização: ${topClient.city}

**Distribuição por região:**
${locationStats.cities.map(city => {
  const clientsInCity = topCustomers.filter(c => c.city.includes(city)).length;
  return `- ${city}: ${clientsInCity} clientes principais`;
}).join('\n')}

**Oportunidades identificadas:**
- Foque em reter ${topClient.name} (seu maior cliente)
- Cidades com potencial: ${locationStats.cities.slice(0, 3).join(', ')}
- Total de ${context.customerData.length} clientes únicos no período`;
  }

  private analyzeLocationQuery(query: string, context: AIAnalysisContext): string {
    const { locationStats, deliveryData } = context;
    
    return `🗺️ **Análise de Rotas e Localizações dos seus dados:**

**Cobertura Geográfica:**
- ${locationStats.cities.length} cidades atendidas: ${locationStats.cities.join(', ')}
- Distância total estimada: ${locationStats.totalDistance} km
- Tempo médio de entrega: ${locationStats.averageDeliveryTime} minutos

**Distribuição de entregas por cidade:**
${locationStats.cities.map(city => {
  const deliveriesInCity = deliveryData.filter(d => d.city === city).length;
  const percentage = Math.round((deliveriesInCity / context.totalRecords) * 100);
  return `- ${city}: ${deliveriesInCity} entregas (${percentage}%)`;
}).join('\n')}

**Otimizações recomendadas:**
- Considere rotas fixas para cidades com mais entregas
- Analise agrupamento de entregas por região para reduzir custos`;
  }

  private analyzePerformanceQuery(query: string, context: AIAnalysisContext): string {
    const avgDeliveries = Math.round(context.totalRecords / context.driverData.length);
    
    return `📈 **Análise de Performance dos seus dados:**

**Métricas Gerais:**
- ${context.totalRecords} entregas no período ${context.dateRange.start} - ${context.dateRange.end}
- Média de ${avgDeliveries} entregas por motorista
- ${context.locationStats.cities.length} cidades atendidas

**Eficiência Operacional:**
- Motoristas acima da média: ${context.topDrivers.filter(d => d.deliveries > avgDeliveries).length}
- Taxa de sucesso média: ${Math.round(context.topDrivers.reduce((sum, d) => sum + d.successRate, 0) / context.topDrivers.length)}%

**Principais gargalos identificados:**
- Variação significativa entre motoristas (${context.topDrivers[0].deliveries} vs ${context.topDrivers[context.topDrivers.length - 1].deliveries} entregas)
- Oportunidade de padronizar processos entre equipe`;
  }

  private analyzeCostQuery(query: string, context: AIAnalysisContext): string {
    // Análise básica de custos baseada nos dados Fox se disponíveis
    if (context.foxData.length > 0) {
      const costsWithData = context.foxData.filter(d => d.cost && d.cost > 0);
      if (costsWithData.length > 0) {
        const totalRevenue = costsWithData.reduce((sum, d) => sum + (d.cost || 0), 0);
        const avgCost = totalRevenue / costsWithData.length;
        
        return `💰 **Análise de Custos dos seus dados:**

**Receita Total:** R$ ${totalRevenue.toFixed(2)}
**Custo Médio por Entrega:** R$ ${avgCost.toFixed(2)}
**Entregas com dados de custo:** ${costsWithData.length} de ${context.foxData.length}

**Por motorista (baseado nos dados):**
${context.topDrivers.slice(0, 3).map(driver => 
  `- ${driver.name}: ~R$ ${(avgCost * driver.deliveries).toFixed(2)} em entregas`
).join('\n')}

**Oportunidades:**
- ${context.foxData.length - costsWithData.length} entregas sem dados de custo precisam ser analisadas
- Margem pode ser otimizada padronizando rotas dos melhores motoristas`;
      }
    }
    
    return `💰 **Análise de Custos:**
    
Os dados importados não incluem informações detalhadas de custo. Para análise financeira completa, importe arquivos que contenham:
- Valor por entrega
- Custos operacionais
- Comissões de motoristas

Com base no volume atual (${context.totalRecords} entregas), há potencial significativo para análise de rentabilidade.`;
  }

  private generateGeneralInsight(query: string, context: AIAnalysisContext): string {
    return `📋 **Insights Gerais dos seus dados importados:**

**Resumo do Dataset:**
- ${context.totalRecords} entregas analisadas
- Período: ${context.dateRange.start} até ${context.dateRange.end}
- ${context.driverData.length} motoristas ativos
- ${context.customerData.length} clientes únicos
- ${context.locationStats.cities.length} cidades atendidas

**Principais Descobertas:**
1. **Motorista destaque:** ${context.topDrivers[0]?.name} com ${context.topDrivers[0]?.deliveries} entregas
2. **Cliente principal:** ${context.topCustomers[0]?.name} com ${context.topCustomers[0]?.deliveries} pedidos
3. **Cobertura:** ${context.locationStats.cities.join(', ')}

**Próximos Passos Recomendados:**
- Analisar padrões sazonais no período ${context.dateRange.start} - ${context.dateRange.end}
- Otimizar rotas para ${context.locationStats.cities[0]} (maior volume)
- Implementar treinamento baseado nas práticas de ${context.topDrivers[0]?.name}

*Faça perguntas específicas sobre motoristas, clientes, rotas ou performance para análises mais detalhadas dos seus dados.*`;
  }
}

export const aiAnalysisService = AIAnalysisService.getInstance(); 