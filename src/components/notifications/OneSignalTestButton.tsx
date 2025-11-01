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
          description: "OneSignal SDK is not initialized yet. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      // Check if push is supported
      const isPushSupported = await window.OneSignal.Notifications.isPushSupported();
      console.log('Push supported:', isPushSupported);
      
      if (!isPushSupported) {
        toast({
          title: "Push Not Supported",
          description: "Your browser doesn't support push notifications.",
          variant: "destructive",
        });
        return;
      }

      // Check permission
      const permission = await window.OneSignal.Notifications.permissionNative;
      console.log('Current permission:', permission);

      if (permission !== 'granted') {
        toast({
          title: "Permission Not Granted",
          description: "Please enable notifications first using the prompt.",
          variant: "destructive",
        });
        await window.OneSignal.Slidedown.promptPush();
        return;
      }

      // Check subscription
      const userId = await window.OneSignal.User.PushSubscription.id;
      const token = await window.OneSignal.User.PushSubscription.token;
      console.log('OneSignal User ID:', userId);
      console.log('OneSignal Token:', token);

      if (!userId || !token) {
        toast({
          title: "Not Subscribed",
          description: "You're not subscribed to push notifications yet.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Notifications Enabled!",
        description: `You're subscribed! User ID: ${userId?.substring(0, 8)}...`,
      });

      // Send a test notification via OneSignal's client API
      console.log('Ready to receive notifications');
      
    } catch (error: any) {
      console.error('OneSignal check error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check OneSignal status",
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
