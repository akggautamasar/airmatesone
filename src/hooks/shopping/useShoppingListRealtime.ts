
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ShoppingList } from '@/types/shopping';

interface UseShoppingListRealtimeProps {
  currentList: ShoppingList | null;
  onItemsUpdate: (listId: string) => Promise<void>;
  onListUpdate: (list: ShoppingList) => void;
}

export const useShoppingListRealtime = ({
  currentList,
  onItemsUpdate,
  onListUpdate
}: UseShoppingListRealtimeProps) => {
  useEffect(() => {
    if (!currentList?.id) return;

    console.log('Setting up real-time subscription for list:', currentList.id);

    const channel = supabase
      .channel('shopping-list-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items'
        },
        async (payload) => {
          console.log('Real-time shopping list items update received:', payload);
          
          // Check if this update is for our current list
          const payloadData = payload.new || payload.old;
          if (payloadData && typeof payloadData === 'object' && 'shopping_list_id' in payloadData) {
            if (payloadData.shopping_list_id === currentList.id) {
              console.log('Update is for our current list, refreshing items');
              try {
                await onItemsUpdate(currentList.id);
              } catch (error) {
                console.error('Error refreshing items after real-time update:', error);
              }
            }
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
          
          // Refresh the current list data if it's our list
          const payloadData = payload.new || payload.old;
          if (payloadData && typeof payloadData === 'object' && 'id' in payloadData) {
            if (payloadData.id === currentList.id) {
              console.log('Update is for our current list, refreshing list data');
              if (payload.new) {
                onListUpdate(payload.new as ShoppingList);
              }
            }
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
  }, [currentList?.id, onItemsUpdate, onListUpdate]);
};
