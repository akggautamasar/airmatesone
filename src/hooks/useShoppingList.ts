
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { shoppingListService } from '@/services/shoppingListService';
import { ShoppingList, ShoppingListItem, AddItemData } from '@/types/shopping';
import { format } from 'date-fns';

export const useShoppingList = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchList = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const currentList = await shoppingListService.getOrCreateShoppingList(dateStr, user.id);
      setList(currentList);
      if (currentList) {
        const listItems = await shoppingListService.getListItems(currentList.id);
        setItems(listItems);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load shopping list.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const addItem = async (itemData: AddItemData) => {
    if (!user || !list) return;

    try {
      const newItem = await shoppingListService.addItem(list.id, itemData, user.id);
      setItems(prev => [newItem, ...prev]);
      toast({ title: "Success", description: "Item added to shopping list." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
    }
  };

  const markAsPurchased = async (itemId: string) => {
    if (!user) return;
    try {
      const updatedItem = await shoppingListService.markAsPurchased(itemId, user.id);
      setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
      toast({ title: "Success", description: "Item marked as purchased." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to mark as purchased.", variant: "destructive" });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await shoppingListService.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Success", description: "Item deleted." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
  };

  return {
    selectedDate,
    setSelectedDate,
    list,
    items,
    loading,
    addItem,
    markAsPurchased,
    deleteItem,
    refetch: fetchList
  };
};
