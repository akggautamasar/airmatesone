
import React from 'react';
import NavBar from '@/components/NavBar';
import { ExpenseOverview } from '@/components/ExpenseOverview';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { OneSignalPrompt } from '@/components/notifications/OneSignalPrompt';
import { Receipt } from 'lucide-react';

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
      <OneSignalPrompt />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Overview</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/expenses" className="flex-1 sm:flex-initial">
              <Button className="w-full sm:w-auto">
                <Receipt className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Manage Expenses</span>
                <span className="sm:hidden">Expenses</span>
              </Button>
            </Link>
          </div>
        </div>
        <ExpenseOverview onExpenseUpdate={() => {}} currentUserId={user?.id} />
      </div>
    </div>
  );
}
