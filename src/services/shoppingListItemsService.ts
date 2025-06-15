
import { supabase } from '@/integrations/supabase/client';
import type { ShoppingListItem, AddItemData } from '@/types/shopping';

const transformProfileData = (profile: any) => {
  return profile && typeof profile === 'object' && profile !== null && 'name' in profile 
    ? profile 
    : null;
};

const transformItemData = (item: any): ShoppingListItem => ({
  ...item,
  added_by_profile: transformProfileData(item.added_by_profile),
  purchased_by_profile: transformProfileData(item.purchased_by_profile)
});

export const shoppingListItemsService = {
  async fetchListItems(listId: string): Promise<ShoppingListItem[]> {
    console.log('Fetching items for shared list:', listId);
    
    const { data, error } = await supabase
      .from('shopping_list_items')
      .select(`
        *,
        product:products(name, category, unit),
        added_by_profile:profiles!shopping_list_items_added_by_fkey(name),
        purchased_by_profile:profiles!shopping_list_items_purchased_by_fkey(name)
      `)
      .eq('shopping_list_id', listId)
      .order('created_at');

    if (error) {
      console.error('Error fetching shopping list items:', error);
      throw error;
    }
    
    console.log('Fetched shared items with profiles:', data);
    return (data || []).map(transformItemData);
  },

  async addItem(listId: string, userId: string, itemData: AddItemData): Promise<ShoppingListItem> {
    console.log('Adding item to shared list:', listId, 'by user:', userId, 'data:', itemData);
    
    // If it's a custom product and user wants to save it
    let finalProductId = itemData.product_id;
    if (itemData.custom_product_name && itemData.save_to_products) {
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          name: itemData.custom_product_name,
          created_by: userId
        })
        .select()
        .single();

      if (productError) {
        console.error('Error creating product:', productError);
        throw productError;
      }
      finalProductId = newProduct.id;
    }

    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({
        shopping_list_id: listId,
        product_id: finalProductId || null,
        custom_product_name: finalProductId ? null : itemData.custom_product_name,
        quantity: itemData.quantity,
        added_by: userId
      })
      .select(`
        *,
        product:products(name, category, unit)
      `)
      .single();

    if (error) {
      console.error('Error adding item to shared list:', error);
      throw error;
    }

    // Fetch the user profile separately for proper attribution
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    console.log('Item added successfully to shared list:', data);
    return {
      ...data,
      product: data.product,
      added_by_profile: userProfile ? { name: userProfile.name } : null,
      purchased_by_profile: null
    };
  },

  async markAsPurchased(itemId: string, userId: string): Promise<ShoppingListItem> {
    console.log('Marking shared item as purchased:', itemId, 'by user:', userId);
    
    const { data, error } = await supabase
      .from('shopping_list_items')
      .update({
        is_purchased: true,
        purchased_by: userId,
        purchased_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select(`
        *,
        product:products(name, category, unit)
      `)
      .single();

    if (error) {
      console.error('Error marking shared item as purchased:', error);
      throw error;
    }

    // Fetch both user profiles separately for proper attribution
    const { data: addedByProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', data.added_by)
      .single();

    const { data: purchasedByProfile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    console.log('Shared item marked as purchased:', data);
    return {
      ...data,
      product: data.product,
      added_by_profile: addedByProfile ? { name: addedByProfile.name } : null,
      purchased_by_profile: purchasedByProfile ? { name: purchasedByProfile.name } : null
    };
  }
};
