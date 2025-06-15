
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { shoppingListService } from '@/services/shoppingListService';
import type { ShoppingList } from '@/types/shopping';

export const useShoppingListData = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchShoppingLists = async () => {
    if (!user) {
      console.log('No user available for fetching shopping lists');
      return;
    }

    try {
      console.log('Fetching shopping lists for user:', user.id);
      const data = await shoppingListService.fetchShoppingLists();
      console.log('Shopping lists fetched:', data);
      setShoppingLists(data);
    } catch (error: any) {
      console.error('Error fetching shopping lists:', error);
      // Don't show toast for network errors during initial load
      if (error.message !== 'TypeError: Failed to fetch') {
        toast({
          title: "Error",
          description: "Failed to load shopping lists",
          variant: "destructive",
        });
      }
    }
  };

  const getOrCreateTodaysList = async () => {
    if (!user) {
      console.log('No user available for getting/creating today\'s list');
      return null;
    }

    try {
      console.log('Getting or creating today\'s list for user:', user.id);
      const list = await shoppingListService.getOrCreateTodaysList(user.id);
      if (list) {
        console.log('Current list set:', list);
        setCurrentList(list);
      }
      return list;
    } catch (error: any) {
      console.error('Error getting/creating shopping list:', error);
      // Don't show toast for network errors during initial load
      if (error.message !== 'TypeError: Failed to fetch') {
        toast({
          title: "Error",
          description: "Failed to load shopping list",
          variant: "destructive",
        });
      }
      return null;
    }
  };

  const sendMarketNotification = async () => {
    if (!currentList) {
      console.log('No current list available for market notification');
      return;
    }

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

  return {
    shoppingLists,
    currentList,
    setCurrentList,
    fetchShoppingLists,
    getOrCreateTodaysList,
    sendMarketNotification
  };
};
