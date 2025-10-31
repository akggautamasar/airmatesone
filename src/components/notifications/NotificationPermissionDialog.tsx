import { useEffect, useState } from 'react';
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
  const [showDialog, setShowDialog] = useState(false);
  const { permission, requestPermission, isSupported } = useBrowserNotifications();
  const { user } = useAuth();

  useEffect(() => {
    // Show dialog after 2 seconds if user is logged in and permission is default
    if (user && isSupported && permission === 'default') {
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, permission, isSupported]);

  const handleAllow = async () => {
    await requestPermission();
    setShowDialog(false);
  };

  const handleNotNow = () => {
    setShowDialog(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-6 w-6 text-primary" />
            <AlertDialogTitle>Enable Notifications</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Stay updated with expense notifications even when you're not using the app. 
            We'll notify you when new expenses are added or when someone needs to settle up.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleNotNow}>Not Now</AlertDialogCancel>
          <AlertDialogAction onClick={handleAllow}>Allow Notifications</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
