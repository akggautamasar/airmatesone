
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Search, X } from "lucide-react";
import { useProducts } from '@/hooks/useProducts';

interface BulkProductSelectorProps {
  onAdd: (selectedProducts: Array<{ product: any; quantity: string }>) => Promise<void>;
  onCancel: () => void;
}

export const BulkProductSelector = ({ onAdd, onCancel }: BulkProductSelectorProps) => {
  const { products, loading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      // Remove quantity when deselecting
      const newQuantities = { ...quantities };
      delete newQuantities[productId];
      setQuantities(newQuantities);
    } else {
      newSelected.add(productId);
      // Set default quantity when selecting
      setQuantities(prev => ({ ...prev, [productId]: '1' }));
    }
    setSelectedProducts(newSelected);
  };

  const handleQuantityChange = (productId: string, quantity: string) => {
    setQuantities(prev => ({ ...prev, [productId]: quantity }));
  };

  const handleSubmit = async () => {
    const selectedProductsData = Array.from(selectedProducts)
      .map(productId => {
        const product = products.find(p => p.id === productId);
        const quantity = quantities[productId];
        return product && quantity ? { product, quantity } : null;
      })
      .filter(Boolean) as Array<{ product: any; quantity: string }>;

    if (selectedProductsData.length === 0) return;

    setIsAdding(true);
    try {
      await onAdd(selectedProductsData);
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCount = selectedProducts.size;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Select Products to Add</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No products found matching your search' : 'No products available'}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    selectedProducts.has(product.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleProductToggle(product.id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {product.category && <span>Category: {product.category}</span>}
                        {product.unit && <span>Unit: {product.unit}</span>}
                      </div>
                    </div>
                    {selectedProducts.has(product.id) && (
                      <div className="w-24">
                        <Label htmlFor={`quantity-${product.id}`} className="sr-only">
                          Quantity
                        </Label>
                        <Input
                          id={`quantity-${product.id}`}
                          placeholder="Qty"
                          value={quantities[product.id] || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel} disabled={isAdding}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedCount === 0 || isAdding}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                {isAdding ? 'Adding...' : `Add ${selectedCount} Item${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
