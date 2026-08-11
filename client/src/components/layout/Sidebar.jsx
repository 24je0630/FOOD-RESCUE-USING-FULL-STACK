import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListPlus, List, History, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const Sidebar = () => {
  const { logout, user } = useAuth();
  
  // Base links for all, customized by role
  let links = [];
  
  if (user?.role === 'RESTAURANT') {
    links = [
      { name: 'Dashboard', path: '/restaurant', icon: LayoutDashboard },
      { name: 'My Donations', path: '/restaurant/donations', icon: List },
      { name: 'Create Donation', path: '/restaurant/donations/new', icon: ListPlus },
      { name: 'History', path: '/restaurant/history', icon: History },
      { name: 'Settings', path: '/restaurant/settings', icon: Settings },
    ];
  } else if (user?.role === 'NGO') {
    links = [
      { name: 'Dashboard', path: '/ngo', icon: LayoutDashboard },
      { name: 'Discover', path: '/ngo/discover', icon: ListPlus },
      { name: 'My Requests', path: '/ngo/requests', icon: List },
      { name: 'History', path: '/ngo/history', icon: History },
      { name: 'Settings', path: '/ngo/settings', icon: Settings },
    ];
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-xl font-bold text-emerald-600">Food Rescue</span>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                end={link.path === '/restaurant' || link.path === '/ngo'} // strict match for dashboard root
                className={({ isActive }) => cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
