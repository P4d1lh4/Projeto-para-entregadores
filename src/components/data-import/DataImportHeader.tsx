
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

type DataImportHeaderProps = {
  isLoading: boolean;
  onRefresh: () => void;
};

const DataImportHeader: React.FC<DataImportHeaderProps> = ({ isLoading, onRefresh }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Data Import</h1>
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};

export default DataImportHeader;
