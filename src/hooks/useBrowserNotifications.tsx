
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Auto-request permission if not set (like other websites)
      if (Notification.permission === 'default' && user) {
        requestPermission();
      }
    }
  }, [user, requestPermission]);

  const sendBrowserNotification = (title: string, message: string, icon?: string) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission !== 'granted') return;
    
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
      setTimeout(() => notification.close(), 5000);
      
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  return {
    permission,
    requestPermission,
    sendBrowserNotification,
    isSupported: 'Notification' in window,
  };
};
