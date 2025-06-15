
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';
import { EventCalendar } from './events/EventCalendar';
import { AddEventForm } from './events/AddEventForm';
import { Event } from '@/types/events';
import { PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

export const EventsPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { events, isLoading } = useEvents(currentMonth);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

    const handleEventSelect = (event: Event) => {
        setEventToEdit(event);
        setIsFormOpen(true);
    };

    const handleAddEventClick = () => {
        setEventToEdit(null);
        setIsFormOpen(true);
    };

    const handleAddEventOnDate = (date: Date) => {
        setEventToEdit(null);
        setIsFormOpen(true);
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>Events Calendar</CardTitle>
                        <p className="text-muted-foreground">{format(currentMonth, 'MMMM yyyy')}</p>
                    </div>
                    <Button onClick={handleAddEventClick}><PlusCircle className="mr-2 h-4 w-4" /> Add Event</Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-96">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <EventCalendar 
                            events={events}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            onEventSelect={handleEventSelect}
                            onAddEvent={handleAddEventOnDate}
                        />
                    )}
                </CardContent>
            </Card>

            <AddEventForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                eventToEdit={eventToEdit}
            />
        </div>
    );
};
