
import React from 'react';
import { RefreshCcw } from 'lucide-react';

type LoadingStateProps = {
  message?: string;
};

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col justify-center items-center h-32">
      <RefreshCcw className="h-6 w-6 animate-spin text-primary mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default LoadingState;
