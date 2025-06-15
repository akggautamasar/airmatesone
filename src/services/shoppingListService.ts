
import { supabase } from '@/integrations/supabase/client';
import type { ShoppingList } from '@/types/shopping';

export const shoppingListService = {
  async fetchShoppingLists(): Promise<ShoppingList[]> {
    console.log('Fetching all shopping lists');
    
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching shopping lists:', error);
      throw error;
    }
    
    console.log('Shopping lists fetched:', data);
    return data || [];
  },

  async getOrCreateTodaysList(userId: string): Promise<ShoppingList | null> {
    const today = new Date().toISOString().split('T')[0];
    console.log('Getting or creating list for date:', today, 'user:', userId);

    try {
      // First try to get today's list (shared among all users)
      let { data: existingList, error: fetchError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing list:', fetchError);
        throw fetchError;
      }

      // If no list exists for today, create one
      if (!existingList) {
        console.log('No list exists for today, creating new one for all roommates');
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            date: today,
            created_by: userId
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating shopping list:', createError);
          throw createError;
        }
        
        console.log('New shared shopping list created:', newList);
        existingList = newList;
      } else {
        console.log('Found existing shared list for today:', existingList);
      }

      return existingList;
    } catch (error: any) {
      console.error('Error getting/creating shopping list:', error);
      throw error;
    }
  },

  async sendMarketNotification(listId: string): Promise<void> {
    console.log('Sending market notification for list:', listId);
    
    const { error } = await supabase.rpc('send_market_notification', {
      shopping_list_id_param: listId
    });

    if (error) {
      console.error('Error sending market notification:', error);
      throw error;
    }
    
    console.log('Market notification sent successfully');
  }
};
