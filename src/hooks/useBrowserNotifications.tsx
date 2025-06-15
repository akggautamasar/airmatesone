
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      console.log('Browser notification permission:', Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      console.log('Requesting notification permission...');
      const result = await Notification.requestPermission();
      console.log('Permission result:', result);
      setPermission(result);
      return result;
    }
    return Notification.permission;
  };

  const sendBrowserNotification = (title: string, message: string, icon?: string) => {
    console.log('Attempting to send browser notification:', { title, message, permission, isSupported: 'Notification' in window });
    
    if (permission === 'granted' && 'Notification' in window) {
      console.log('Sending browser notification - tab visibility:', document.visibilityState);
      
      // Always send notification regardless of tab visibility
      try {
        const notification = new Notification(title, {
          body: message,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'expense-notification', // This will replace previous notifications
        });
        
        console.log('Browser notification sent successfully');
        
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
        console.error('Error sending browser notification:', error);
      }
    } else {
      console.log('Cannot send notification - permission not granted or not supported');
    }
  };

  return {
    permission,
    requestPermission,
    sendBrowserNotification,
    isSupported: 'Notification' in window,
  };
};
