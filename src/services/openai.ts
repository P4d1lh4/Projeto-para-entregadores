import { getOpenAIKey } from '@/config/env';

// OpenAI Service Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// OpenAI API Service Class
class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = getOpenAIKey();
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${OPENAI_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  // Generate delivery route optimization suggestions
  async optimizeDeliveryRoute(deliveries: any[]): Promise<string> {
    const prompt = `
      Como especialista em logística de entregas, analise os seguintes dados de entrega e forneça sugestões de otimização de rotas:
      
      Dados: ${JSON.stringify(deliveries.slice(0, 5), null, 2)}
      
      Forneça sugestões práticas para:
      1. Otimização de rotas
      2. Redução de tempo de entrega
      3. Melhoria da eficiência dos motoristas
      4. Redução de custos operacionais
      
      Resposta em português brasileiro, máximo 300 palavras.
    `;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em otimização de rotas de entrega e logística.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'Não foi possível gerar sugestões.';
  }

  // Analyze driver performance and provide insights
  async analyzeDriverPerformance(driverData: any): Promise<string> {
    const prompt = `
      Analise o desempenho do seguinte motorista de entrega:
      
      Nome: ${driverData.name}
      Entregas: ${driverData.deliveries}
      Taxa de Sucesso: ${(driverData.successRate * 100).toFixed(1)}%
      Tempo Médio: ${driverData.averageTime} minutos
      Avaliação: ${driverData.rating}/5
      
      Forneça uma análise construtiva com:
      1. Pontos fortes
      2. Áreas de melhoria
      3. Recomendações específicas
      4. Metas realistas
      
      Resposta em português brasileiro, tom profissional e motivador.
    `;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de RH especializado em análise de performance de motoristas de entrega.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content || 'Não foi possível gerar análise.';
  }

  // Generate business insights from delivery data
  async generateBusinessInsights(analyticsData: any): Promise<string> {
    const prompt = `
      Com base nos seguintes dados de analytics de entrega, gere insights de negócio:
      
      - Taxa de Sucesso: ${analyticsData.successRate}%
      - Motoristas Ativos: ${analyticsData.activeDrivers}
      - Tempo Médio de Entrega: ${analyticsData.averageDeliveryTime}h
      - Eficiência de Rota: ${analyticsData.routeEfficiency}
      - Retenção de Clientes: ${analyticsData.customerRetention}%
      
      Forneça insights estratégicos sobre:
      1. Performance atual do negócio
      2. Oportunidades de crescimento
      3. Riscos identificados
      4. Ações recomendadas
      
      Resposta em português brasileiro, foco executivo.
    `;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de negócios especializado em análise de dados de logística e entrega.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || 'Não foi possível gerar insights.';
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();

// Export individual functions for easier usage
export const optimizeRoute = (deliveries: any[]) => openAIService.optimizeDeliveryRoute(deliveries);
export const analyzeDriver = (driverData: any) => openAIService.analyzeDriverPerformance(driverData);
export const generateInsights = (analyticsData: any) => openAIService.generateBusinessInsights(analyticsData); 