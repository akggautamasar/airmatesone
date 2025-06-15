
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { shoppingListService } from '@/services/shoppingListService';
import { shoppingListItemsService } from '@/services/shoppingListItemsService';
import { supabase } from '@/integrations/supabase/client';
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
      console.log('Fetching shopping lists for user:', user.id);
      const data = await shoppingListService.fetchShoppingLists();
      console.log('Shopping lists fetched:', data);
      setShoppingLists(data);
    } catch (error: any) {
      console.error('Error fetching shopping lists:', error);
    }
  };

  const fetchListItems = async (listId: string) => {
    try {
      console.log('Fetching items for list:', listId);
      const data = await shoppingListItemsService.fetchListItems(listId);
      console.log('Items fetched:', data);
      setItems(data);
    } catch (error: any) {
      console.error('Error fetching list items:', error);
    }
  };

  const getOrCreateTodaysList = async () => {
    if (!user) return null;

    try {
      console.log('Getting or creating today\'s list for user:', user.id);
      const list = await shoppingListService.getOrCreateTodaysList(user.id);
      if (list) {
        console.log('Current list set:', list);
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
      console.log('Adding item:', itemData);
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
      console.log('Marking item as purchased:', itemId);
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

  // Set up real-time subscription for shopping list items with better error handling
  useEffect(() => {
    if (!currentList?.id) return;

    console.log('Setting up real-time subscription for list:', currentList.id);

    // Set up real-time subscription for all shopping list changes
    const channel = supabase
      .channel('shopping-list-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `shopping_list_id=eq.${currentList.id}`
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          
          // Always refetch all items to ensure we have the latest data with profiles
          try {
            await fetchListItems(currentList.id);
          } catch (error) {
            console.error('Error refreshing items after real-time update:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_lists'
        },
        async (payload) => {
          console.log('Shopping list update received:', payload);
          
          // Refresh the current list data
          if (payload.new && payload.new.id === currentList.id) {
            setCurrentList(payload.new as ShoppingList);
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentList?.id]);

  // Initialize data when user is available
  useEffect(() => {
    if (user) {
      console.log('User authenticated, initializing shopping lists');
      fetchShoppingLists();
      getOrCreateTodaysList();
    }
    setLoading(false);
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
