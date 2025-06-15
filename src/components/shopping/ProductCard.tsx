
import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{product.name}</h3>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {product.category && (
        <p className="text-sm text-muted-foreground">
          Category: {product.category}
        </p>
      )}
      {product.unit && (
        <p className="text-sm text-muted-foreground">
          Unit: {product.unit}
        </p>
      )}
    </div>
  );
};
