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
          const isPushSupported = await window.OneSignal.Notifications.isPushSupported();
          if (!isPushSupported) return;

          const permission = await window.OneSignal.Notifications.permissionNative;
          const subscribed = permission === 'granted';
          setIsSubscribed(subscribed);

          // Show prompt after 3 seconds if not subscribed
          if (!subscribed) {
            const timer = setTimeout(() => {
              setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error('Error checking OneSignal subscription:', error);
        }
      }
    };

    // Wait for OneSignal to initialize
    const timer = setTimeout(checkSubscription, 1000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleEnable = async () => {
    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        await window.OneSignal.Slidedown.promptPush();
        const permission = await window.OneSignal.Notifications.permissionNative;
        if (permission === 'granted') {
          setIsSubscribed(true);
          setShowPrompt(false);
        }
      } catch (error) {
        console.error('Error enabling OneSignal notifications:', error);
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
