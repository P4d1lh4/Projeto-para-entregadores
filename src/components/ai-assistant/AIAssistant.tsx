import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Brain, FileText, TrendingUp, MapPin } from 'lucide-react';
import { aiAnalysisService, type AIAnalysisContext } from '@/services/aiAnalysisService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIAssistantProps {
  className?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<AIAnalysisContext | null>(null);
  const [contextLoaded, setContextLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAIContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAIContext = async () => {
    try {
      const aiContext = await aiAnalysisService.generateContext();
      setContext(aiContext);
      setContextLoaded(true);
      
      // Personalized welcome message
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: `👋 **Hello! I'm your delivery analysis assistant.**

I analyzed your imported data and found:
- **${aiContext.totalRecords} deliveries** in the period from ${aiContext.dateRange.start} to ${aiContext.dateRange.end}
- **${aiContext.driverData.length} active drivers**
- **${aiContext.customerData.length} unique customers**
- **${aiContext.locationStats.cities.length} cities** served

I can help you analyze your data specifically. Some examples:
- "How is driver John's performance?"
- "Who are my main customers?"
- "Analyze the most used routes"
- "Identify optimization opportunities"

**What would you like to know about your data?**`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error loading AI context:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: '❌ Could not load data for analysis. Make sure you have imported data files first.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages([errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !context) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiAnalysisService.analyzeUserQuery(inputValue, context);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing question:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '❌ Sorry, an error occurred while processing your question. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    { icon: TrendingUp, text: "Analyze general performance", query: "Give me a general performance analysis of the data" },
    { icon: User, text: "Top drivers", query: "Who are the best drivers?" },
    { icon: MapPin, text: "Route analysis", query: "Analyze routes and locations" },
    { icon: FileText, text: "Complete report", query: "Generate a complete data report" }
  ];

  const handleQuickQuestion = (query: string) => {
    setInputValue(query);
  };

  if (!contextLoaded) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Brain className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-600">Analyzing your imported data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border flex flex-col h-[600px] ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI Assistant - Data Analysis</h3>
            <p className="text-sm text-gray-600">
              Based on {context?.totalRecords || 0} imported deliveries
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%]`}>
              {!message.isUser && (
                <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              
              <div
                className={`p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content.split('**').map((part, index) => 
                    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                  )}
                </div>
                <div className={`text-xs mt-1 ${
                  message.isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
              
              {message.isUser && (
                <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <Bot className="w-4 h-4 text-blue-600 animate-pulse" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="border-t p-4">
          <p className="text-sm text-gray-600 mb-3">Suggested questions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question.query)}
                className="flex items-center space-x-2 p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <question.icon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{question.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a specific question about your data..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant; 