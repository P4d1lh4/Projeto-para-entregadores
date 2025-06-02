import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOpenAI } from '@/hooks/useOpenAI';
import { Brain, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ChatGptInsightsProps = {
  deliveryData?: any[];
};

const ChatGptInsights: React.FC<ChatGptInsightsProps> = ({ deliveryData }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isReady, isLoading, error, chatWithAI, getDeliveryInsights, clearError } = useOpenAI();
  
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Digite uma pergunta',
        description: 'Digite uma pergunta sobre seus dados de entrega para obter insights.',
        variant: 'destructive',
      });
      return;
    }

    if (!isReady) {
      toast({
        title: 'API OpenAI não configurada',
        description: 'Configure sua chave da API OpenAI nas configurações para usar esta funcionalidade.',
        variant: 'destructive',
      });
      return;
    }

    // Create context from delivery data
    const context = deliveryData ? `
      Dados de entrega disponíveis: ${deliveryData.length} registros
      ${deliveryData.length > 0 ? `
      Exemplo de dados: ${JSON.stringify(deliveryData.slice(0, 3), null, 2)}
      ` : ''}
    ` : 'Nenhum dado de entrega disponível';

    const aiResponse = await chatWithAI(prompt, context);
    
    if (aiResponse) {
      setResponse(aiResponse.message);
      setPrompt(''); // Clear the input after successful response
    }
  };

  const handleGetAutomaticInsights = async () => {
    if (!isReady) {
      toast({
        title: 'API OpenAI não configurada',
        description: 'Configure sua chave da API OpenAI nas configurações.',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryData || deliveryData.length === 0) {
      toast({
        title: 'Sem dados disponíveis',
        description: 'Importe dados de entrega primeiro para obter insights.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate basic metrics for AI analysis
    const completedDeliveries = deliveryData.filter(d => d.status === 'completed' || d.delivered).length;
    const totalDeliveries = deliveryData.length;
    const successRate = (completedDeliveries / totalDeliveries) * 100;
    
    // Get common issues (this could be enhanced with real data analysis)
    const commonIssues = ['Endereço não encontrado', 'Cliente ausente', 'Trânsito intenso'];

    const insights = await getDeliveryInsights({
      completedDeliveries: completedDeliveries,
      averageTime: 25, // Could be calculated from real data
      successRate: successRate,
      commonIssues: commonIssues
    });

    if (insights) {
      const insightText = `
## Análise Automática de Performance

**Eficiência Geral:** ${insights.efficiency}/100

### Recomendações:
${insights.recommendations.map(rec => `• ${rec}`).join('\n')}

### Fatores de Risco Identificados:
${insights.riskFactors.map(risk => `• ${risk}`).join('\n')}

### Melhores Horários para Entregas:
${insights.bestTimeSlots.map(slot => `• ${slot}`).join('\n')}
      `;
      setResponse(insightText);
    }
  };

  const suggestedQuestions = [
    "Como posso otimizar minhas rotas de entrega?",
    "Quais são os principais gargalos na operação?",
    "Como melhorar a satisfação dos clientes?",
    "Quais padrões você identifica nos dados?"
  ];
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Insights</CardTitle>
            {isReady ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>
          {!isReady && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Configurar
            </Button>
          )}
        </div>
        <CardDescription>
          Faça perguntas sobre seus dados de entrega para obter insights com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
              <Button size="sm" variant="outline" onClick={clearError} className="ml-2">
                Fechar
              </Button>
            </Alert>
          )}

          {!isReady && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure sua chave da API OpenAI nas configurações para usar a funcionalidade de IA.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Que insights você pode me dar sobre a performance dos entregadores? Como posso otimizar minhas operações de entrega?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={!isReady}
            />
            
            {/* Suggested questions */}
            {!response && (
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    onClick={() => setPrompt(question)}
                    disabled={!isReady}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {response && (
            <div className="rounded-md bg-secondary/30 p-4 max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">{response}</pre>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || !isReady || !prompt.trim()}
          className="flex-1"
        >
          {isLoading ? 'Processando...' : 'Obter Insights'}
        </Button>
        <Button 
          onClick={handleGetAutomaticInsights}
          disabled={isLoading || !isReady}
          variant="outline"
        >
          {isLoading ? 'Analisando...' : 'Análise Automática'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatGptInsights;
