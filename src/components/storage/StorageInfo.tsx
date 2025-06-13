import React, { useEffect, useState } from 'react';
import { StorageUtils } from '@/utils/storageUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, HardDrive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const StorageInfo: React.FC = () => {
  const [storageSize, setStorageSize] = useState(0);
  const [maxSize] = useState(50 * 1024 * 1024); // 50MB (increased from 4MB)
  const [isClearing, setIsClearing] = useState(false);

  const refreshStorageInfo = () => {
    const size = StorageUtils.getStorageSize();
    setStorageSize(size);
  };

  useEffect(() => {
    refreshStorageInfo();
    
    // Refresh every 5 seconds
    const interval = setInterval(refreshStorageInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercentage = (storageSize / maxSize) * 100;

  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      // Clear old data
      StorageUtils.removeLargeItem('foxDeliveryData');
      StorageUtils.removeLargeItem('foxDriverData');
      StorageUtils.removeLargeItem('foxCustomerData');
      StorageUtils.removeLargeItem('foxOriginalData');
      
      // Refresh storage info
      setTimeout(() => {
        refreshStorageInfo();
        setIsClearing(false);
      }, 1000);
    } catch (error) {
      console.error('Error clearing storage:', error);
      setIsClearing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Local Storage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used:</span>
            <span className="font-medium">{formatBytes(storageSize)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Maximum:</span>
            <span className="font-medium">{formatBytes(maxSize)}</span>
          </div>
          
          <Progress 
            value={Math.min(usagePercentage, 100)} 
            className="w-full"
          />
          
          <div className="text-xs text-muted-foreground text-center">
            {usagePercentage.toFixed(1)}% used
          </div>
          
          {usagePercentage > 80 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
              ⚠️ Storage almost full. Consider clearing old data.
            </div>
          )}
          
          {usagePercentage > 95 && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
              🚨 Storage almost at limit. New uploads may fail.
            </div>
          )}
          
          <Button
            onClick={handleClearStorage}
            disabled={isClearing || storageSize === 0}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? 'Clearing...' : 'Clear Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StorageInfo; 