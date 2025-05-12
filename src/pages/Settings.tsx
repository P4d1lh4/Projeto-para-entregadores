
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const Settings = () => {
  const [mapboxApiKey, setMapboxApiKey] = useState<string>('');
  const [openaiApiKey, setOpenaiApiKey] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);
  const { toast } = useToast();
  
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
    localStorage.setItem('openaiApiKey', openaiApiKey);
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    localStorage.setItem('autoRefreshEnabled', autoRefreshEnabled.toString());
    
    toast({
      title: 'Settings saved',
      description: 'Your settings have been saved successfully',
    });
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground">Configure platform settings and API keys.</p>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Configure API keys for external services integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-key">Mapbox API Key</Label>
              <Input 
                id="mapbox-key"
                type="password"
                value={mapboxApiKey}
                onChange={(e) => setMapboxApiKey(e.target.value)}
                placeholder="Enter your Mapbox API key"
              />
              <p className="text-xs text-muted-foreground">
                Required for the map visualization
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input 
                id="openai-key"
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
              />
              <p className="text-xs text-muted-foreground">
                Required for AI insights feature
              </p>
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
                <Label htmlFor="auto-refresh">Auto-refresh</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh data every 5 minutes
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
      </div>
    </div>
  );
};

export default Settings;
