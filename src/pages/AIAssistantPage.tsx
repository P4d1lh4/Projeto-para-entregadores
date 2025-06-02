import React from 'react';
import { AIAssistant } from '@/components/AIAssistant';

const AIAssistantPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assistente de IA</h1>
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
            <h3 className="text-lg font-semibold mb-4">💡 Dicas de Uso</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Otimização de Rotas:</strong>
                <p className="text-muted-foreground">
                  Clique em "Otimizar Rota" para obter sugestões de rotas mais eficientes
                </p>
              </div>
              <div>
                <strong>Análise de Performance:</strong>
                <p className="text-sm text-muted-foreground mb-4">
                  Use "Insights" for detailed delivery performance analysis
                </p>
              </div>
              <div>
                <strong>Relatórios:</strong>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate automated reports with analysis and recommendations
                </p>
              </div>
            </div>
          </div>

          {/* Sample Questions */}
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">❓ Perguntas Sugeridas</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-muted rounded">
                "Como posso reduzir o tempo médio de entrega?"
              </div>
              <div className="p-3 bg-muted rounded">
                "What are the peak hours for deliveries?"
              </div>
              <div className="p-3 bg-muted rounded">
                "Como melhorar a satisfação dos clientes?"
              </div>
              <div className="p-3 bg-muted rounded">
                "Quais regiões têm maior taxa de falha?"
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">🚀 Recursos Disponíveis</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Chat inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Otimização de rotas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>Análise de performance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>Geração de relatórios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage; 