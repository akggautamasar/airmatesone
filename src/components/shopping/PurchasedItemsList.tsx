
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import type { ShoppingListItem } from "@/types/shopping";

interface PurchasedItemsListProps {
  items: ShoppingListItem[];
}

export const PurchasedItemsList = ({ items }: PurchasedItemsListProps) => {
  const purchasedItems = items.filter(item => item.is_purchased);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Check className="h-5 w-5 text-green-600" />
          <span>Purchased Items ({purchasedItems.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {purchasedItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="font-medium line-through text-muted-foreground">
                {item.product?.name || item.custom_product_name} ({item.quantity})
              </p>
              <p className="text-xs text-green-600">
                Added by {item.added_by_profile?.name} • Purchased by {item.purchased_by_profile?.name}
              </p>
            </div>
          </div>
        ))}

        {purchasedItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items purchased yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};
