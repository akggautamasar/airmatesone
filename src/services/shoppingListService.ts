
import { supabase } from '@/integrations/supabase/client';
import type { ShoppingList } from '@/types/shopping';

export const shoppingListService = {
  async fetchShoppingLists(): Promise<ShoppingList[]> {
    console.log('Fetching all shared shopping lists');
    
    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching shopping lists:', error);
        throw error;
      }
      
      console.log('Shared shopping lists fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Service error fetching shopping lists:', error);
      throw error;
    }
  },

  async getOrCreateTodaysList(userId: string): Promise<ShoppingList | null> {
    const today = new Date().toISOString().split('T')[0];
    console.log('Getting or creating shared list for date:', today, 'requested by user:', userId);

    try {
      // First try to get today's shared list
      let { data: existingList, error: fetchError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing shared list:', fetchError);
        throw fetchError;
      }

      // If no shared list exists for today, create one
      if (!existingList) {
        console.log('No shared list exists for today, creating new shared shopping list');
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            date: today,
            created_by: userId
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating shared shopping list:', createError);
          throw createError;
        }
        
        console.log('New shared shopping list created:', newList);
        existingList = newList;
      } else {
        console.log('Found existing shared list for today:', existingList);
      }

      return existingList;
    } catch (error: any) {
      console.error('Error getting/creating shared shopping list:', error);
      throw error;
    }
  },

  async sendMarketNotification(listId: string): Promise<void> {
    console.log('Sending market notification for shared list:', listId);
    
    try {
      const { error } = await supabase.rpc('send_market_notification', {
        shopping_list_id_param: listId
      });

      if (error) {
        console.error('Error sending market notification:', error);
        throw error;
      }
      
      console.log('Market notification sent successfully to all roommates');
    } catch (error) {
      console.error('Service error sending market notification:', error);
      throw error;
    }
  }
};
