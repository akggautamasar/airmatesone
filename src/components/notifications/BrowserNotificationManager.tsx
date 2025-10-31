import React from 'react';
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useToast } from '@/hooks/use-toast';

export const BrowserNotificationManager = () => {
  const { permission, requestPermission, isSupported } = useBrowserNotifications();
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast({
        title: "Browser notifications enabled",
        description: "You'll now receive notifications even when the app is not active.",
      });
    } else if (result === 'denied') {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings to receive alerts.",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center">
      {permission === 'default' && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEnableNotifications}
          title="Enable browser notifications"
          className="h-9 w-9"
        >
          <Bell className="h-5 w-5" />
        </Button>
      )}
      {permission === 'denied' && (
        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Browser notifications are blocked. Please enable them in your browser settings."
          className="h-9 w-9 opacity-50"
        >
          <BellOff className="h-5 w-5" />
        </Button>
      )}
      {permission === 'granted' && (
        <Button
          variant="ghost"
          size="icon"
          disabled
          title="Browser notifications are enabled"
          className="h-9 w-9 text-green-600"
        >
          <Bell className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
