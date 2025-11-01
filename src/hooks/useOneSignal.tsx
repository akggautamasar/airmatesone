import { useEffect, useState } from 'react';

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export const useOneSignal = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        setIsInitialized(true);
        
        // Check subscription status
        const isPushSupported = await OneSignal.Notifications.isPushSupported();
        if (isPushSupported) {
          const permission = await OneSignal.Notifications.permissionNative;
          setIsSubscribed(permission === 'granted');
        }
      });
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        await window.OneSignal.Slidedown.promptPush();
        const permission = await window.OneSignal.Notifications.permissionNative;
        setIsSubscribed(permission === 'granted');
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting OneSignal permission:', error);
        return false;
      }
    }
    return false;
  };

  const sendNotification = async (title: string, message: string) => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        // This would typically be done from your backend
        // For client-side, we can only show local notifications
        // Backend API calls would be needed for sending to all users
        console.log('OneSignal notification:', { title, message });
      } catch (error) {
        console.error('Error sending OneSignal notification:', error);
      }
    }
  };

  return {
    isInitialized,
    isSubscribed,
    requestPermission,
    sendNotification,
  };
};
