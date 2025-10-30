
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);
  const { user } = useAuth();

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShouldShowPrompt(false);
      return result;
    }
    return Notification.permission;
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // Show prompt to request permission after short delay
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => {
          setShouldShowPrompt(true);
          requestPermission();
        }, 1500); // Delay to avoid overwhelming user
        
        return () => clearTimeout(timer);
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
    shouldShowPrompt,
  };
};
