
import React, { useEffect } from 'react';
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
    <div className="flex items-center gap-2">
      {permission === 'default' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEnableNotifications}
          className="text-xs"
        >
          <Bell className="h-4 w-4 mr-1" />
          Enable Browser Notifications
        </Button>
      )}
      {permission === 'denied' && (
        <div className="flex items-center text-xs text-gray-500">
          <BellOff className="h-4 w-4 mr-1" />
          Browser notifications disabled
        </div>
      )}
      {permission === 'granted' && (
        <div className="flex items-center text-xs text-green-600">
          <Bell className="h-4 w-4 mr-1" />
          Browser notifications enabled
        </div>
      )}
    </div>
  );
};
