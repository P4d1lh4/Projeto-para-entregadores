import React from 'react';
import { AlertTriangle, HardDrive, Trash2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { StorageUtils } from '@/utils/storageUtils';

interface StorageWarningProps {
  onClearStorage?: () => void;
  showDetails?: boolean;
}

const StorageWarning: React.FC<StorageWarningProps> = ({ 
  onClearStorage,
  showDetails = true 
}) => {
  const [storageSize, setStorageSize] = React.useState(0);
  const [isClearing, setIsClearing] = React.useState(false);
  const maxSize = 50 * 1024 * 1024; // 50MB

  React.useEffect(() => {
    const updateStorageSize = () => {
      const size = StorageUtils.getStorageSize();
      setStorageSize(size);
    };

    updateStorageSize();
    const interval = setInterval(updateStorageSize, 2000);
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
  const isNearLimit = usagePercentage > 80;
  const isAtLimit = usagePercentage > 95;

  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      // Clear storage
      StorageUtils.removeLargeItem('foxDeliveryData');
      StorageUtils.removeLargeItem('foxDriverData');
      StorageUtils.removeLargeItem('foxCustomerData');
      StorageUtils.removeLargeItem('foxOriginalData');
      
      // Update size
      setTimeout(() => {
        const newSize = StorageUtils.getStorageSize();
        setStorageSize(newSize);
        setIsClearing(false);
        
        // Notify parent component
        if (onClearStorage) {
          onClearStorage();
        }
      }, 1000);
    } catch (error) {
      console.error('Error clearing storage:', error);
      setIsClearing(false);
    }
  };

  if (!isNearLimit && !showDetails) {
    return null;
  }

  return (
    <Alert className={`mb-4 ${isAtLimit ? 'border-red-500 bg-red-50' : isNearLimit ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}`}>
      <div className="flex items-start space-x-2">
        {isAtLimit ? (
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : isNearLimit ? (
          <HardDrive className="h-5 w-5 text-yellow-600 mt-0.5" />
        ) : (
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle className={isAtLimit ? 'text-red-800' : isNearLimit ? 'text-yellow-800' : 'text-blue-800'}>
            {isAtLimit ? 'Storage Full' : isNearLimit ? 'Low Storage Space' : 'Storage Information'}
          </AlertTitle>
          <AlertDescription className={`mt-2 ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-yellow-700' : 'text-blue-700'}`}>
            {isAtLimit && (
              <div className="space-y-2">
                <p>
                  <strong>Local storage is full ({formatBytes(storageSize)} / {formatBytes(maxSize)}).</strong>
                </p>
                <p>
                  To load new files, you need to clear some existing data. 
                  Data will continue working in the current session, but won't be saved permanently.
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    onClick={handleClearStorage}
                    disabled={isClearing}
                    variant="destructive"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isClearing ? 'Clearing...' : 'Clear Data'}</span>
                  </Button>
                  <span className="text-sm text-gray-600">
                    This will remove all locally saved data
                  </span>
                </div>
              </div>
            )}
            
            {isNearLimit && !isAtLimit && (
              <div className="space-y-2">
                <p>
                  Current usage: <strong>{formatBytes(storageSize)} / {formatBytes(maxSize)} ({usagePercentage.toFixed(1)}%)</strong>
                </p>
                <p>
                  Storage is almost full. Consider clearing old data to avoid issues.
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    onClick={handleClearStorage}
                    disabled={isClearing}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isClearing ? 'Clearing...' : 'Clear Data'}</span>
                  </Button>
                </div>
              </div>
            )}
            
            {!isNearLimit && showDetails && (
              <div className="space-y-2">
                <p>
                  Current usage: <strong>{formatBytes(storageSize)} / {formatBytes(maxSize)} ({usagePercentage.toFixed(1)}%)</strong>
                </p>
                <p>
                  The system saves your data locally for quick access. 
                  If storage becomes full, new uploads will only work in the current session.
                </p>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

export default StorageWarning; 