
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { sharedShoppingListService, SharedShoppingItem } from '@/services/sharedShoppingListService';

export const useSharedShoppingList = () => {
  const [items, setItems] = useState<SharedShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      const data = await sharedShoppingListService.fetchSharedItems();
      setItems(data);
    } catch (error: any) {
      console.error('Error fetching shared shopping items:', error);
      toast({
        title: "Error",
        description: "Failed to load shared shopping items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData: { name: string; quantity: string; category?: string }) => {
    if (!user) return;

    try {
      const newItem = await sharedShoppingListService.addSharedItem(itemData, user.id);
      setItems(prev => [newItem, ...prev]);
      toast({
        title: "Success",
        description: "Item added to shared shopping list",
      });
    } catch (error: any) {
      console.error('Error adding shared shopping item:', error);
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
      const updatedItem = await sharedShoppingListService.markAsPurchased(itemId, user.id);
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      toast({
        title: "Success",
        description: "Item marked as purchased",
      });
    } catch (error: any) {
      console.error('Error marking item as purchased:', error);
      toast({
        title: "Error",
        description: "Failed to mark as purchased",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await sharedShoppingListService.deleteSharedItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Item deleted from shared shopping list",
      });
    } catch (error: any) {
      console.error('Error deleting shared shopping item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  return {
    items,
    loading,
    addItem,
    markAsPurchased,
    deleteItem,
    refetch: fetchItems
  };
};
