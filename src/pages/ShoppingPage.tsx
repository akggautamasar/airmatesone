
import React from 'react';
import NavBar from '@/components/NavBar';
import { ShoppingPage as ShoppingComponent } from '@/components/ShoppingPage';
import { useAuth } from '@/hooks/useAuth';

export default function ShoppingPage() {
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
      <ShoppingComponent />
    </div>
  );
}
