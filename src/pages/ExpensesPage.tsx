
import React from 'react';
import NavBar from '@/components/NavBar';
import { ExpensesPage as ExpensesComponent } from '@/components/ExpensesPage';
import { useAuth } from '@/hooks/useAuth';

export default function ExpensesPage() {
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
      <div className="container mx-auto px-4 py-6 md:py-8">
        <ExpensesComponent />
      </div>
    </div>
  );
}
