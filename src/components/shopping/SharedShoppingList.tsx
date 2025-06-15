
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart, Check, Trash2, Users, Package } from "lucide-react";
import { useSharedShoppingList } from '@/hooks/useSharedShoppingList';
import { BulkProductSelector } from './BulkProductSelector';

export const SharedShoppingList = () => {
  const { items, loading, addItem, markAsPurchased, deleteItem } = useSharedShoppingList();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showBulkSelector, setShowBulkSelector] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    category: ''
  });

  console.log('SharedShoppingList items:', items);

  const pendingItems = items.filter(item => !item.is_purchased);
  const purchasedItems = items.filter(item => item.is_purchased);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.quantity.trim()) return;

    await addItem({
      name: newItem.name.trim(),
      quantity: newItem.quantity.trim(),
      category: newItem.category.trim() || undefined
    });

    setNewItem({ name: '', quantity: '', category: '' });
    setIsAddingItem(false);
  };

  const handleBulkAdd = async (selectedProducts: Array<{ product: any; quantity: string }>) => {
    for (const { product, quantity } of selectedProducts) {
      await addItem({
        name: product.name,
        quantity: quantity,
        category: product.category || undefined
      });
    }
    setShowBulkSelector(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading shared shopping list...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <ShoppingCart className="h-5 w-5" />
              <span>Shared Shopping List</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowBulkSelector(true)}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Package className="h-4 w-4 mr-2" />
                Add from Products
              </Button>
              <Button
                onClick={() => setIsAddingItem(true)}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isAddingItem && (
          <CardContent className="border-t">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Milk, Bread"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g., 2kg, 3 pieces"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Dairy, Vegetables"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Add Item</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItem({ name: '', quantity: '', category: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Bulk Product Selector Dialog */}
      {showBulkSelector && (
        <BulkProductSelector
          onAdd={handleBulkAdd}
          onCancel={() => setShowBulkSelector(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              <span>Pending Items ({pendingItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                    {item.category && ` • Category: ${item.category}`}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">
                    Added by {item.added_by_name || 'Unknown User'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => markAsPurchased(item.id)}
                  className="bg-green-600 hover:bg-green-700 ml-2"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Purchased
                </Button>
              </div>
            ))}

            {pendingItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pending items in the shared shopping list
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchased Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Purchased Items ({purchasedItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchasedItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium line-through text-muted-foreground">
                    {item.name} ({item.quantity})
                  </p>
                  {item.category && (
                    <p className="text-xs text-muted-foreground">Category: {item.category}</p>
                  )}
                  <div className="text-xs space-y-1">
                    <p className="text-blue-600">
                      Added by {item.added_by_name || 'Unknown User'}
                    </p>
                    <p className="text-green-600 font-medium">
                      Purchased by {item.purchased_by_name || 'Unknown User'}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {purchasedItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items purchased yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
