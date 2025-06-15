
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { shoppingListService } from '@/services/shoppingListService';
import { shoppingListItemsService } from '@/services/shoppingListItemsService';
import type { ShoppingList, ShoppingListItem, AddItemData } from '@/types/shopping';

export const useShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchShoppingLists = async () => {
    if (!user) return;

    try {
      const data = await shoppingListService.fetchShoppingLists();
      setShoppingLists(data);
    } catch (error: any) {
      console.error('Error fetching shopping lists:', error);
    }
  };

  const fetchListItems = async (listId: string) => {
    try {
      const data = await shoppingListItemsService.fetchListItems(listId);
      setItems(data);
    } catch (error: any) {
      console.error('Error fetching list items:', error);
    }
  };

  const getOrCreateTodaysList = async () => {
    if (!user) return null;

    try {
      const list = await shoppingListService.getOrCreateTodaysList(user.id);
      if (list) {
        setCurrentList(list);
        await fetchListItems(list.id);
      }
      return list;
    } catch (error: any) {
      console.error('Error getting/creating shopping list:', error);
      toast({
        title: "Error",
        description: "Failed to load shopping list",
        variant: "destructive",
      });
      return null;
    }
  };

  const addItem = async (itemData: AddItemData) => {
    if (!user || !currentList) return;

    try {
      const newItem = await shoppingListItemsService.addItem(currentList.id, user.id, itemData);
      setItems(prev => [...prev, newItem]);
      toast({
        title: "Success",
        description: "Item added to shopping list",
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const markAsPurchased = async (itemId: string) => {
    if (!user) return;

    try {
      const updatedItem = await shoppingListItemsService.markAsPurchased(itemId, user.id);
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      toast({
        title: "Success",
        description: "Item marked as purchased",
      });
    } catch (error: any) {
      console.error('Error marking as purchased:', error);
      toast({
        title: "Error",
        description: "Failed to mark as purchased",
        variant: "destructive",
      });
    }
  };

  const sendMarketNotification = async () => {
    if (!currentList) return;

    try {
      await shoppingListService.sendMarketNotification(currentList.id);
      setCurrentList(prev => prev ? { ...prev, is_market_notification_sent: true } : null);
      toast({
        title: "Success",
        description: "Market notification sent to all roommates",
      });
    } catch (error: any) {
      console.error('Error sending market notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchShoppingLists();
      getOrCreateTodaysList();
    }
  }, [user]);

  return {
    shoppingLists,
    currentList,
    items,
    loading,
    getOrCreateTodaysList,
    addItem,
    markAsPurchased,
    sendMarketNotification,
    refetch: fetchShoppingLists
  };
};
