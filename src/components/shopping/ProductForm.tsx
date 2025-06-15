
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductFormProps {
  formData: {
    name: string;
    category: string;
    unit: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    category: string;
    unit: string;
  }>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
}

export const ProductForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}: ProductFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor={isEditing ? "edit-name" : "name"}>Product Name</Label>
        <Input
          id={isEditing ? "edit-name" : "name"}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor={isEditing ? "edit-category" : "category"}>Category (Optional)</Label>
        <Input
          id={isEditing ? "edit-category" : "category"}
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="e.g., Vegetables, Dairy, etc."
        />
      </div>
      <div>
        <Label htmlFor={isEditing ? "edit-unit" : "unit"}>Unit (Optional)</Label>
        <Input
          id={isEditing ? "edit-unit" : "unit"}
          value={formData.unit}
          onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
          placeholder="e.g., kg, liters, pieces"
        />
      </div>
      <div className={isEditing ? "flex space-x-2" : ""}>
        <Button type="submit" className={isEditing ? "flex-1" : "w-full"}>
          {isEditing ? "Update Product" : "Add Product"}
        </Button>
        {isEditing && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
