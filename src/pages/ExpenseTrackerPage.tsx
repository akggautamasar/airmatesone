
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from '@/components/NavBar';
import { ExpensesPage } from '@/components/ExpensesPage';
import { ExpenseTrackerDashboard } from '@/components/expense-tracker/ExpenseTrackerDashboard';
import { RoommateManagement } from '@/components/RoommateManagement';

export default function ExpenseTrackerPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="shared-expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shared-expenses">🏠 Shared Expenses</TabsTrigger>
            <TabsTrigger value="personal-tracker">📊 Personal Tracker</TabsTrigger>
            <TabsTrigger value="roommates">👥 Roommates</TabsTrigger>
          </TabsList>

          <TabsContent value="shared-expenses" className="space-y-6">
            <ExpensesPage />
          </TabsContent>

          <TabsContent value="personal-tracker" className="space-y-6">
            <ExpenseTrackerDashboard />
          </TabsContent>

          <TabsContent value="roommates" className="space-y-6">
            <RoommateManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
