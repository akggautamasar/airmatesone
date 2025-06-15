
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ShoppingList } from '@/types/shopping';

interface UseShoppingListRealtimeProps {
  currentList: ShoppingList | null;
  onItemsUpdate: (listId: string) => void;
  onListUpdate: (list: any) => void;
}

export const useShoppingListRealtime = ({
  currentList,
  onItemsUpdate,
  onListUpdate
}: UseShoppingListRealtimeProps) => {
  useEffect(() => {
    if (!currentList?.id) return;

    console.log('Setting up real-time subscription for shopping list:', currentList.id);

    // Subscribe to shopping list items changes
    const itemsChannel = supabase
      .channel(`shopping_list_items_${currentList.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list_items',
          filter: `shopping_list_id=eq.${currentList.id}`
        },
        (payload) => {
          console.log('Real-time shopping list items change:', payload);
          onItemsUpdate(currentList.id);
        }
      )
      .subscribe();

    // Subscribe to shopping list changes
    const listChannel = supabase
      .channel(`shopping_list_${currentList.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopping_lists',
          filter: `id=eq.${currentList.id}`
        },
        (payload) => {
          console.log('Real-time shopping list change:', payload);
          if (payload.new) {
            onListUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(listChannel);
    };
  }, [currentList?.id, onItemsUpdate, onListUpdate]);
};
