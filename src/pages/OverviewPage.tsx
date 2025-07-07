
import React from 'react';
import NavBar from '@/components/NavBar';
import { ExpenseOverview } from '@/components/ExpenseOverview';
import { useAuth } from '@/hooks/useAuth';

export default function OverviewPage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <ExpenseOverview onExpenseUpdate={() => {}} currentUserId={user?.id} />
      </div>
    </div>
  );
}
