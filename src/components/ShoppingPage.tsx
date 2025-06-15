
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingListManager } from "./shopping/ShoppingListManager";
import { ProductManager } from "./shopping/ProductManager";
import { Package, ShoppingCart, Users } from "lucide-react";

export const ShoppingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
          <Users className="h-8 w-8 text-blue-600" />
          <span>Shared Shopping Management</span>
        </h1>
        <p className="text-gray-600">Collaborate with your roommates on shopping lists and product management.</p>
      </div>
      
      <Tabs defaultValue="shopping-list" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shopping-list" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Shared Shopping List</span>
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
