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
        try {
          console.log('🔔 OneSignal hook initializing...');
          setIsInitialized(true);
          
          // Check subscription status
          const isPushSupported = await OneSignal.Notifications.isPushSupported();
          console.log('Push supported:', isPushSupported);
          
          if (isPushSupported) {
            const permission = await OneSignal.Notifications.permissionNative;
            console.log('Current permission:', permission);
            setIsSubscribed(permission === 'granted');
            
            // Listen for permission changes
            OneSignal.Notifications.addEventListener('permissionChange', (isGranted: boolean) => {
              console.log('Permission changed:', isGranted);
              setIsSubscribed(isGranted);
            });
          }
        } catch (error) {
          console.error('❌ Error in OneSignal hook:', error);
        }
      });
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        console.log('🔔 Requesting OneSignal permission...');
        
        // Request notification permission
        await window.OneSignal.Slidedown.promptPush();
        
        // Wait a bit for permission to be granted
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const permission = await window.OneSignal.Notifications.permissionNative;
        console.log('Permission after request:', permission);
        
        const granted = permission === 'granted';
        setIsSubscribed(granted);
        
        if (granted) {
          console.log('✅ OneSignal permission granted!');
        } else {
          console.log('⚠️ OneSignal permission denied');
        }
        
        return granted;
      } catch (error) {
        console.error('❌ Error requesting OneSignal permission:', error);
        return false;
      }
    }
    console.log('⚠️ OneSignal not available');
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
