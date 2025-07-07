
import React from 'react';
import NavBar from '@/components/NavBar';
import { ChoresPage as ChoresComponent } from '@/components/ChoresPage';

export default function ChoresPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <ChoresComponent />
      </div>
    </div>
  );
}
