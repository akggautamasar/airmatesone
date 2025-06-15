import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export const TodayShoppingList = () => {
  // Always set selectedDate to today and keep it updated when the day changes
  const [today, setToday] = useState(() => new Date());

  // At midnight, update today state
  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1).getTime() - now.getTime();
    const timeout = setTimeout(() => setToday(new Date()), msUntilMidnight);
    return () => clearTimeout(timeout);
  }, [today]);

  const { items, loading } = useShoppingListWithFixedDate(today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <span>Today&apos;s Shopping List</span>
        </CardTitle>
        <CardDescription>
          {format(today, "yyyy-MM-dd EEEE")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="py-4 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center">No items in today&apos;s list.</p>
        ) : (
          <ul className="divide-y divide-gray-100 [&>li]:py-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.product?.name || item.custom_product_name}</span>
                  <span className="text-sm text-muted-foreground ml-2">{item.quantity}</span>
                </div>
                {item.is_purchased ? (
                  <span className="text-green-600 text-xs">Purchased</span>
                ) : (
                  <span className="text-orange-600 text-xs">Pending</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="pt-2 text-right">
          <Button asChild variant="link" size="sm">
            <a href="#/shopping">Go to Shopping List</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Custom hook: useShoppingList but for a fixed date, with minimal props
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect, useCallback } from "react";
import { shoppingListService } from "@/services/shoppingListService";
import { ShoppingListItem } from "@/types/shopping";
import { format as formatDate } from "date-fns";

// Returns { items, loading }
function useShoppingListWithFixedDate(date: Date) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dateStr = formatDate(date, "yyyy-MM-dd");
      const currentList = await shoppingListService.getOrCreateShoppingList(dateStr, user.id);
      if (currentList) {
        const listItems = await shoppingListService.getListItems(currentList.id);
        setItems(listItems);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load today's shopping list.", variant: "destructive" });
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, date, toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { items, loading };
}
