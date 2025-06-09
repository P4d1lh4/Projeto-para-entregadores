
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, DownloadCloud } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type DataImportHeaderProps = {
  isLoading: boolean;
  onRefresh: () => void;
  onClearData?: () => void;
  recordCount?: number;
  dataQuality?: {
    complete: number;
    incomplete: number;
    totalRecords: number;
  };
};

const DataImportHeader: React.FC<DataImportHeaderProps> = ({
  isLoading,
  onRefresh,
  onClearData,
  recordCount = 0,
  dataQuality
}) => {
  const completionRate = dataQuality && dataQuality.totalRecords > 0 
    ? Math.round((dataQuality.complete / dataQuality.totalRecords) * 100)
    : 0;
  
  const getDataQualityColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-500';
    if (rate >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Import</h1>
        <p className="text-muted-foreground">
          Import and manage your delivery data
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        {recordCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {recordCount} Records
            </Badge>
            
            {dataQuality && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        Quality:
                      </div>
                      <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getDataQualityColor(completionRate)}`} 
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{completionRate}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Complete records: {dataQuality.complete} of {dataQuality.totalRecords}</p>
                    <p>Incomplete records: {dataQuality.incomplete}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            disabled={recordCount === 0}
          >
            <DownloadCloud className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataImportHeader;
