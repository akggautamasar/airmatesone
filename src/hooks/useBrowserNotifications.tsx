
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      console.log('Browser notification permission on mount:', Notification.permission);
    } else {
      console.log('Browser notifications not supported');
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
    console.log('=== Browser Notification Debug ===');
    console.log('Attempting to send browser notification:', { 
      title, 
      message, 
      permission: Notification.permission,
      statePermission: permission,
      isSupported: 'Notification' in window,
      user: user?.email
    });
    
    if (!('Notification' in window)) {
      console.log('❌ Browser notifications not supported');
      return;
    }

    const currentPermission = Notification.permission;
    console.log('Current permission status:', currentPermission);
    
    if (currentPermission !== 'granted') {
      console.log('❌ Permission not granted. Current permission:', currentPermission);
      return;
    }

    console.log('✅ Permission granted, creating notification...');
    
    try {
      const notification = new Notification(title, {
        body: message,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'expense-notification',
        requireInteraction: false,
        silent: false
      });
      
      console.log('✅ Browser notification created successfully:', notification);
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        console.log('Auto-closing notification');
        notification.close();
      }, 5000);
      
      // Handle notification click
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
      };

      notification.onerror = (error) => {
        console.error('❌ Notification error:', error);
      };

      notification.onshow = () => {
        console.log('✅ Notification shown successfully');
      };

    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  };

  return {
    permission,
    requestPermission,
    sendBrowserNotification,
    isSupported: 'Notification' in window,
  };
};
