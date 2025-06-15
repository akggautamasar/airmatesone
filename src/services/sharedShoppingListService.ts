
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
      .from('shared_shopping_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared shopping items:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      return [];
    }
    
    // Get all unique user IDs from the items
    const userIds = [...new Set([
      ...data.map((item: any) => item.added_by),
      ...data.filter((item: any) => item.purchased_by).map((item: any) => item.purchased_by)
    ])].filter(Boolean); // Remove any null/undefined values

    console.log('Fetching profiles for user IDs:', userIds);
    
    if (userIds.length === 0) {
      console.log('No user IDs to fetch profiles for');
      return data.map((item: any) => ({
        ...item,
        added_by_name: 'Unknown User',
        purchased_by_name: item.purchased_by ? 'Unknown User' : undefined
      }));
    }

    // First try to get profiles from the profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    console.log('Fetched profiles:', profiles);
    
    // Create a map of user IDs to names
    const profileMap = new Map();
    
    if (profiles) {
      profiles.forEach(profile => {
        // Use name if available, otherwise fall back to email or 'Unknown User'
        const displayName = profile.name || profile.email || 'Unknown User';
        profileMap.set(profile.id, displayName);
      });
    }

    // For any missing profiles, try to get user data from auth.users via a function call
    const missingUserIds = userIds.filter(id => !profileMap.has(id));
    
    if (missingUserIds.length > 0) {
      console.log('Missing profiles for user IDs:', missingUserIds);
      
      // Try to get emails for missing users
      for (const userId of missingUserIds) {
        try {
          const { data: emailData } = await supabase.rpc('get_user_email_by_id', {
            user_id_param: userId
          });
          
          if (emailData) {
            profileMap.set(userId, emailData);
            console.log(`Found email for user ${userId}: ${emailData}`);
          } else {
            profileMap.set(userId, 'Unknown User');
          }
        } catch (error) {
          console.error(`Error fetching email for user ${userId}:`, error);
          profileMap.set(userId, 'Unknown User');
        }
      }
    }
    
    const itemsWithNames = data.map((item: any) => ({
      ...item,
      added_by_name: profileMap.get(item.added_by) || 'Unknown User',
      purchased_by_name: item.purchased_by ? (profileMap.get(item.purchased_by) || 'Unknown User') : undefined
    }));

    console.log('Items with names:', itemsWithNames);
    return itemsWithNames;
  },

  async addSharedItem(itemData: { name: string; quantity: string; category?: string }, userId: string): Promise<SharedShoppingItem> {
    console.log('Adding shared shopping item:', itemData);
    
    const { data, error } = await supabase
      .from('shared_shopping_items')
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

    if (!data) {
      throw new Error('No data returned from insert');
    }

    // Get the user's profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();

    const displayName = profile?.name || profile?.email || 'Unknown User';

    return {
      ...(data as any),
      added_by_name: displayName
    };
  },

  async markAsPurchased(itemId: string, userId: string): Promise<SharedShoppingItem> {
    console.log('Marking shared item as purchased:', itemId);
    
    const { data, error } = await supabase
      .from('shared_shopping_items')
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

    if (!data) {
      throw new Error('No data returned from update');
    }

    // Get both users' profile names
    const userIds = [(data as any).added_by, (data as any).purchased_by].filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds);
    
    const profileMap = new Map();
    
    if (profiles) {
      profiles.forEach(profile => {
        const displayName = profile.name || profile.email || 'Unknown User';
        profileMap.set(profile.id, displayName);
      });
    }

    return {
      ...(data as any),
      added_by_name: profileMap.get((data as any).added_by) || 'Unknown User',
      purchased_by_name: profileMap.get((data as any).purchased_by) || 'Unknown User'
    };
  },

  async deleteSharedItem(itemId: string): Promise<void> {
    console.log('Deleting shared shopping item:', itemId);
    
    const { error } = await supabase
      .from('shared_shopping_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting shared shopping item:', error);
      throw error;
    }
  }
};
