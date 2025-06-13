
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2 } from 'lucide-react';

type UploadProgressProps = {
  progress: number;
  currentStage?: string;
  isCompleted?: boolean;
};

const UploadProgress: React.FC<UploadProgressProps> = ({ 
  progress, 
  currentStage = 'Processing...',
  isCompleted = false
}) => {
  if (progress <= 0) return null;

  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (progress >= 90) return 'bg-orange-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStageMessage = () => {
    if (isCompleted) return 'Upload completed successfully!';
    if (progress >= 90) return 'Finalizing processing...';
    return currentStage;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
          <span className="text-sm font-medium">
            {getStageMessage()}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={progress} 
          className="h-2"
        />
        
        {/* Stage indicators */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span className={progress >= 20 ? 'text-blue-600' : ''}>Preparing</span>
          <span className={progress >= 50 ? 'text-blue-600' : ''}>Processing</span>
          <span className={progress >= 80 ? 'text-orange-600' : ''}>Storing</span>
          <span className={progress >= 100 ? 'text-green-600' : ''}>Completed</span>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
