
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { useNotifications } from '@/hooks/useNotifications';
import { BrowserNotificationManager } from './BrowserNotificationManager';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

  const getPayNowUrl = (message: string) => {
    const upiMatch = message.match(/to ([^.]+) for/);
    const amountMatch = message.match(/₹(\d+(?:\.\d{2})?)/);
    
    if (upiMatch && amountMatch) {
      const amount = amountMatch[1];
      return `https://quantxpay.vercel.app/placeholder-upi-id/${amount}`;
    }
    return null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark All Read
              </Button>
            )}
          </div>
          <BrowserNotificationManager />
        </div>
        <ScrollArea className="max-h-80">
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => {
                const isReminderNotification = notification.type === 'reminder';
                const payNowUrl = isReminderNotification ? getPayNowUrl(notification.message) : null;
                
                return (
                  <div 
                    key={notification.id} 
                    className={`p-3 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                        {payNowUrl && (
                          <Button
                            size="sm"
                            className="mt-2 h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => window.open(payNowUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Pay Now
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 5 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
