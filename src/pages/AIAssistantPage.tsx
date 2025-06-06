
import React from 'react';
import { AIAssistant } from '@/components/AIAssistant';

const AIAssistantPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">
          Intelligent assistant specialized in logistics and delivery optimization
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main AI Assistant */}
        <div className="lg:col-span-2">
          <AIAssistant className="h-[600px]" />
        </div>
        
        {/* Side panel with tips and information */}
        <div className="space-y-6">
          {/* Usage Tips */}
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">💡 Usage Tips</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Route Optimization:</strong>
                <p className="text-muted-foreground">
                  Click "Optimize Route" to get suggestions for more efficient routes
                </p>
              </div>
              <div>
                <strong>Performance Analysis:</strong>
                <p className="text-sm text-muted-foreground mb-4">
                  Use "Insights" for detailed delivery performance analysis
                </p>
              </div>
              <div>
                <strong>Reports:</strong>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate automated reports with analysis and recommendations
                </p>
              </div>
            </div>
          </div>

          {/* Sample Questions */}
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">❓ Suggested Questions</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-muted rounded">
                "How can I reduce average delivery time?"
              </div>
              <div className="p-3 bg-muted rounded">
                "What are the peak hours for deliveries?"
              </div>
              <div className="p-3 bg-muted rounded">
                "How can I improve customer satisfaction?"
              </div>
              <div className="p-3 bg-muted rounded">
                "Which regions have the highest failure rate?"
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">🚀 Available Features</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Intelligent chat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Route optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Performance analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Report generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
