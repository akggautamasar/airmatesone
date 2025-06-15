
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Send } from "lucide-react";
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
  const today = new Date().toLocaleDateString();
  const pendingItems = items.filter(item => !item.is_purchased);
  const purchasedItems = items.filter(item => item.is_purchased);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Shopping List for {today}</span>
            </CardTitle>
            <CardDescription>
              {pendingItems.length} items pending • {purchasedItems.length} purchased
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={onOpenAddDialog}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            {currentList && !currentList.is_market_notification_sent && (
              <Button
                onClick={onSendMarketNotification}
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <Send className="h-4 w-4 mr-2" />
                I'm Going to Market
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
