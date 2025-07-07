
import React from 'react';
import NavBar from '@/components/NavBar';
import { RoommateManagement } from '@/components/RoommateManagement';

export default function RoommatesPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <RoommateManagement />
      </div>
    </div>
  );
}
