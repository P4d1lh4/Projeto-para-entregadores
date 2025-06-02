import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight,
  PieChart, 
  Truck, 
  Package, 
  Users, 
  Map as MapIcon, 
  Settings, 
  FileUp, 
  BarChart2,
  Activity,
  Bot,
  Globe
} from 'lucide-react';

type SidebarProps = {
  isOpen: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navLinkClasses = "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted w-full";
  const activeNavLinkClasses = "bg-muted font-medium";

  return (
    <aside 
      className={cn(
        "border-r bg-background transition-all duration-300 ease-in-out flex flex-col h-screen",
        isOpen ? "w-64" : "w-[70px]"
      )}
    >
      <div className="p-3 flex items-center justify-between border-b">
        <span className={cn("font-bold text-lg transition-opacity", isOpen ? "opacity-100" : "opacity-0")}>
          Fox Delivery
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <PieChart size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Dashboard
          </span>
        </NavLink>
        
        <NavLink 
          to="/analytics" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <BarChart2 size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Analytics
          </span>
        </NavLink>
        
        <NavLink 
          to="/delivery-analysis" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <Globe size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Geographic Analysis
          </span>
        </NavLink>
        
        <NavLink 
          to="/drivers" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <Truck size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Drivers
          </span>
        </NavLink>
        
        <NavLink 
          to="/deliveries" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <Package size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Deliveries
          </span>
        </NavLink>
        
        <NavLink 
          to="/customers" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <Users size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Customers
          </span>
        </NavLink>
        
        <NavLink 
          to="/ai-assistant" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <Bot size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            AI Assistant
          </span>
        </NavLink>
        
        <NavLink 
          to="/data-import" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <FileUp size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Data Import
          </span>
        </NavLink>
      </nav>
      
      <div className="p-3 border-t">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => cn(navLinkClasses, isActive && activeNavLinkClasses)}
        >
          <Settings size={20} />
          <span className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0", "whitespace-nowrap")}>
            Settings
          </span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
