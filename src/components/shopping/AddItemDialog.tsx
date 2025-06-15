
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProducts } from "@/hooks/useProducts";
import type { AddItemData } from "@/types/shopping";

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (itemData: AddItemData) => Promise<void>;
}

interface SelectedProduct {
  id: string;
  name: string;
  unit: string | null;
  quantity: string;
}

export const AddItemDialog = ({ isOpen, onOpenChange, onAddItem }: AddItemDialogProps) => {
  const { products } = useProducts();
  const [mode, setMode] = useState<'bulk' | 'single'>('bulk');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [singleItemData, setSingleItemData] = useState({
    type: 'existing',
    product_id: '',
    custom_product_name: '',
    quantity: '',
    save_to_products: false
  });

  const handleProductToggle = (productId: string, checked: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (checked) {
      setSelectedProducts(prev => [...prev, {
        id: product.id,
        name: product.name,
        unit: product.unit,
        quantity: ''
      }]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleQuantityChange = (productId: string, quantity: string) => {
    setSelectedProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, quantity } : p
    ));
  };

  const handleBulkSubmit = async () => {
    const validProducts = selectedProducts.filter(p => p.quantity.trim() !== '');
    
    for (const product of validProducts) {
      await onAddItem({
        product_id: product.id,
        quantity: product.quantity
      });
    }
    
    onOpenChange(false);
    setSelectedProducts([]);
    setMode('bulk');
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      quantity: singleItemData.quantity,
      ...(singleItemData.type === 'existing' 
        ? { product_id: singleItemData.product_id }
        : { 
            custom_product_name: singleItemData.custom_product_name,
            save_to_products: singleItemData.save_to_products 
          }
      )
    };

    await onAddItem(itemData);
    onOpenChange(false);
    setSingleItemData({
      type: 'existing',
      product_id: '',
      custom_product_name: '',
      quantity: '',
      save_to_products: false
    });
    setMode('bulk');
  };

  const resetDialog = () => {
    setSelectedProducts([]);
    setSingleItemData({
      type: 'existing',
      product_id: '',
      custom_product_name: '',
      quantity: '',
      save_to_products: false
    });
    setMode('bulk');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Items to Shopping List</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Selection Mode</Label>
            <Select 
              value={mode} 
              onValueChange={(value: 'bulk' | 'single') => setMode(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bulk">Bulk Selection</SelectItem>
                <SelectItem value="single">Single Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'bulk' ? (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select Products</Label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={selectedProducts.some(p => p.id === product.id)}
                        onCheckedChange={(checked) => handleProductToggle(product.id, !!checked)}
                      />
                      <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                        {product.name} {product.unit && `(${product.unit})`}
                        {product.category && <span className="text-sm text-gray-500 ml-2">- {product.category}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div>
                  <Label className="text-base font-medium">Set Quantities</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedProducts.map((product) => (
                      <Card key={product.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{product.name}</span>
                          <Input
                            value={product.quantity}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            placeholder="e.g., 2kg, 3 pieces"
                            className="w-32"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBulkSubmit}
                disabled={selectedProducts.filter(p => p.quantity.trim() !== '').length === 0}
                className="w-full"
              >
                Add Selected Items ({selectedProducts.filter(p => p.quantity.trim() !== '').length})
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <Label>Item Type</Label>
                <Select 
                  value={singleItemData.type} 
                  onValueChange={(value) => setSingleItemData(prev => ({ ...prev, type: value }))}
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

              {singleItemData.type === 'existing' ? (
                <div>
                  <Label htmlFor="product">Select Product</Label>
                  <Select 
                    value={singleItemData.product_id} 
                    onValueChange={(value) => setSingleItemData(prev => ({ ...prev, product_id: value }))}
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
                      value={singleItemData.custom_product_name}
                      onChange={(e) => setSingleItemData(prev => ({ ...prev, custom_product_name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-product"
                      checked={singleItemData.save_to_products}
                      onCheckedChange={(checked) => 
                        setSingleItemData(prev => ({ ...prev, save_to_products: !!checked }))
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
                  value={singleItemData.quantity}
                  onChange={(e) => setSingleItemData(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g., 2kg, 3 pieces, 1 bottle"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Add to List
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
