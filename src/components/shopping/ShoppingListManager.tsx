
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Check, User, Calendar, Send } from "lucide-react";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { useProducts } from "@/hooks/useProducts";

export const ShoppingListManager = () => {
  const { currentList, items, addItem, markAsPurchased, sendMarketNotification } = useShoppingLists();
  const { products } = useProducts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'existing', // 'existing' or 'custom'
    product_id: '',
    custom_product_name: '',
    quantity: '',
    save_to_products: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      quantity: formData.quantity,
      ...(formData.type === 'existing' 
        ? { product_id: formData.product_id }
        : { 
            custom_product_name: formData.custom_product_name,
            save_to_products: formData.save_to_products 
          }
      )
    };

    await addItem(itemData);
    setIsAddDialogOpen(false);
    setFormData({
      type: 'existing',
      product_id: '',
      custom_product_name: '',
      quantity: '',
      save_to_products: false
    });
  };

  const groupedItems = items.reduce((acc, item) => {
    const userName = item.added_by_profile?.name || 'Unknown';
    if (!acc[userName]) {
      acc[userName] = [];
    }
    acc[userName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const today = new Date().toLocaleDateString();
  const pendingItems = items.filter(item => !item.is_purchased);
  const purchasedItems = items.filter(item => item.is_purchased);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Shopping List for {today}</span>
              </CardTitle>
              <CardDescription>
                {pendingItems.length} items pending • {purchasedItems.length} purchased
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Item to Shopping List</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Item Type</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="existing">From Product List</SelectItem>
                          <SelectItem value="custom">Custom Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.type === 'existing' ? (
                      <div>
                        <Label htmlFor="product">Select Product</Label>
                        <Select 
                          value={formData.product_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} {product.unit && `(${product.unit})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="custom-name">Product Name</Label>
                          <Input
                            id="custom-name"
                            value={formData.custom_product_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, custom_product_name: e.target.value }))}
                            placeholder="Enter product name"
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="save-product"
                            checked={formData.save_to_products}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, save_to_products: !!checked }))
                            }
                          />
                          <Label htmlFor="save-product">Save to product list</Label>
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                        placeholder="e.g., 2kg, 3 pieces, 1 bottle"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Add to List
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {currentList && !currentList.is_market_notification_sent && (
                <Button
                  onClick={sendMarketNotification}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  I'm Going to Market
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Shopping List Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Items by User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span>Shopping List ({pendingItems.length} items)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedItems).map(([userName, userItems]) => {
              const pendingUserItems = userItems.filter(item => !item.is_purchased);
              if (pendingUserItems.length === 0) return null;

              return (
                <div key={userName} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{userName}</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    {pendingUserItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <span className="font-medium">
                            {item.product?.name || item.custom_product_name}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({item.quantity})
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => markAsPurchased(item.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark Purchased
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {pendingItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                All items purchased! 🎉
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
                    {item.product?.name || item.custom_product_name} ({item.quantity})
                  </p>
                  <p className="text-xs text-green-600">
                    Added by {item.added_by_profile?.name} • Purchased by {item.purchased_by_profile?.name}
                  </p>
                </div>
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
