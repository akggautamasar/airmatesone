
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, ExternalLink, Clock } from "lucide-react";
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    expense_id: string | null;
    settlement_id: string | null;
    is_read: boolean;
    created_at: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead, onDelete }: NotificationItemProps) => {
  const getPayNowUrl = (message: string) => {
    // Extract UPI ID and amount from the message for Pay Now button
    const upiMatch = message.match(/to ([^.]+) for/);
    const amountMatch = message.match(/₹(\d+(?:\.\d{2})?)/);
    
    if (upiMatch && amountMatch) {
      const payerName = upiMatch[1];
      const amount = amountMatch[1];
      // For now, we'll use a placeholder UPI ID - this should be retrieved from the payer's profile
      return `https://quantxpay.vercel.app/placeholder-upi-id/${amount}`;
    }
    return null;
  };

  const isReminderNotification = notification.type === 'reminder';
  const payNowUrl = isReminderNotification ? getPayNowUrl(notification.message) : null;

  return (
    <div className={`p-4 border rounded-lg ${notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            {!notification.is_read && (
              <Badge variant="default" className="text-xs px-1.5 py-0.5">New</Badge>
            )}
            {isReminderNotification && (
              <Clock className="h-4 w-4 text-orange-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            <div className="flex gap-1">
              {payNowUrl && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(payNowUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Pay Now
                </Button>
              )}
              {!notification.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark Read
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                onClick={() => onDelete(notification.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationPanel = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationsContext();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications yet</p>
            <p className="text-sm">You'll see expense notifications here</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
