
import React from 'react';
import NavBar from '@/components/NavBar';
import { ExpensesPage as ExpensesComponent } from '@/components/ExpensesPage';

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <ExpensesComponent />
      </div>
    </div>
  );
}
