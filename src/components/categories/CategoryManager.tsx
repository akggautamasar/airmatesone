
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pen, Trash } from 'lucide-react';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface CategoryManagerProps {
  categories: string[];
  onCategoryAdd: (category: string) => void;
  onCategoryEdit: (oldCategory: string, newCategory: string) => void;
  onCategoryDelete: (category: string) => void;
}

export const CategoryManager = ({ 
  categories, 
  onCategoryAdd, 
  onCategoryEdit, 
  onCategoryDelete 
}: CategoryManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const addForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const editForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  const handleAddCategory = (data: CategoryForm) => {
    if (categories.includes(data.name)) {
      toast({
        title: "Error",
        description: "Category already exists",
        variant: "destructive",
      });
      return;
    }

    onCategoryAdd(data.name);
    addForm.reset();
    setIsAddDialogOpen(false);
    toast({
      title: "Success",
      description: "Category added successfully",
    });
  };

  const handleEditCategory = (data: CategoryForm) => {
    if (!editingCategory) return;

    if (categories.includes(data.name) && data.name !== editingCategory) {
      toast({
        title: "Error",
        description: "Category already exists",
        variant: "destructive",
      });
      return;
    }

    onCategoryEdit(editingCategory, data.name);
    editForm.reset();
    setEditingCategory(null);
    toast({
      title: "Success",
      description: "Category updated successfully",
    });
  };

  const handleDeleteCategory = (category: string) => {
    onCategoryDelete(category);
    toast({
      title: "Success",
      description: "Category deleted successfully",
    });
  };

  const startEdit = (category: string) => {
    setEditingCategory(category);
    editForm.setValue('name', category);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manage Categories</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddCategory)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit">Add Category</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center justify-between p-2 border rounded">
              <span>{category}</span>
              <div className="flex gap-2">
                <Dialog 
                  open={editingCategory === category} 
                  onOpenChange={(open) => !open && setEditingCategory(null)}
                >
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => startEdit(category)}
                    >
                      <Pen className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                      <form onSubmit={editForm.handleSubmit(handleEditCategory)} className="space-y-4">
                        <FormField
                          control={editForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter category name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="submit">Update Category</Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditingCategory(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDeleteCategory(category)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
