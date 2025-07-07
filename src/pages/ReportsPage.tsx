
import React from 'react';
import NavBar from '@/components/NavBar';
import { ReportsPage as ReportsComponent } from '@/components/ReportsPage';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <ReportsComponent />
      </div>
    </div>
  );
}
