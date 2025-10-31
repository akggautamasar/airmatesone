
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoommates } from '@/hooks/useRoommates';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';
import { CategoryManager } from '../categories/CategoryManager';
import { Plus } from 'lucide-react';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paidBy: z.string().min(1, 'Please select who paid'),
  sharers: z.array(z.string()).min(1, 'Please select at least one person to share with'),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

interface AddExpenseFormProps {
  onExpenseAdded: () => void;
}

export const AddExpenseForm = ({ onExpenseAdded }: AddExpenseFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { roommates } = useRoommates();
  const { profile } = useProfile();
  const { toast } = useToast();
  const { categories, addCategory, editCategory, deleteCategory } = useCategories();

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      category: '',
      amount: 0,
      paidBy: '',
      sharers: [],
    },
  });

  // Create list of all possible payers (current user + roommates) with proper deduplication
  const allUsers = React.useMemo(() => {
    const currentUser = {
      id: user?.id || '',
      name: profile?.name || user?.email?.split('@')[0] || 'You',
      email: user?.email || '',
      upi_id: profile?.upi_id || '',
    };

    const roommateUsers = roommates.map(r => ({
      id: r.user_id,
      name: r.name,
      email: r.email,
      upi_id: r.upi_id,
    }));

    // Combine and deduplicate by email
    const combined = [currentUser, ...roommateUsers];
    const uniqueUsers = combined.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    );

    return uniqueUsers;
  }, [user, roommates, profile]);

  const onSubmit = async (data: ExpenseForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          description: data.description,
          category: data.category,
          amount: data.amount,
          paid_by: data.paidBy,
          sharers: data.sharers,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense added successfully!",
      });

      form.reset();
      setIsOpen(false);
      onExpenseAdded();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Expense
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="add-expense" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-expense">Add Expense</TabsTrigger>
            <TabsTrigger value="manage-categories">Manage Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="add-expense" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter expense description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who Paid</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select who paid" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allUsers.map((user) => (
                            <SelectItem key={user.email} value={user.email}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sharers"
                  render={() => (
                    <FormItem>
                      <FormLabel>Split With</FormLabel>
                      <div className="space-y-2">
                        {allUsers.map((user) => (
                          <FormField
                            key={user.email}
                            control={form.control}
                            name="sharers"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={user.email}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(user.email)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, user.email])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== user.email
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {user.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Expense'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="manage-categories">
            <CategoryManager
              categories={categories}
              onCategoryAdd={addCategory}
              onCategoryEdit={editCategory}
              onCategoryDelete={deleteCategory}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
