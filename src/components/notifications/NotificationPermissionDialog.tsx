import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell } from "lucide-react";
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useAuth } from '@/hooks/useAuth';

export const NotificationPermissionDialog = () => {
  const [open, setOpen] = useState(false);
  const { permission, requestPermission, isSupported } = useBrowserNotifications();
  const { user } = useAuth();

  useEffect(() => {
    // Show dialog after a short delay when user logs in and permission is default
    if (isSupported && user && permission === 'default') {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, permission, isSupported]);

  const handleAllow = async () => {
    await requestPermission();
    setOpen(false);
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  if (!isSupported || permission !== 'default') {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
          </div>
          <AlertDialogTitle>Stay Updated with Notifications</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Get instant alerts for new expenses, settlements, and important updates from your roommates. 
            You'll receive notifications even when you're not using the app.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>Not Now</AlertDialogCancel>
          <AlertDialogAction onClick={handleAllow}>
            Allow Notifications
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
