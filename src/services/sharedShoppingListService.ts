
import { supabase } from '@/integrations/supabase/client';

export interface SharedShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category?: string;
  added_by: string;
  added_by_name?: string;
  is_purchased: boolean;
  purchased_by?: string;
  purchased_by_name?: string;
  purchased_at?: string;
  created_at: string;
  updated_at: string;
}

export const sharedShoppingListService = {
  async fetchSharedItems(): Promise<SharedShoppingItem[]> {
    console.log('Fetching shared shopping list items');
    
    const { data, error } = await supabase
      .from('shared_shopping_items' as any)
      .select(`
        *,
        added_by_profile:profiles!shared_shopping_items_added_by_fkey(name),
        purchased_by_profile:profiles!shared_shopping_items_purchased_by_fkey(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared shopping items:', error);
      throw error;
    }
    
    return (data || []).map((item: any) => ({
      ...item,
      added_by_name: item.added_by_profile?.name || 'Unknown',
      purchased_by_name: item.purchased_by_profile?.name || undefined
    }));
  },

  async addSharedItem(itemData: { name: string; quantity: string; category?: string }, userId: string): Promise<SharedShoppingItem> {
    console.log('Adding shared shopping item:', itemData);
    
    const { data, error } = await supabase
      .from('shared_shopping_items' as any)
      .insert({
        name: itemData.name,
        quantity: itemData.quantity,
        category: itemData.category,
        added_by: userId
      })
      .select(`
        *,
        added_by_profile:profiles!shared_shopping_items_added_by_fkey(name)
      `)
      .single();

    if (error) {
      console.error('Error adding shared shopping item:', error);
      throw error;
    }

    return {
      ...data,
      added_by_name: data.added_by_profile?.name || 'Unknown'
    };
  },

  async markAsPurchased(itemId: string, userId: string): Promise<SharedShoppingItem> {
    console.log('Marking shared item as purchased:', itemId);
    
    const { data, error } = await supabase
      .from('shared_shopping_items' as any)
      .update({
        is_purchased: true,
        purchased_by: userId,
        purchased_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select(`
        *,
        added_by_profile:profiles!shared_shopping_items_added_by_fkey(name),
        purchased_by_profile:profiles!shared_shopping_items_purchased_by_fkey(name)
      `)
      .single();

    if (error) {
      console.error('Error marking shared item as purchased:', error);
      throw error;
    }

    return {
      ...data,
      added_by_name: data.added_by_profile?.name || 'Unknown',
      purchased_by_name: data.purchased_by_profile?.name || undefined
    };
  },

  async deleteSharedItem(itemId: string): Promise<void> {
    console.log('Deleting shared shopping item:', itemId);
    
    const { error } = await supabase
      .from('shared_shopping_items' as any)
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting shared shopping item:', error);
      throw error;
    }
  }
};
