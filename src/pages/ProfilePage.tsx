
import React from 'react';
import NavBar from '@/components/NavBar';
import { Profile } from '@/components/Profile';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <Profile />
      </div>
    </div>
  );
}
