import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, socket } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch initial count
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getMyNotifications(1, 1, true);
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifications();

    if (socket) {
      socket.on('new_notification', (notification) => {
        setUnreadCount(prev => prev + 1);
        toast(notification.title + '\n' + notification.message, {
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      });
    }

    return () => {
      if (socket) socket.off('new_notification');
    };
  }, [socket]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1">
        <h2 className="text-lg font-medium text-gray-800">
          Welcome back, {user?.email?.split('@')[0]}
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative rounded-full bg-gray-100 p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <User className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-700 capitalize">{user?.role?.toLowerCase()}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
