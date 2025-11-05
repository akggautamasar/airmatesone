import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export const OneSignalPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSubscription = async () => {
      if (typeof window !== 'undefined' && window.OneSignal) {
        try {
          console.log('🔔 Checking OneSignal subscription status...');
          const isPushSupported = await window.OneSignal.Notifications.isPushSupported();
          
          if (!isPushSupported) {
            console.log('⚠️ Push notifications not supported on this browser');
            return;
          }

          const permission = await window.OneSignal.Notifications.permissionNative;
          console.log('Current notification permission:', permission);
          
          const subscribed = permission === 'granted';
          setIsSubscribed(subscribed);

          // Show prompt after 3 seconds if not subscribed
          if (!subscribed) {
            console.log('User not subscribed, will show prompt in 3 seconds');
            const timer = setTimeout(() => {
              setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
          } else {
            console.log('✅ User is already subscribed to notifications');
          }
        } catch (error) {
          console.error('❌ Error checking OneSignal subscription:', error);
        }
      } else {
        console.log('⚠️ OneSignal not available yet');
      }
    };

    // Wait for OneSignal to initialize
    const timer = setTimeout(checkSubscription, 2000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        console.log('🔔 Requesting notification permission...');
        await window.OneSignal.Slidedown.promptPush();
        
        // Wait for permission to be processed
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const permission = await window.OneSignal.Notifications.permissionNative;
        console.log('Permission after prompt:', permission);
        
        if (permission === 'granted') {
          // Try to ensure we're subscribed
          await window.OneSignal.User.PushSubscription.optIn();
          
          console.log('✅ Notifications enabled successfully!');
          setIsSubscribed(true);
          setShowPrompt(false);
        } else {
          console.log('⚠️ Permission not granted');
        }
      } catch (error) {
        console.error('❌ Error enabling OneSignal notifications:', error);
      }
    }
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Enable Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-2"
            onClick={() => setShowPrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Stay updated with expense notifications from your roommates
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button onClick={handleEnable} className="flex-1">
          <Bell className="mr-2 h-4 w-4" />
          Enable
        </Button>
        <Button variant="outline" onClick={() => setShowPrompt(false)}>
          Not Now
        </Button>
      </CardContent>
    </Card>
  );
};
