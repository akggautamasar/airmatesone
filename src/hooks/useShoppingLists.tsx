
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ShoppingList {
  id: string;
  date: string;
  created_by: string;
  is_market_notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  product_id: string | null;
  custom_product_name: string | null;
  quantity: string;
  added_by: string;
  is_purchased: boolean;
  purchased_by: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    category: string | null;
    unit: string | null;
  } | null;
  added_by_profile?: {
    name: string | null;
  } | null;
  purchased_by_profile?: {
    name: string | null;
  } | null;
}

export const useShoppingLists = () => {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchShoppingLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setShoppingLists(data || []);
    } catch (error: any) {
      console.error('Error fetching shopping lists:', error);
    }
  };

  const fetchListItems = async (listId: string) => {
    try {
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

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        added_by_profile: item.added_by_profile && typeof item.added_by_profile === 'object' && item.added_by_profile !== null && 'name' in item.added_by_profile 
          ? item.added_by_profile 
          : null,
        purchased_by_profile: item.purchased_by_profile && typeof item.purchased_by_profile === 'object' && item.purchased_by_profile !== null && 'name' in item.purchased_by_profile 
          ? item.purchased_by_profile 
          : null
      }));
      
      setItems(transformedData);
    } catch (error: any) {
      console.error('Error fetching list items:', error);
    }
  };

  const getOrCreateTodaysList = async () => {
    if (!user) return null;

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
            created_by: user.id
          })
          .select()
          .single();

        if (createError) throw createError;
        existingList = newList;
      }

      setCurrentList(existingList);
      await fetchListItems(existingList.id);
      return existingList;
    } catch (error: any) {
      console.error('Error getting/creating shopping list:', error);
      toast({
        title: "Error",
        description: "Failed to load shopping list",
        variant: "destructive",
      });
      return null;
    }
  };

  const addItem = async (itemData: {
    product_id?: string;
    custom_product_name?: string;
    quantity: string;
    save_to_products?: boolean;
  }) => {
    if (!user || !currentList) return;

    try {
      // If it's a custom product and user wants to save it
      let finalProductId = itemData.product_id;
      if (itemData.custom_product_name && itemData.save_to_products) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: itemData.custom_product_name,
            created_by: user.id
          })
          .select()
          .single();

        if (productError) throw productError;
        finalProductId = newProduct.id;
      }

      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert({
          shopping_list_id: currentList.id,
          product_id: finalProductId || null,
          custom_product_name: finalProductId ? null : itemData.custom_product_name,
          quantity: itemData.quantity,
          added_by: user.id
        })
        .select(`
          *,
          product:products(name, category, unit),
          added_by_profile:profiles!shopping_list_items_added_by_fkey(name)
        `)
        .single();

      if (error) throw error;

      // Transform the returned data
      const transformedItem = {
        ...data,
        added_by_profile: data.added_by_profile && typeof data.added_by_profile === 'object' && data.added_by_profile !== null && 'name' in data.added_by_profile 
          ? data.added_by_profile 
          : null,
        purchased_by_profile: null
      };

      setItems(prev => [...prev, transformedItem]);
      toast({
        title: "Success",
        description: "Item added to shopping list",
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const markAsPurchased = async (itemId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .update({
          is_purchased: true,
          purchased_by: user.id,
          purchased_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select(`
          *,
          product:products(name, category, unit),
          added_by_profile:profiles!shopping_list_items_added_by_fkey(name),
          purchased_by_profile:profiles!shopping_list_items_purchased_by_fkey(name)
        `)
        .single();

      if (error) throw error;

      // Transform the returned data
      const transformedItem = {
        ...data,
        added_by_profile: data.added_by_profile && typeof data.added_by_profile === 'object' && data.added_by_profile !== null && 'name' in data.added_by_profile 
          ? data.added_by_profile 
          : null,
        purchased_by_profile: data.purchased_by_profile && typeof data.purchased_by_profile === 'object' && data.purchased_by_profile !== null && 'name' in data.purchased_by_profile 
          ? data.purchased_by_profile 
          : null
      };

      setItems(prev => prev.map(item => item.id === itemId ? transformedItem : item));
      toast({
        title: "Success",
        description: "Item marked as purchased",
      });
    } catch (error: any) {
      console.error('Error marking as purchased:', error);
      toast({
        title: "Error",
        description: "Failed to mark as purchased",
        variant: "destructive",
      });
    }
  };

  const sendMarketNotification = async () => {
    if (!currentList) return;

    try {
      const { error } = await supabase.rpc('send_market_notification', {
        shopping_list_id_param: currentList.id
      });

      if (error) throw error;

      setCurrentList(prev => prev ? { ...prev, is_market_notification_sent: true } : null);
      toast({
        title: "Success",
        description: "Market notification sent to all roommates",
      });
    } catch (error: any) {
      console.error('Error sending market notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchShoppingLists();
      getOrCreateTodaysList();
    }
  }, [user]);

  return {
    shoppingLists,
    currentList,
    items,
    loading,
    getOrCreateTodaysList,
    addItem,
    markAsPurchased,
    sendMarketNotification,
    refetch: fetchShoppingLists
  };
};
