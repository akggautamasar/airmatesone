
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useShoppingListData } from './shopping/useShoppingListData';
import { useShoppingListItems } from './shopping/useShoppingListItems';
import { useShoppingListRealtime } from './shopping/useShoppingListRealtime';
import type { AddItemData } from '@/types/shopping';

export const useShoppingLists = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const {
    shoppingLists,
    currentList,
    setCurrentList,
    fetchShoppingLists,
    getOrCreateTodaysList,
    sendMarketNotification
  } = useShoppingListData();

  const {
    items,
    fetchListItems,
    addItem: addItemToList,
    markAsPurchased
  } = useShoppingListItems();

  // Memoized callbacks for real-time updates
  const handleItemsUpdate = useCallback(async (listId: string) => {
    await fetchListItems(listId);
  }, [fetchListItems]);

  const handleListUpdate = useCallback((list: any) => {
    setCurrentList(list);
  }, [setCurrentList]);

  // Set up real-time subscription
  useShoppingListRealtime({
    currentList,
    onItemsUpdate: handleItemsUpdate,
    onListUpdate: handleListUpdate
  });

  const addItem = async (itemData: AddItemData) => {
    if (!currentList) return;
    await addItemToList(currentList.id, itemData);
  };

  // Initialize data when user is available
  useEffect(() => {
    const initializeData = async () => {
      if (user) {
        console.log('User authenticated, initializing shopping lists');
        await fetchShoppingLists();
        const list = await getOrCreateTodaysList();
        if (list) {
          await fetchListItems(list.id);
        }
      }
      setLoading(false);
    };

    initializeData();
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
