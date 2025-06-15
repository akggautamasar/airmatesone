
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
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared shopping items:', error);
      throw error;
    }
    
    // Get user profiles for added_by and purchased_by users
    const userIds = [...new Set([
      ...data.map(item => item.added_by),
      ...data.filter(item => item.purchased_by).map(item => item.purchased_by)
    ])];
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
    
    return data.map(item => ({
      ...item,
      added_by_name: profileMap.get(item.added_by) || 'Unknown',
      purchased_by_name: item.purchased_by ? profileMap.get(item.purchased_by) : undefined
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
      .select()
      .single();

    if (error) {
      console.error('Error adding shared shopping item:', error);
      throw error;
    }

    // Get the user's profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    return {
      ...data,
      added_by_name: profile?.name || 'Unknown'
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
      .select()
      .single();

    if (error) {
      console.error('Error marking shared item as purchased:', error);
      throw error;
    }

    // Get both users' profile names
    const userIds = [data.added_by, data.purchased_by].filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

    return {
      ...data,
      added_by_name: profileMap.get(data.added_by) || 'Unknown',
      purchased_by_name: profileMap.get(data.purchased_by) || undefined
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
