
import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="text-muted-foreground mb-2">No delivery records found</div>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Use the Upload tab to import delivery data from Excel files.
      </p>
    </div>
  );
};

export default EmptyState;
