
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingListManager } from "./shopping/ShoppingListManager";
import { ProductManager } from "./shopping/ProductManager";
import { Package, ShoppingCart } from "lucide-react";

export const ShoppingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Management</h1>
        <p className="text-gray-600">Manage your products and shopping lists collaboratively.</p>
      </div>
      
      <Tabs defaultValue="shopping-list" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shopping-list" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Shopping List</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopping-list">
          <ShoppingListManager />
        </TabsContent>

        <TabsContent value="products">
          <ProductManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
