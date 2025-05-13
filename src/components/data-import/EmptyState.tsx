
import React from 'react';
import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
  const handleGoToUpload = () => {
    // Since we can't directly control the Tabs component from here,
    // we'll use a Button that looks like the Tabs.Trigger
    document.querySelector('[value="upload"]')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true })
    );
  };
  
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
        <Button 
          onClick={handleGoToUpload}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Go to Upload
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
