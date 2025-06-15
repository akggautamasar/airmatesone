
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { shoppingListItemsService } from '@/services/shoppingListItemsService';
import type { ShoppingListItem, AddItemData } from '@/types/shopping';

export const useShoppingListItems = () => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchListItems = async (listId: string) => {
    try {
      console.log('Fetching items for list:', listId);
      const data = await shoppingListItemsService.fetchListItems(listId);
      console.log('Items fetched:', data);
      setItems(data);
    } catch (error: any) {
      console.error('Error fetching list items:', error);
    }
  };

  const addItem = async (listId: string, itemData: AddItemData) => {
    if (!user) return;

    try {
      console.log('Adding item:', itemData);
      const newItem = await shoppingListItemsService.addItem(listId, user.id, itemData);
      setItems(prev => [...prev, newItem]);
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
      console.log('Marking item as purchased:', itemId);
      const updatedItem = await shoppingListItemsService.markAsPurchased(itemId, user.id);
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
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

  return {
    items,
    fetchListItems,
    addItem,
    markAsPurchased
  };
};
