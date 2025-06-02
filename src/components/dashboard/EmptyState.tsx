import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, BarChart3 } from 'lucide-react';

const EmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            Upload your delivery data to start analyzing performance metrics and visualizing routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate('/data-import')}
            className="w-full"
            size="lg"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Data File
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Supported formats: Excel (.xlsx, .xls)
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                Analytics
              </div>
              <div className="flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                Reports
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptyState; 