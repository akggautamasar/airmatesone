
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart, Trash2 } from "lucide-react";
import { ShoppingListItem } from '@/types/shopping';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShoppingListDisplayProps {
  items: ShoppingListItem[];
  loading: boolean;
  onMarkPurchased: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ShoppingListDisplay = ({ items, loading, onMarkPurchased, onDeleteItem }: ShoppingListDisplayProps) => {
  const pendingItems = items.filter(item => !item.is_purchased);
  const purchasedItems = items.filter(item => item.is_purchased);
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading shopping list...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-orange-600" />
            <span>Pending Items ({pendingItems.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingItems.length > 0 ? pendingItems.map((item) => (
            <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2 md:space-y-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <span className="font-medium text-sm md:text-base break-words">{item.product?.name || item.custom_product_name}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onDeleteItem(item.id)} 
                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0 ml-2 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Quantity: {item.quantity}
                  {item.product?.category && ` • Category: ${item.product.category}`}
                </p>
                <p className="text-xs text-blue-600 font-medium">
                  Added by {item.added_by_profile?.name || item.added_by_profile?.email || 'Unknown'}
                </p>
              </div>
              <Button 
                size={isMobile ? "sm" : "sm"}
                onClick={() => onMarkPurchased(item.id)} 
                className="bg-green-600 hover:bg-green-700 w-full md:w-auto md:ml-2 text-xs md:text-sm"
              >
                <Check className="h-4 w-4 mr-1" />
                Purchased
              </Button>
            </div>
          )) : <p className="text-center py-8 text-muted-foreground">No pending items.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Check className="h-5 w-5 text-green-600" />
            <span>Purchased Items ({purchasedItems.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {purchasedItems.length > 0 ? purchasedItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="font-medium line-through text-muted-foreground text-sm md:text-base break-words">
                  {item.product?.name || item.custom_product_name} ({item.quantity})
                </p>
                <div className="text-xs space-y-1">
                  <p className="text-blue-600">Added by {item.added_by_profile?.name || item.added_by_profile?.email || 'Unknown'}</p>
                  <p className="text-green-600 font-medium">Purchased by {item.purchased_by_profile?.name || item.purchased_by_profile?.email || 'Unknown'}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onDeleteItem(item.id)} 
                className="text-red-600 hover:text-red-700 h-8 w-8 p-0 flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )) : <p className="text-center py-8 text-muted-foreground">No purchased items.</p>}
        </CardContent>
      </Card>
    </div>
  );
};
