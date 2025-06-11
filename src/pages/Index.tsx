
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ShoppingCart, Users, IndianRupee, Bell } from "lucide-react";
import { ExpenseOverview } from "@/components/ExpenseOverview";
import { AddExpense } from "@/components/AddExpense";
import { GroceryList } from "@/components/GroceryList";
import { RoommateManagement } from "@/components/RoommateManagement";
import { SettlementHistory } from "@/components/SettlementHistory";
import { MarketNotification } from "@/components/MarketNotification";

const Index = () => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showMarketNotification, setShowMarketNotification] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-2">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Airmates
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMarketNotification(true)}
                className="hidden sm:flex"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Going to Market
              </Button>
              <Button
                onClick={() => setShowAddExpense(true)}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <IndianRupee className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="grocery" className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Grocery</span>
            </TabsTrigger>
            <TabsTrigger value="settlements" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Settlements</span>
            </TabsTrigger>
            <TabsTrigger value="roommates" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Roommates</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <ExpenseOverview />
          </TabsContent>

          <TabsContent value="grocery" className="space-y-6">
            <GroceryList />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Settlements</CardTitle>
                <CardDescription>
                  Amounts you owe or are owed by roommates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Settlement tracking coming soon!
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roommates" className="space-y-6">
            <RoommateManagement />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <SettlementHistory />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {showAddExpense && (
        <AddExpense onClose={() => setShowAddExpense(false)} />
      )}

      {showMarketNotification && (
        <MarketNotification onClose={() => setShowMarketNotification(false)} />
      )}
    </div>
  );
};

export default Index;
