
import React from 'react';
import { Progress } from '@/components/ui/progress';

type UploadProgressProps = {
  progress: number;
};

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => {
  if (progress <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default UploadProgress;
