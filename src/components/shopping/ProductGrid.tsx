
import React from 'react';
import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProductGridProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ProductGrid = ({ products, onEdit, onDelete }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No products yet. Add your first product to get started!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
