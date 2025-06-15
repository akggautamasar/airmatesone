
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
    if (permission === 'granted' && 'Notification' in window) {
      // Check if the page is visible to avoid showing notifications when user is actively using the app
      if (document.visibilityState === 'hidden') {
        new Notification(title, {
          body: message,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'expense-notification', // This will replace previous notifications
        });
      }
    }
  };

  return {
    permission,
    requestPermission,
    sendBrowserNotification,
    isSupported: 'Notification' in window,
  };
};
