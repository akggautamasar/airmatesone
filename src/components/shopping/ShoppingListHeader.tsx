
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Send } from "lucide-react";
import type { ShoppingList, ShoppingListItem } from "@/types/shopping";

interface ShoppingListHeaderProps {
  currentList: ShoppingList | null;
  items: ShoppingListItem[];
  onSendMarketNotification: () => Promise<void>;
  onOpenAddDialog: () => void;
}

export const ShoppingListHeader = ({
  currentList,
  items,
  onSendMarketNotification,
  onOpenAddDialog
}: ShoppingListHeaderProps) => {
  const pendingItems = items.filter(item => !item.is_purchased);
  const purchasedItems = items.filter(item => item.is_purchased);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!currentList) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No shopping list available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Shopping List - {formatDate(currentList.date)}</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              onClick={onSendMarketNotification}
              variant="outline"
              disabled={currentList.is_market_notification_sent || pendingItems.length === 0}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>
                {currentList.is_market_notification_sent ? 'Notification Sent' : 'Going to Market'}
              </span>
            </Button>
            <Button
              onClick={onOpenAddDialog}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Pending: {pendingItems.length} items</span>
          <span>Purchased: {purchasedItems.length} items</span>
        </div>
      </CardContent>
    </Card>
  );
};
