
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Check } from "lucide-react";
import type { ShoppingListItem } from "@/types/shopping";

interface PendingItemsListProps {
  items: ShoppingListItem[];
  onMarkAsPurchased: (itemId: string) => Promise<void>;
}

export const PendingItemsList = ({ items, onMarkAsPurchased }: PendingItemsListProps) => {
  const pendingItems = items.filter(item => !item.is_purchased);
  
  const groupedItems = pendingItems.reduce((acc, item) => {
    const userName = item.added_by_profile?.name || 'Unknown';
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-orange-600" />
          <span>Shopping List ({pendingItems.length} items)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedItems).map(([userName, userItems]) => (
          <div key={userName} className="space-y-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{userName}</span>
            </div>
            <div className="ml-6 space-y-2">
              {userItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <span className="font-medium">
                      {item.product?.name || item.custom_product_name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.quantity})
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onMarkAsPurchased(item.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Purchased
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pendingItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            All items purchased! 🎉
          </div>
        )}
      </CardContent>
    </Card>
  );
};
