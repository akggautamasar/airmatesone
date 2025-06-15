
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEvents } from '@/hooks/useEvents';
import { EventCalendar } from './events/EventCalendar';
import { AddEventForm } from './events/AddEventForm';
import { Event } from '@/types/events';
import { PlusCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { EventTypeManager } from './events/EventTypeManager';

export const EventsPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { events, isLoading } = useEvents(currentMonth);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);

    const handleEventSelect = (event: Event) => {
        setSelectedDate(new Date(event.event_date));
        setEventToEdit(event);
        setIsFormOpen(true);
    };

    const handleAddEventClick = () => {
        setSelectedDate(new Date());
        setEventToEdit(null);
        setIsFormOpen(true);
    };

    const handleAddEventOnDate = (date: Date) => {
        setSelectedDate(date);
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
                    <div className="flex items-center gap-2">
                        <Button onClick={() => setIsTypeManagerOpen(true)} variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                            <span className="sr-only">Manage Event Types</span>
                        </Button>
                        <Button onClick={handleAddEventClick}><PlusCircle className="mr-2 h-4 w-4" /> Add Event</Button>
                    </div>
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
                selectedDate={selectedDate}
            />
            <EventTypeManager 
                isOpen={isTypeManagerOpen}
                onOpenChange={setIsTypeManagerOpen}
            />
        </div>
    );
};
