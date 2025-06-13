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
        You are a delivery route optimization expert. Analyze the following deliveries and optimize the route:

        Starting point: ${startLocation}
        
        Deliveries:
        ${deliveries.map((delivery, index) => 
          `${index + 1}. Address: ${delivery.address}, Priority: ${delivery.priority}/10${delivery.timeWindow ? `, Time window: ${delivery.timeWindow}` : ''}`
        ).join('\n')}

        Please provide:
        1. An optimized route (order of addresses)
        2. Estimated total time
        3. Estimated distance
        4. Suggestions to improve efficiency

        Respond in JSON format with keys: optimizedRoute, estimatedTime, estimatedDistance, suggestions.
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
        Analyze the following delivery data and provide insights:

        Data:
        - Completed deliveries: ${deliveryData.completedDeliveries}
        - Average time per delivery: ${deliveryData.averageTime} minutes
        - Success rate: ${deliveryData.successRate}%
        - Common issues: ${deliveryData.commonIssues.join(', ')}

        Please provide:
        1. Efficiency score (0-100)
        2. Specific recommendations to improve
        3. Risk factors identified
        4. Best times for deliveries

        Respond in JSON format with keys: efficiency, recommendations, riskFactors, bestTimeSlots.
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
          riskFactors: ['Insufficient data'],
          bestTimeSlots: ['09:00-11:00', '14:00-16:00']
        };
      }
    } catch (error: any) {
      console.error('Error getting delivery insights:', error);
      
      // Handle specific OpenAI errors
      if (error?.status === 429) {
        throw new Error('OpenAI quota exceeded. Please check your billing and usage limits at https://platform.openai.com/account/billing');
      } else if (error?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
      } else if (error?.status === 403) {
        throw new Error('OpenAI API access denied. Please check your API key permissions.');
      } else if (error?.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else if (error?.message?.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing and usage limits.');
      } else if (error?.message?.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error(`OpenAI Error: ${error?.message || 'Failed to get delivery insights'}`);
    }
  }

  // General chat with AI assistant
  async chatWithAI(message: string, context?: string): Promise<ChatResponse> {
    if (!this.isReady()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const systemPrompt = `
        You are an assistant specialized in logistics and deliveries. 
        Help with questions related to route optimization, delivery management, 
        driver productivity and solutions for logistic problems.
        ${context ? `\nAdditional context: ${context}` : ''}
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
    } catch (error: any) {
      console.error('Error in AI chat:', error);
      
      // Handle specific OpenAI errors
      if (error?.status === 429) {
        throw new Error('OpenAI quota exceeded. Please check your billing and usage limits at https://platform.openai.com/account/billing');
      } else if (error?.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
      } else if (error?.status === 403) {
        throw new Error('OpenAI API access denied. Please check your API key permissions.');
      } else if (error?.status >= 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else if (error?.message?.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing and usage limits.');
      } else if (error?.message?.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error(`OpenAI Error: ${error?.message || 'Failed to get AI response'}`);
    }
  }

  // Generate delivery report
  async generateDeliveryReport(data: any): Promise<string> {
    if (!this.isReady()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = `
        Generate a detailed delivery report based on the following data:
        ${JSON.stringify(data, null, 2)}

        The report should include:
        1. Executive summary
        2. Key metrics
        3. Performance analysis
        4. Recommendations
        5. Next steps

        Format: Markdown
      `;

      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      return completion.choices[0].message.content || 'Error generating report';
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate delivery report');
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService; 