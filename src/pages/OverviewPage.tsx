
import React from 'react';
import NavBar from '@/components/NavBar';
import { ExpenseOverview } from '@/components/ExpenseOverview';
import { BrowserNotificationManager } from '@/components/notifications/BrowserNotificationManager';
import { useAuth } from '@/hooks/useAuth';

export default function OverviewPage() {
  const { user, loading } = useAuth();
  
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
        <div className="mb-4">
          <BrowserNotificationManager />
        </div>
        <ExpenseOverview onExpenseUpdate={() => {}} currentUserId={user?.id} />
      </div>
    </div>
  );
}
