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
    const { data: items, error } = await supabase
      .from('shopping_list_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('shopping_list_id', listId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!items) return [];

    const userIds = [...new Set(items.flatMap(item => [item.added_by, item.purchased_by].filter((id): id is string => !!id)))];
    
    if (userIds.length === 0) {
        return items.map(item => ({ ...item, added_by_profile: null, purchased_by_profile: null }));
    }

    const { data: profiles, error: profileError } = await supabase
      .rpc('get_users_details', { p_user_ids: userIds });

    if (profileError) {
      console.error("Failed to fetch profiles:", profileError);
      return items.map(item => ({ ...item, added_by_profile: null, purchased_by_profile: null }));
    }

    const profilesById = new Map(profiles?.map(p => [p.id, { name: p.name, email: p.email }]));

    const itemsWithProfiles: ShoppingListItem[] = items.map(item => ({
      ...item,
      added_by_profile: (item.added_by ? profilesById.get(item.added_by) : null) || null,
      purchased_by_profile: (item.purchased_by ? profilesById.get(item.purchased_by) : null) || null,
    }));

    return itemsWithProfiles;
  },

  async addItem(listId: string, itemData: { custom_product_name?: string; product_id?: string; quantity: string; }, userId: string): Promise<ShoppingListItem> {
    const { data: newItem, error } = await supabase
      .from('shopping_list_items')
      .insert({ ...itemData, shopping_list_id: listId, added_by: userId })
      .select(`
        *,
        product:products(*)
      `)
      .single();
    
    if (error) throw error;
    if (!newItem) throw new Error("Failed to add item.");

    const { data: profiles, error: profileError } = await supabase
        .rpc('get_users_details', { p_user_ids: [newItem.added_by] });

    if (profileError) {
        console.error('Failed to fetch profile for new item:', profileError);
    }

    const profile = profiles && profiles.length > 0 ? { name: profiles[0].name, email: profiles[0].email } : null;
    
    const result: ShoppingListItem = {
        ...newItem,
        added_by_profile: profile || null,
    };

    return result;
  },

  async markAsPurchased(itemId: string, userId: string): Promise<ShoppingListItem> {
    const { data: updatedItem, error } = await supabase
      .from('shopping_list_items')
      .update({ is_purchased: true, purchased_by: userId, purchased_at: new Date().toISOString() })
      .eq('id', itemId)
      .select(`
        *,
        product:products(*)
      `)
      .single();

    if (error) throw error;
    if (!updatedItem) throw new Error("Failed to update item.");

    const userIds = [updatedItem.added_by, updatedItem.purchased_by].filter(Boolean) as string[];
    
    if(userIds.length === 0) {
        return { ...updatedItem, added_by_profile: null, purchased_by_profile: null };
    }

    const { data: profiles, error: profileError } = await supabase
        .rpc('get_users_details', { p_user_ids: userIds });
    
    if (profileError) {
        console.error('Failed to fetch profiles for updated item:', profileError);
        return {
            ...updatedItem,
            added_by_profile: null,
            purchased_by_profile: null,
        };
    }

    const profilesById = new Map(profiles?.map(p => [p.id, { name: p.name, email: p.email }]));

    const result: ShoppingListItem = {
        ...updatedItem,
        added_by_profile: (updatedItem.added_by ? profilesById.get(updatedItem.added_by) : null) || null,
        purchased_by_profile: (updatedItem.purchased_by ? profilesById.get(updatedItem.purchased_by) : null) || null,
    };
    return result;
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', itemId);
    if (error) throw error;
  },
};
