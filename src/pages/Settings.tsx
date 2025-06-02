import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Eye, EyeOff, RefreshCw, Trash2, Database } from 'lucide-react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { dataService } from '@/features/deliveries/services/dataService';

const Settings = () => {
  const [mapboxApiKey, setMapboxApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState<boolean>(false);
  const [showMapboxKey, setShowMapboxKey] = useState<boolean>(false);
  const { toast } = useToast();
  const { isReady, updateApiKey, error } = useOpenAI();
  
  // Load saved settings
  useEffect(() => {
    const storedMapboxApiKey = localStorage.getItem('mapboxApiKey');
    const storedOpenaiApiKey = localStorage.getItem('openaiApiKey');
    const storedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
    const storedAutoRefreshEnabled = localStorage.getItem('autoRefreshEnabled');
    
    if (storedMapboxApiKey) setMapboxApiKey(storedMapboxApiKey);
    if (storedOpenaiApiKey) setOpenaiApiKey(storedOpenaiApiKey);
    if (storedNotificationsEnabled) setNotificationsEnabled(storedNotificationsEnabled === 'true');
    if (storedAutoRefreshEnabled) setAutoRefreshEnabled(storedAutoRefreshEnabled === 'true');
  }, []);
  
  const saveSettings = () => {
    localStorage.setItem('mapboxApiKey', mapboxApiKey);
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    localStorage.setItem('autoRefreshEnabled', autoRefreshEnabled.toString());
    
    // Update OpenAI service with new API key
    if (openaiApiKey.trim()) {
      updateApiKey(openaiApiKey);
    }
    
    toast({
      title: 'Configurações salvas',
      description: 'Suas configurações foram salvas com sucesso',
    });
  };

  const testOpenAIConnection = async () => {
    if (!openaiApiKey.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira uma chave da API OpenAI',
        variant: 'destructive'
      });
      return;
    }

    try {
      updateApiKey(openaiApiKey);
      toast({
        title: 'Conexão testada',
        description: 'Chave da API OpenAI configurada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro de conexão',
        description: 'Falha ao conectar com a API OpenAI. Verifique sua chave.',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      <p className="text-muted-foreground">Configure as configurações da plataforma e chaves de API.</p>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chaves de API</CardTitle>
            <CardDescription>
              Configure as chaves de API para integração com serviços externos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-key">Chave da API Mapbox</Label>
              <div className="relative">
                <Input 
                  id="mapbox-key"
                  type={showMapboxKey ? "text" : "password"}
                  value={mapboxApiKey}
                  onChange={(e) => setMapboxApiKey(e.target.value)}
                  placeholder="Digite sua chave da API Mapbox"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowMapboxKey(!showMapboxKey)}
                >
                  {showMapboxKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Necessário para a visualização do mapa
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="openai-key">Chave da API OpenAI</Label>
                <div className="flex items-center gap-2">
                  {isReady ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Desconectado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative">
                <Input 
                  id="openai-key"
                  type={showOpenAIKey ? "text" : "password"}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="Digite sua chave da API OpenAI"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                >
                  {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={testOpenAIConnection}
                  disabled={!openaiApiKey.trim()}
                >
                  Testar Conexão
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Necessário para funcionalidades de IA, otimização de rotas e insights
              </p>
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings}>Salvar Chaves de API</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configure as configurações gerais da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notificações</Label>
                <p className="text-xs text-muted-foreground">
                  Ativar notificações para atualizações de entrega
                </p>
              </div>
              <Switch 
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-refresh">Atualização automática</Label>
                <p className="text-xs text-muted-foreground">
                  Atualizar dados automaticamente a cada 5 minutos
                </p>
              </div>
              <Switch 
                id="auto-refresh"
                checked={autoRefreshEnabled}
                onCheckedChange={setAutoRefreshEnabled}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={saveSettings}>Salvar Configurações</Button>
          </CardFooter>
        </Card>

        {/* AI Features Information */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades de IA</CardTitle>
            <CardDescription>
              Recursos disponíveis com a integração OpenAI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🗺️ Otimização de Rotas</h4>
                <p className="text-sm text-muted-foreground">
                  AI analisa entregas e sugere a rota mais eficiente
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📊 Insights de Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Análise inteligente de métricas e recomendações
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">💬 Assistente Virtual</h4>
                <p className="text-sm text-muted-foreground">
                  Chat com IA especializada em logística
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📈 Relatórios Automáticos</h4>
                <p className="text-sm text-muted-foreground">
                  Geração automática de relatórios detalhados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Dados Mock</CardTitle>
            <CardDescription>
              Opções para regenerar e limpar os dados mock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🔄 Regenerar Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Regenerar os dados mock para simular novas entregas
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🗑️ Limpar Dados</h4>
                <p className="text-sm text-muted-foreground">
                  Limpar todos os dados mock da plataforma
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  dataService.regenerateMockData();
                  toast({
                    title: 'Dados regenerados',
                    description: 'Os dados mock foram regenerados com sucesso. Recarregue a página para ver as mudanças.',
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerar Dados
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => {
                  dataService.clearData();
                  toast({
                    title: 'Dados limpos',
                    description: 'Todos os dados foram removidos. Recarregue a página para ver as mudanças.',
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
