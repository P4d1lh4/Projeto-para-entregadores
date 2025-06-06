
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Route, 
  BarChart3, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { useOpenAI } from '@/hooks/useOpenAI';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  className?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeFeature, setActiveFeature] = useState<'chat' | 'route' | 'insights' | 'report'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isReady, 
    isLoading, 
    error, 
    chatWithAI, 
    optimizeRoute, 
    getDeliveryInsights, 
    generateReport,
    clearError 
  } = useOpenAI();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isReady) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: 'Hello! I am your AI assistant specialized in logistics and deliveries. To get started, you need to configure your OpenAI API key in the settings.',
        timestamp: new Date()
      }]);
    } else {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: 'Hello! I am your AI assistant specialized in logistics and deliveries. How can I help you today?',
        timestamp: new Date()
      }]);
    }
  }, [isReady]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    if (activeFeature === 'chat') {
      const response = await chatWithAI(inputMessage);
      if (response) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    }
  };

  const handleOptimizeRoute = async () => {
    if (!isReady) return;

    const sampleDeliveries = [
      { address: 'Street A, 123', priority: 8, timeWindow: '09:00-11:00' },
      { address: 'Street B, 456', priority: 5 },
      { address: 'Street C, 789', priority: 9, timeWindow: '14:00-16:00' }
    ];

    const response = await optimizeRoute(sampleDeliveries, 'Distribution Center');
    
    if (response) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Optimized Route:
        
**Delivery order:**
${response.optimizedRoute.map((addr, idx) => `${idx + 1}. ${addr}`).join('\n')}

**Estimates:**
- Total time: ${response.estimatedTime} minutes
- Distance: ${response.estimatedDistance} km

**Suggestions:**
${response.suggestions.join('\n- ')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    }
  };

  const handleGetInsights = async () => {
    if (!isReady) return;

    const sampleData = {
      completedDeliveries: 150,
      averageTime: 25,
      successRate: 92,
      commonIssues: ['Address not found', 'Customer absent', 'Heavy traffic']
    };

    const response = await getDeliveryInsights(sampleData);
    
    if (response) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Performance Analysis:
        
**Efficiency:** ${response.efficiency}/100

**Recommendations:**
${response.recommendations.map(rec => `- ${rec}`).join('\n')}

**Risk Factors:**
${response.riskFactors.map(risk => `- ${risk}`).join('\n')}

**Best Time Slots:**
${response.bestTimeSlots.map(slot => `- ${slot}`).join('\n')}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    }
  };

  const handleGenerateReport = async () => {
    if (!isReady) return;

    const sampleData = {
      period: 'Last week',
      totalDeliveries: 450,
      successfulDeliveries: 415,
      averageDeliveryTime: 23,
      topPerformers: ['John Silva', 'Maria Santos', 'Pedro Costa']
    };

    const response = await generateReport(sampleData);
    
    if (response) {
      const message: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Assistant
          {isReady && <Badge variant="secondary">Connected</Badge>}
          {!isReady && <Badge variant="destructive">Disconnected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button size="sm" variant="outline" onClick={clearError} className="ml-2">
              Close
            </Button>
          </Alert>
        )}

        {/* Feature Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeFeature === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveFeature('chat')}
            disabled={!isReady}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleOptimizeRoute}
            disabled={!isReady || isLoading}
          >
            <Route className="h-4 w-4 mr-2" />
            Optimize Route
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGetInsights}
            disabled={!isReady || isLoading}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Insights
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateReport}
            disabled={!isReady || isLoading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Report
          </Button>
        </div>

        <Separator />

        {/* Messages */}
        <ScrollArea className="h-64 w-full pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.type === 'user' ? (
                      <User className="h-6 w-6 p-1 bg-blue-500 text-white rounded-full" />
                    ) : (
                      <Bot className="h-6 w-6 p-1 bg-green-500 text-white rounded-full" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {message.content}
                    </pre>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <Bot className="h-6 w-6 p-1 bg-green-500 text-white rounded-full" />
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        {activeFeature === 'chat' && (
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!isReady || isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!isReady || isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
