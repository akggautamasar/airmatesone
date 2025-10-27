
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from '@/components/NavBar';
import { ExpensesPage } from '@/components/ExpensesPage';
import { ExpenseTrackerDashboard } from '@/components/expense-tracker/ExpenseTrackerDashboard';
import { RoommateManagement } from '@/components/RoommateManagement';
import { useAuth } from '@/hooks/useAuth';

export default function ExpenseTrackerPage() {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
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
