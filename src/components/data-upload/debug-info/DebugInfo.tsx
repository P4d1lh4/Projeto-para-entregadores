
import React from 'react';
import type { FoxDelivery } from '@/types/delivery';

type DebugInfoProps = {
  data: FoxDelivery[];
};

const DebugInfo: React.FC<DebugInfoProps> = ({ data }) => {
  if (data.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-slate-50 border rounded-md">
      <h4 className="text-sm font-medium mb-2">Data Preview Information</h4>
      <p className="text-xs text-muted-foreground">
        The following fields were detected in the Excel file:
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(data[0] || {})
          .filter(([_, value]) => value !== undefined && value !== null && value !== '')
          .map(([key]) => (
            <span 
              key={key} 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs 
              bg-slate-200 text-slate-800 font-medium"
            >
              {key.replace(/_/g, ' ')}
            </span>
          ))}
      </div>
    </div>
  );
};

export default DebugInfo;
