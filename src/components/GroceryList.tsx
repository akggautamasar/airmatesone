
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ShoppingCart, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroceryItem {
  id: number;
  name: string;
  addedBy: string;
  bought: boolean;
  boughtBy?: string;
}

export const GroceryList = () => {
  const [items, setItems] = useState<GroceryItem[]>([
    { id: 1, name: "Milk", addedBy: "Priya", bought: false },
    { id: 2, name: "Bread", addedBy: "You", bought: true, boughtBy: "Rahul" },
    { id: 3, name: "Onions", addedBy: "Arjun", bought: false },
    { id: 4, name: "Rice", addedBy: "Sneha", bought: false },
  ]);
  const [newItem, setNewItem] = useState('');
  const { toast } = useToast();

  const addItem = () => {
    if (!newItem.trim()) return;
    
    const newGroceryItem: GroceryItem = {
      id: Date.now(),
      name: newItem,
      addedBy: "You",
      bought: false,
    };
    
    setItems([...items, newGroceryItem]);
    setNewItem('');
    
    toast({
      title: "Item Added!",
      description: `${newItem} added to grocery list`,
    });
  };

  const markAsBought = (id: number) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, bought: true, boughtBy: "You" }
        : item
    ));
    
    toast({
      title: "Item Marked as Bought!",
      description: "Great job shopping!",
    });
  };

  const pendingItems = items.filter(item => !item.bought);
  const boughtItems = items.filter(item => item.bought);

  return (
    <div className="space-y-6">
      {/* Add Item Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Grocery List</span>
          </CardTitle>
          <CardDescription>
            Add items for your next market trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Add grocery item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Button 
              onClick={addItem}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Pending Items ({pendingItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                All items bought! 🎉
              </p>
            ) : (
              pendingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      checked={false}
                      onCheckedChange={() => markAsBought(item.id)}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Added by {item.addedBy}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsBought(item.id)}
                    className="bg-white hover:bg-green-50 border-green-300"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Bought
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Bought Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span>Bought Items ({boughtItems.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {boughtItems.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No items bought yet
              </p>
            ) : (
              boughtItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Checkbox checked={true} disabled />
                  <div className="flex-1">
                    <p className="font-medium line-through text-muted-foreground">{item.name}</p>
                    <p className="text-xs text-green-600">
                      Added by {item.addedBy} • Bought by {item.boughtBy}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
