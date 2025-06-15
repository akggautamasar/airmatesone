
import { supabase } from '@/integrations/supabase/client';
import type { ShoppingList } from '@/types/shopping';

export const shoppingListService = {
  async fetchShoppingLists(): Promise<ShoppingList[]> {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getOrCreateTodaysList(userId: string): Promise<ShoppingList | null> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // Try to get today's list
      let { data: existingList, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no list exists, create one
      if (!existingList) {
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            date: today,
            created_by: userId
          })
          .select()
          .single();

        if (createError) throw createError;
        existingList = newList;
      }

      return existingList;
    } catch (error: any) {
      console.error('Error getting/creating shopping list:', error);
      throw error;
    }
  },

  async sendMarketNotification(listId: string): Promise<void> {
    const { error } = await supabase.rpc('send_market_notification', {
      shopping_list_id_param: listId
    });

    if (error) throw error;
  }
};
