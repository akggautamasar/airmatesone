import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export const OneSignalTestButton = () => {
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const checkAndTestNotification = async () => {
    setChecking(true);
    try {
      if (typeof window === 'undefined' || !window.OneSignal) {
        toast({
          title: "OneSignal Not Loaded",
          description: "OneSignal SDK is not initialized yet. Please wait or refresh the page.",
          variant: "destructive",
        });
        setChecking(false);
        return;
      }

      console.log('🔍 Checking OneSignal status...');

      // Check if push is supported
      const isPushSupported = await window.OneSignal.Notifications.isPushSupported();
      console.log('Push supported:', isPushSupported);
      
      if (!isPushSupported) {
        toast({
          title: "Push Not Supported",
          description: "Your browser doesn't support push notifications.",
          variant: "destructive",
        });
        setChecking(false);
        return;
      }

      // Check permission
      const permission = await window.OneSignal.Notifications.permissionNative;
      console.log('Current permission:', permission);

      if (permission !== 'granted') {
        toast({
          title: "Enable Notifications",
          description: "Click 'Allow' in the browser prompt to enable notifications.",
        });
        await window.OneSignal.Slidedown.promptPush();
        setChecking(false);
        return;
      }

      // Check subscription - wait for it to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userId = await window.OneSignal.User.PushSubscription.id;
      const token = await window.OneSignal.User.PushSubscription.token;
      console.log('OneSignal User ID:', userId);
      console.log('OneSignal Token:', token ? 'Present' : 'Missing');

      if (!userId || !token) {
        toast({
          title: "Subscribing...",
          description: "Setting up your notification subscription. This may take a moment.",
        });
        
        // Try to opt in
        await window.OneSignal.User.PushSubscription.optIn();
        
        // Wait and check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newUserId = await window.OneSignal.User.PushSubscription.id;
        
        if (!newUserId) {
          toast({
            title: "Subscription Failed",
            description: "Unable to subscribe to notifications. Please try refreshing the page.",
            variant: "destructive",
          });
          setChecking(false);
          return;
        }
      }

      toast({
        title: "✅ Notifications Active!",
        description: `You're subscribed and will receive expense notifications.`,
      });

      console.log('✅ OneSignal is fully configured and working');
      
    } catch (error: any) {
      console.error('❌ OneSignal check error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check OneSignal status. Try refreshing.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Button
      onClick={checkAndTestNotification}
      disabled={checking}
      variant="outline"
      size="sm"
    >
      <Bell className="mr-2 h-4 w-4" />
      {checking ? 'Checking...' : 'Test Notifications'}
    </Button>
  );
};
