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
      As a delivery logistics expert, analyze the following delivery data and provide route optimization suggestions:
      
      Data: ${JSON.stringify(deliveries.slice(0, 5), null, 2)}
      
      Provide practical suggestions for:
      1. Route optimization
      2. Delivery time reduction
      3. Driver efficiency improvement
      4. Operational cost reduction
      
      Response in English, maximum 300 words.
    `;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a delivery route optimization and logistics expert.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'Unable to generate suggestions.';
  }

  // Analyze driver performance and provide insights
  async analyzeDriverPerformance(driverData: any): Promise<string> {
    const prompt = `
      Analyze the performance of the following delivery driver:
      
      Name: ${driverData.name}
      Deliveries: ${driverData.deliveries}
      Success Rate: ${(driverData.successRate * 100).toFixed(1)}%
      Average Time: ${driverData.averageTime} minutes
      Rating: ${driverData.rating}/5
      
      Provide constructive analysis with:
      1. Strengths
      2. Areas for improvement
      3. Specific recommendations
      4. Realistic goals
      
      Response in English, professional and motivating tone.
    `;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an HR consultant specialized in delivery driver performance analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    return response.choices[0]?.message?.content || 'Unable to generate analysis.';
  }

  // Generate business insights from delivery data
  async generateBusinessInsights(analyticsData: any): Promise<string> {
    const prompt = `
      Based on the following delivery analytics data, generate business insights:
      
      - Success Rate: ${analyticsData.successRate}%
      - Active Drivers: ${analyticsData.activeDrivers}
      - Average Delivery Time: ${analyticsData.averageDeliveryTime}h
      - Route Efficiency: ${analyticsData.routeEfficiency}
      - Customer Retention: ${analyticsData.customerRetention}%
      
      Provide strategic insights about:
      1. Current business performance
      2. Growth opportunities
      3. Identified risks
      4. Recommended actions
      
      Response in English, executive focus.
    `;

    const response = await this.makeRequest('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a business consultant specialized in logistics and delivery data analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || 'Unable to generate insights.';
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();

// Export individual functions for easier usage
export const optimizeRoute = (deliveries: any[]) => openAIService.optimizeDeliveryRoute(deliveries);
export const analyzeDriver = (driverData: any) => openAIService.analyzeDriverPerformance(driverData);
export const generateInsights = (analyticsData: any) => openAIService.generateBusinessInsights(analyticsData); 