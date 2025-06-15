import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart, Users, Package, Mic, Loader2 } from "lucide-react";
import { useShoppingList } from '@/hooks/useShoppingList';
import { BulkProductSelector } from './BulkProductSelector';
import { MarketStatus } from './MarketStatus';
import { ShoppingListToolbar } from './ShoppingListToolbar';
import { ShoppingListDisplay } from './ShoppingListDisplay';
import { AddItemData } from '@/types/shopping';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useToast } from '@/hooks/use-toast';

const parseVoiceInput = (text: string) => {
  // This is a simple parser. It looks for a number and optional unit.
  // E.g., "2 kg tomatoes", "tomatoes 2kg", "5 apples"
  const quantityRegex = /(\d+(\.\d+)?\s*(kg|kgs|g|gs|l|litre|litres|ml|piece|pieces)?)/i;
  const match = text.match(quantityRegex);

  let name = text;
  let quantity = '1';

  if (match) {
    quantity = match[0].trim();
    name = text.replace(match[0], '').replace(/ of /i, '').trim();
  }
  
  // If parsing results in an empty name, use the original text as the name.
  if (!name) {
    name = text;
  }

  return { name, quantity };
};


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
  const { toast } = useToast();

  const handleTranscription = (text: string) => {
    if (text) {
      const { name, quantity } = parseVoiceInput(text);
      setNewItem({ name, quantity });
      toast({
        title: "Item Parsed from Voice",
        description: `Name: "${name}", Quantity: "${quantity}"`
      });
    } else {
       toast({
        title: "Voice Input Failed",
        description: "Couldn't understand what you said. Please try again.",
        variant: "destructive"
      });
    }
  };

  const { isRecording, isTranscribing, startRecording } = useVoiceInput(handleTranscription);

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
              <div className="flex items-center space-x-2">
                <Button type="submit" disabled={isTranscribing}>Add Item</Button>
                <Button type="button" variant="outline" onClick={() => { setIsAddingItem(false); setNewItem({ name: '', quantity: '' }); }}>Cancel</Button>
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={startRecording}
                  disabled={isTranscribing}
                  title="Add item with voice"
                >
                  {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                </Button>
                {isRecording && <span className="text-sm text-blue-600 animate-pulse">Recording...</span>}
                {isTranscribing && <span className="text-sm text-muted-foreground">Transcribing...</span>}
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
