import React from 'react';
import { Brain, Database, MessageSquare, Lightbulb, AlertCircle } from 'lucide-react';
import ChatGptInsights from '@/components/ai/ChatGptInsights';
import { useDeliveryData } from '@/features/deliveries/hooks/useDeliveryData';

const AIAnalysis: React.FC = () => {
  const { deliveryData, loading } = useDeliveryData();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Smart Analysis</h1>
            <p className="text-gray-600">
              AI Assistant specialized in delivery data analysis
            </p>
          </div>
        </div>

        {/* Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Specific Data</h3>
                <p className="text-sm text-gray-600">Analysis based on your imported files</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Contextual Responses</h3>
                <p className="text-sm text-gray-600">Specific insights about your data</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Lightbulb className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Recommendations</h3>
                <p className="text-sm text-gray-600">Practical optimization suggestions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-800 mb-2">💡 How to use the AI Assistant:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <strong>Driver Questions:</strong>
              <br />• "Who is the best driver?"
              <br />• "John Smith's performance"
              <br />• "Drivers with low efficiency"
            </div>
            <div>
              <strong>Customer Analysis:</strong>
              <br />• "Top customers by volume"
              <br />• "Customers in São Paulo"
              <br />• "Growth opportunities"
            </div>
            <div>
              <strong>Routes and Locations:</strong>
              <br />• "Analyze most used routes"
              <br />• "Cities with most deliveries"
              <br />• "Route optimization"
            </div>
            <div>
              <strong>General Performance:</strong>
              <br />• "Period summary"
              <br />• "Main bottlenecks"
              <br />• "Improvement suggestions"
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading delivery data...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200">
            <h2 className="font-semibold text-gray-800 mb-1">OpenAI Powered Insights</h2>
            <p className="text-sm text-gray-600">
              Advanced AI analysis with route optimization and performance insights ({deliveryData?.length || 0} deliveries)
            </p>
          </div>
          
          {/* OpenAI Setup Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1 text-sm">
                <h3 className="font-medium text-yellow-800 mb-1">OpenAI API Required</h3>
                <p className="text-yellow-700 mb-2">
                  This feature requires a valid OpenAI API key with available credits.
                </p>
                <div className="text-yellow-700 space-y-1">
                  <p><strong>Common Error (429):</strong> "Quota exceeded" means you need to:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Visit <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Billing</a> to add credits</li>
                    <li>Set up a payment method for automatic billing</li>
                    <li>Check your usage limits and plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <ChatGptInsights deliveryData={deliveryData} />
        </div>
      )}
    </div>
  );
};

export default AIAnalysis; 