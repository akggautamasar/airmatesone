
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart, Users, Package } from "lucide-react";
import { useShoppingList } from '@/hooks/useShoppingList';
import { BulkProductSelector } from './BulkProductSelector';
import { MarketStatus } from './MarketStatus';
import { ShoppingListToolbar } from './ShoppingListToolbar';
import { ShoppingListDisplay } from './ShoppingListDisplay';
import { AddItemData } from '@/types/shopping';

export const SharedShoppingList = () => {
  const {
    selectedDate,
    setSelectedDate,
    items,
    loading,
    addItem,
    markAsPurchased,
    deleteItem
  } = useShoppingList();
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showBulkSelector, setShowBulkSelector] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.quantity.trim()) return;

    await addItem({
      custom_product_name: newItem.name.trim(),
      quantity: newItem.quantity.trim()
    });

    setNewItem({ name: '', quantity: '' });
    setIsAddingItem(false);
  };

  const handleBulkAdd = async (selectedProducts: Array<{ product: any; quantity: string }>) => {
    for (const { product, quantity } of selectedProducts) {
      const itemData: AddItemData = {
        product_id: product.id,
        quantity,
      };
      await addItem(itemData);
    }
    setShowBulkSelector(false);
  };
  
  return (
    <div className="space-y-6">
      <MarketStatus />

      <ShoppingListToolbar 
        selectedDate={selectedDate}
        onDateChange={(date) => setSelectedDate(date || new Date())}
        items={items}
      />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Shopping List</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => setShowBulkSelector(true)} variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add from Products
              </Button>
              <Button onClick={() => setIsAddingItem(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Item
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isAddingItem && (
          <CardContent className="border-t pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" value={newItem.name} onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Tomatoes" required />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" value={newItem.quantity} onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))} placeholder="e.g., 2kg, 3 pieces" required />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingItem(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {showBulkSelector && (
        <BulkProductSelector
          onAdd={handleBulkAdd}
          onCancel={() => setShowBulkSelector(false)}
        />
      )}

      <ShoppingListDisplay
        items={items}
        loading={loading}
        onMarkPurchased={markAsPurchased}
        onDeleteItem={deleteItem}
      />
    </div>
  );
};
