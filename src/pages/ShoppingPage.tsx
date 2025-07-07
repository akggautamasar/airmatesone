
import React from 'react';
import NavBar from '@/components/NavBar';
import { ShoppingPage as ShoppingComponent } from '@/components/ShoppingPage';

export default function ShoppingPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <ShoppingComponent />
    </div>
  );
}
