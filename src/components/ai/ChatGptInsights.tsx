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
        title: 'Enter a question',
        description: 'Enter a question about your delivery data to get insights.',
        variant: 'destructive',
      });
      return;
    }

    if (!isReady) {
      toast({
        title: 'OpenAI API not configured',
        description: 'Configure your OpenAI API key in the settings to use this feature.',
        variant: 'destructive',
      });
      return;
    }

    // Create context from delivery data
    const context = deliveryData ? `
      Available delivery data: ${deliveryData.length} records
      ${deliveryData.length > 0 ? `
      Data example: ${JSON.stringify(deliveryData.slice(0, 3), null, 2)}
      ` : ''}
    ` : 'No delivery data available';

    const aiResponse = await chatWithAI(prompt, context);
    
    if (aiResponse) {
      setResponse(aiResponse.message);
      setPrompt(''); // Clear the input after successful response
    }
  };

  const handleGetAutomaticInsights = async () => {
    if (!isReady) {
      toast({
        title: 'OpenAI API not configured',
        description: 'Configure your OpenAI API key in the settings.',
        variant: 'destructive',
      });
      return;
    }

    if (!deliveryData || deliveryData.length === 0) {
      toast({
        title: 'No data available',
        description: 'Import delivery data first to get insights.',
        variant: 'destructive',
      });
      return;
    }

    // Calculate basic metrics for AI analysis
    const completedDeliveries = deliveryData.filter(d => d.status === 'completed' || d.delivered).length;
    const totalDeliveries = deliveryData.length;
    const successRate = (completedDeliveries / totalDeliveries) * 100;
    
    // Get common issues (this could be enhanced with real data analysis)
    const commonIssues = ['Address not found', 'Customer absent', 'Heavy traffic'];

    const insights = await getDeliveryInsights({
      completedDeliveries: completedDeliveries,
      averageTime: 25, // Could be calculated from real data
      successRate: successRate,
      commonIssues: commonIssues
    });

    if (insights) {
      const insightText = `
## Automatic Performance Analysis

**Overall Efficiency:** ${insights.efficiency}/100

### Recommendations:
${insights.recommendations.map(rec => `• ${rec}`).join('\n')}

### Identified Risk Factors:
${insights.riskFactors.map(risk => `• ${risk}`).join('\n')}

### Best Delivery Time Slots:
${insights.bestTimeSlots.map(slot => `• ${slot}`).join('\n')}
      `;
      setResponse(insightText);
    }
  };

  const suggestedQuestions = [
    "How can I optimize my delivery routes?",
    "What are the main bottlenecks in the operation?",
    "How can I improve customer satisfaction?",
    "What patterns do you identify in the data?"
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
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Disconnected
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
              Configure
            </Button>
          )}
        </div>
        <CardDescription>
          Ask questions about your delivery data to get AI insights
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{error}</p>
                  {error.includes('quota') && (
                    <div className="text-sm">
                      <p><strong>How to fix:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Check your OpenAI account billing at <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">platform.openai.com/account/billing</a></li>
                        <li>Add payment method or purchase credits</li>
                        <li>Verify your usage limits and upgrade plan if needed</li>
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
              <Button size="sm" variant="outline" onClick={clearError} className="ml-2">
                Close
              </Button>
            </Alert>
          )}

          {!isReady && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure your OpenAI API key in the settings to use AI functionality.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="What insights can you give me about delivery driver performance? How can I optimize my delivery operations?"
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
          {isLoading ? 'Processing...' : 'Get Insights'}
        </Button>
        <Button 
          onClick={handleGetAutomaticInsights}
          disabled={isLoading || !isReady}
          variant="outline"
        >
          {isLoading ? 'Analyzing...' : 'Automatic Analysis'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatGptInsights;
