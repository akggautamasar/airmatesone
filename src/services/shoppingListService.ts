
import { supabase } from '@/integrations/supabase/client';
import { ShoppingListItem, ShoppingList } from '@/types/shopping';

export const shoppingListService = {
  async getOrCreateShoppingList(date: string, userId: string): Promise<ShoppingList> {
    let { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('date', date)
      .single();

    if (listError && listError.code !== 'PGRST116') { // PGRST116: no rows found
      throw listError;
    }

    if (!list) {
      const { data: newList, error: newListError } = await supabase
        .from('shopping_lists')
        .insert({ date, created_by: userId })
        .select()
        .single();
      if (newListError) throw newListError;
      list = newList;
    }

    return list;
  },

  async getListItems(listId: string): Promise<ShoppingListItem[]> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select(`
        *,
        product:products(*),
        added_by_profile:profiles!added_by(name),
        purchased_by_profile:profiles!purchased_by(name)
      `)
      .eq('shopping_list_id', listId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addItem(listId: string, itemData: { custom_product_name?: string; product_id?: string; quantity: string; }, userId: string): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({ ...itemData, shopping_list_id: listId, added_by: userId })
      .select(`
        *,
        product:products(*),
        added_by_profile:profiles!added_by(name)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async markAsPurchased(itemId: string, userId: string): Promise<ShoppingListItem> {
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: true, purchased_by: userId, purchased_at: new Date().toISOString() })
      .eq('id', itemId)
      .select(`
        *,
        product:products(*),
        added_by_profile:profiles!added_by(name),
        purchased_by_profile:profiles!purchased_by(name)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', itemId);
    if (error) throw error;
  },
};
