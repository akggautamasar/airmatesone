
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import type { AddItemData } from "@/types/shopping";

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (itemData: AddItemData) => Promise<void>;
}

export const AddItemDialog = ({ isOpen, onOpenChange, onAddItem }: AddItemDialogProps) => {
  const { products } = useProducts();
  const [formData, setFormData] = useState({
    type: 'existing',
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

    await onAddItem(itemData);
    onOpenChange(false);
    setFormData({
      type: 'existing',
      product_id: '',
      custom_product_name: '',
      quantity: '',
      save_to_products: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
  );
};
