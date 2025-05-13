
import React from 'react';
import { RefreshCcw } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-32">
      <RefreshCcw className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
};

export default LoadingState;
