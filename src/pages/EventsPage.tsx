
import React from 'react';
import NavBar from '@/components/NavBar';
import { EventsPage as EventsComponent } from '@/components/EventsPage';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <EventsComponent />
      </div>
    </div>
  );
}
