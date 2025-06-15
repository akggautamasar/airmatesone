
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

  // Memoized callbacks for real-time updates to maintain data persistence
  const handleItemsUpdate = useCallback(async (listId: string) => {
    console.log('Real-time update: refreshing items for shared list:', listId);
    await fetchListItems(listId);
  }, [fetchListItems]);

  const handleListUpdate = useCallback((list: any) => {
    console.log('Real-time update: refreshing shared list data:', list);
    setCurrentList(list);
  }, [setCurrentList]);

  // Set up real-time subscription for shared shopping list
  useShoppingListRealtime({
    currentList,
    onItemsUpdate: handleItemsUpdate,
    onListUpdate: handleListUpdate
  });

  const addItem = async (itemData: AddItemData) => {
    if (!currentList) {
      console.error('No current shared shopping list available');
      return;
    }
    console.log('Adding item to shared shopping list:', currentList.id);
    await addItemToList(currentList.id, itemData);
  };

  // Initialize shared shopping list data when user is available
  useEffect(() => {
    const initializeSharedShoppingData = async () => {
      if (user) {
        console.log('User authenticated, initializing shared shopping lists for user:', user.id);
        setLoading(true);
        try {
          await fetchShoppingLists();
          const sharedList = await getOrCreateTodaysList();
          if (sharedList) {
            console.log('Loading items for shared list:', sharedList.id);
            await fetchListItems(sharedList.id);
          }
        } catch (error) {
          console.error('Error initializing shared shopping data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initializeSharedShoppingData();
  }, [user, fetchShoppingLists, getOrCreateTodaysList, fetchListItems]);

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
