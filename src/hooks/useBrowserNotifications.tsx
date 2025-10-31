
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  };

  const sendBrowserNotification = (title: string, message: string, icon?: string) => {
    if (!('Notification' in window)) {
      return;
    }

    const currentPermission = Notification.permission;
    
    if (currentPermission !== 'granted') {
      return;
    }
    
    try {
      const notification = new Notification(title, {
        body: message,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'expense-notification',
        requireInteraction: false,
        silent: false
      });
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  return {
    permission,
    requestPermission,
    sendBrowserNotification,
    isSupported: 'Notification' in window,
  };
};
