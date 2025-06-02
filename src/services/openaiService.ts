import OpenAI from 'openai';

// Types for OpenAI responses
export interface RouteOptimizationResponse {
  optimizedRoute: string[];
  estimatedTime: number;
  estimatedDistance: number;
  suggestions: string[];
}

export interface DeliveryInsightResponse {
  efficiency: number;
  recommendations: string[];
  riskFactors: string[];
  bestTimeSlots: string[];
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

class OpenAIService {
  private openai: OpenAI | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = localStorage.getItem('openaiApiKey');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Only for client-side usage
      });
      this.isInitialized = true;
    }
  }

  public updateApiKey(apiKey: string) {
    localStorage.setItem('openaiApiKey', apiKey);
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    this.isInitialized = true;
  }

  public isReady(): boolean {
    return this.isInitialized && this.openai !== null;
  }

  // Optimize delivery routes using AI
  async optimizeRoute(
    deliveries: Array<{
      address: string;
      priority: number;
      timeWindow?: string;
    }>,
    startLocation: string
  ): Promise<RouteOptimizationResponse> {
    if (!this.isReady()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
        Você é um especialista em otimização de rotas de entrega. Analise as seguintes entregas e otimize a rota:

        Ponto de partida: ${startLocation}
        
        Entregas:
        ${deliveries.map((delivery, index) => 
          `${index + 1}. Endereço: ${delivery.address}, Prioridade: ${delivery.priority}/10${delivery.timeWindow ? `, Janela de tempo: ${delivery.timeWindow}` : ''}`
        ).join('\n')}

        Por favor, forneça:
        1. Uma rota otimizada (ordem dos endereços)
        2. Tempo estimado total
        3. Distância estimada
        4. Sugestões para melhorar a eficiência

        Responda em formato JSON com as chaves: optimizedRoute, estimatedTime, estimatedDistance, suggestions.
      `;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse JSON response
      try {
        return JSON.parse(response);
      } catch {
        // If JSON parsing fails, return a structured response
        return {
          optimizedRoute: deliveries.map(d => d.address),
          estimatedTime: 60, // Default 60 minutes
          estimatedDistance: 10, // Default 10 km
          suggestions: [response]
        };
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
      throw new Error('Failed to optimize route with AI');
    }
  }

  // Get delivery insights and analytics
  async getDeliveryInsights(
    deliveryData: {
      completedDeliveries: number;
      averageTime: number;
      successRate: number;
      commonIssues: string[];
    }
  ): Promise<DeliveryInsightResponse> {
    if (!this.isReady()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
        Analise os seguintes dados de entrega e forneça insights:

        Dados:
        - Entregas completadas: ${deliveryData.completedDeliveries}
        - Tempo médio por entrega: ${deliveryData.averageTime} minutos
        - Taxa de sucesso: ${deliveryData.successRate}%
        - Problemas comuns: ${deliveryData.commonIssues.join(', ')}

        Forneça:
        1. Pontuação de eficiência (0-100)
        2. Recomendações específicas para melhorar
        3. Fatores de risco identificados
        4. Melhores horários para entregas

        Responda em formato JSON com as chaves: efficiency, recommendations, riskFactors, bestTimeSlots.
      `;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(response);
      } catch {
        return {
          efficiency: 75,
          recommendations: [response],
          riskFactors: ['Dados insuficientes'],
          bestTimeSlots: ['09:00-11:00', '14:00-16:00']
        };
      }
    } catch (error) {
      console.error('Error getting delivery insights:', error);
      throw new Error('Failed to get delivery insights');
    }
  }

  // General chat with AI assistant
  async chatWithAI(message: string, context?: string): Promise<ChatResponse> {
    if (!this.isReady()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = `
        Você é um assistente especializado em logística e entregas. 
        Ajude com questões relacionadas a otimização de rotas, gestão de entregas, 
        produtividade de entregadores e soluções para problemas logísticos.
        ${context ? `\nContexto adicional: ${context}` : ''}
      `;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return {
        message: response,
        suggestions: [] // Could be enhanced to extract suggestions
      };
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw new Error('Failed to get AI response');
    }
  }

  // Generate delivery report
  async generateDeliveryReport(data: any): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
        Gere um relatório detalhado de entregas baseado nos seguintes dados:
        ${JSON.stringify(data, null, 2)}

        O relatório deve incluir:
        1. Resumo executivo
        2. Métricas principais
        3. Análise de desempenho
        4. Recomendações
        5. Próximos passos

        Formato: Markdown
      `;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      return completion.choices[0].message.content || 'Erro ao gerar relatório';
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate delivery report');
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService; 