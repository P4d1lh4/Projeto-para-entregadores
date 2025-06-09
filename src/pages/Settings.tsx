
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
      title: 'Settings Saved',
      description: 'Your settings have been saved successfully',
      variant: 'default',
    });
  };

  const testOpenAIConnection = async () => {
    if (!openaiApiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an OpenAI API key',
        variant: 'destructive'
      });
      return;
    }

    try {
      updateApiKey(openaiApiKey);
      toast({
        title: 'Connection tested',
        description: 'OpenAI API key configured successfully',
      });
    } catch (error) {
      toast({
        title: 'Connection error',
        description: 'Failed to connect to OpenAI API. Check your key.',
        variant: 'destructive'
      });
    }
  };
  
  const regenerateData = () => {
    toast({
      title: 'Data regenerated',
      description: 'Mock data has been successfully regenerated. Reload the page to see the changes.',
    });
  };

  const clearData = () => {
    toast({
      title: 'Data cleared',
      description: 'All data has been removed. Reload the page to see the changes.',
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure platform settings and API keys.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Configure API keys for integration with external services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-key">Mapbox API Key</Label>
              <div className="relative">
                <Input 
                  id="mapbox-key"
                  type={showMapboxKey ? "text" : "password"}
                  value={mapboxApiKey}
                  onChange={(e) => setMapboxApiKey(e.target.value)}
                  placeholder="Enter your Mapbox API key"
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
                Required for map visualization
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex items-center gap-2">
                  {isReady ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Disconnected
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
                  placeholder="Enter your OpenAI API key"
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
                  Test Connection
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required for AI functionality, route optimization and insights
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
            <Button onClick={saveSettings}>Save API Keys</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Configure general platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Enable notifications for delivery updates
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
                <Label htmlFor="auto-refresh">Auto refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically update data every 5 minutes
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
            <Button onClick={saveSettings}>Save Settings</Button>
          </CardFooter>
        </Card>

        {/* AI Features Information */}
        <Card>
          <CardHeader>
            <CardTitle>AI Features</CardTitle>
            <CardDescription>
              Available resources with OpenAI integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🗺️ Route Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  AI analyzes deliveries and suggests the most efficient route
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📊 Performance Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Intelligent analysis of metrics and recommendations
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">💬 Virtual Assistant</h4>
                <p className="text-sm text-muted-foreground">
                  Chat with AI specialized in logistics
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">📈 Automated Reports</h4>
                <p className="text-sm text-muted-foreground">
                  Automatic generation of detailed reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mock Data Management</CardTitle>
            <CardDescription>
              Options to regenerate and clear mock data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🔄 Regenerate Data</h4>
                <p className="text-sm text-muted-foreground">
                  Regenerate mock data to simulate new deliveries
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🗑️ Clear Data</h4>
                <p className="text-sm text-muted-foreground">
                  Clear all mock data from the platform
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
                    title: 'Data regenerated',
                    description: 'Mock data has been successfully regenerated. Reload the page to see the changes.',
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Data
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => {
                  dataService.clearAllData();
                  toast({
                    title: 'Data cleared',
                    description: 'All data has been removed. Reload the page to see the changes.',
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
