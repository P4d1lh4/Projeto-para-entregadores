
import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChartBar, Map, Package, Settings, Truck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = {
  isOpen: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const navItems = [
    { name: 'Dashboard', icon: ChartBar, path: '/' },
    { name: 'Map View', icon: Map, path: '/map' },
    { name: 'Drivers', icon: Truck, path: '/drivers' },
    { name: 'Deliveries', icon: Package, path: '/deliveries' },
    { name: 'Customers', icon: Users, path: '/customers' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div
      className={cn(
        "bg-sidebar fixed inset-y-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <div className="flex items-center space-x-2 px-4">
          <div className="h-8 w-8 rounded bg-fox-orange flex items-center justify-center">
            <span className="font-bold text-white">F</span>
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">Fox Delivery</h1>
        </div>
      </div>
      <nav className="mt-6 px-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-3 text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors',
                    isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="rounded-md bg-sidebar-accent p-4 text-sidebar-foreground">
          <h3 className="text-sm font-semibold">Fox Delivery</h3>
          <p className="mt-1 text-xs">Analytics Platform v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
