import { useState, useCallback, useEffect } from 'react';
import { openaiService, RouteOptimizationResponse, DeliveryInsightResponse, ChatResponse } from '../services/openaiService';

interface UseOpenAIReturn {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  updateApiKey: (apiKey: string) => void;
  optimizeRoute: (
    deliveries: Array<{
      address: string;
      priority: number;
      timeWindow?: string;
    }>,
    startLocation: string
  ) => Promise<RouteOptimizationResponse | null>;
  getDeliveryInsights: (deliveryData: {
    completedDeliveries: number;
    averageTime: number;
    successRate: number;
    commonIssues: string[];
  }) => Promise<DeliveryInsightResponse | null>;
  chatWithAI: (message: string, context?: string) => Promise<ChatResponse | null>;
  generateReport: (data: any) => Promise<string | null>;
  clearError: () => void;
}

export const useOpenAI = (): UseOpenAIReturn => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsReady(openaiService.isReady());
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateApiKey = useCallback((apiKey: string) => {
    try {
      openaiService.updateApiKey(apiKey);
      setIsReady(true);
      setError(null);
    } catch (err) {
      setError('Failed to update API key');
      setIsReady(false);
    }
  }, []);

  const optimizeRoute = useCallback(async (
    deliveries: Array<{
      address: string;
      priority: number;
      timeWindow?: string;
    }>,
    startLocation: string
  ): Promise<RouteOptimizationResponse | null> => {
    if (!isReady) {
      setError('OpenAI API key not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await openaiService.optimizeRoute(deliveries, startLocation);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize route';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  const getDeliveryInsights = useCallback(async (deliveryData: {
    completedDeliveries: number;
    averageTime: number;
    successRate: number;
    commonIssues: string[];
  }): Promise<DeliveryInsightResponse | null> => {
    if (!isReady) {
      setError('OpenAI API key not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await openaiService.getDeliveryInsights(deliveryData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get delivery insights';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  const chatWithAI = useCallback(async (
    message: string,
    context?: string
  ): Promise<ChatResponse | null> => {
    if (!isReady) {
      setError('OpenAI API key not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await openaiService.chatWithAI(message, context);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  const generateReport = useCallback(async (data: any): Promise<string | null> => {
    if (!isReady) {
      setError('OpenAI API key not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await openaiService.generateDeliveryReport(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  return {
    isReady,
    isLoading,
    error,
    updateApiKey,
    optimizeRoute,
    getDeliveryInsights,
    chatWithAI,
    generateReport,
    clearError,
  };
}; 