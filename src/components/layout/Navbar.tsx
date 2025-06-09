import React from 'react';
import { Menu, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavbarProps = {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  onClearData: () => void;
};

// Helper function to get page title
const getPageTitle = (pathname: string): string => {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/map':
      return 'Map View';
    case '/drivers':
      return 'Drivers';
    case '/deliveries':
      return 'Deliveries';
    case '/customers':
      return 'Companies';
    case '/settings':
      return 'Settings';
    default:
      return 'Fox Delivery';
  }
};

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, sidebarOpen, onClearData }) => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  
  return (
    <header className="bg-white border-b border-border h-16 flex items-center">
      <div className="flex items-center justify-between w-full px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="mr-4 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary">{pageTitle}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClearData}
                  aria-label="Clear all data"
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all data and reset</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-fox-blue flex items-center justify-center text-white">
              <span className="font-medium">FD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
