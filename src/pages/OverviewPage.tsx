
import React from 'react';
import NavBar from '@/components/NavBar';
import { ExpenseOverview } from '@/components/ExpenseOverview';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Overview</h1>
          <Link to="/expenses">
            <Button>
              <Receipt className="mr-2 h-4 w-4" />
              Manage Expenses
            </Button>
          </Link>
        </div>
        <ExpenseOverview onExpenseUpdate={() => {}} currentUserId={user?.id} />
      </div>
    </div>
  );
}
