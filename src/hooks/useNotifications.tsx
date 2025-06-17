
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useBrowserNotifications } from './useBrowserNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  expense_id: string | null;
  settlement_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { sendBrowserNotification, permission } = useBrowserNotifications();
  const channelRef = useRef<any>(null);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Clean up existing channel before creating new one
      if (channelRef.current) {
        console.log('Removing existing notifications channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create unique channel name to avoid conflicts
      const channelName = `notifications-${user.id}-${Date.now()}`;
      console.log('Creating notifications channel:', channelName);
      
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            console.log('=== NEW NOTIFICATION RECEIVED ===');
            console.log('Notification:', newNotification);
            console.log('Current user:', user.email);
            console.log('Notification type:', newNotification.type);
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show in-app toast notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });

            // Send browser notification for all expense-related notifications
            console.log('=== BROWSER NOTIFICATION CHECK ===');
            console.log('Notification type:', newNotification.type);
            console.log('Permission status:', permission);
            console.log('sendBrowserNotification function exists:', !!sendBrowserNotification);
            
            if (newNotification.type === 'expense_created') {
              console.log('🔔 Triggering browser notification for expense creation');
              sendBrowserNotification(
                newNotification.title,
                newNotification.message
              );
            } else {
              console.log('ℹ️ Not an expense_created notification, skipping browser notification');
            }
          }
        )
        .subscribe((status) => {
          console.log('Notifications channel subscription status:', status);
        });

      channelRef.current = channel;

      return () => {
        if (channelRef.current) {
          console.log('Cleaning up notifications channel');
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      
      // Clean up channel when user logs out
      if (channelRef.current) {
        console.log('Removing notifications channel on user logout');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  }, [user?.id]); // Only depend on user ID to avoid unnecessary re-subscriptions

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
};
