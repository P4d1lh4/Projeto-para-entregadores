
import React from 'react';
import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsTrigger } from '@/components/ui/tabs';

type EmptyStateProps = {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No delivery records found',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <FileX className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
      <div className="text-base text-muted-foreground mb-2 font-medium">{message}</div>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
        Use the Upload tab to import delivery data from Excel files.
      </p>
      
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      ) : (
        <Tabs.Root defaultValue={""}>
          <TabsTrigger value="upload" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90">
            Go to Upload
          </TabsTrigger>
        </Tabs.Root>
      )}
    </div>
  );
};

export default EmptyState;
