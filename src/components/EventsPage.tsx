
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
import { EventList } from './events/EventList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";


export const EventsPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { events, isLoading, deleteEvent } = useEvents(currentMonth);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);

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
    
    const handleDeleteRequest = (eventId: string) => {
        setEventToDelete(eventId);
    };

    const handleConfirmDelete = async () => {
        if (eventToDelete) {
            try {
                await deleteEvent(eventToDelete);
                toast.success("Event deleted successfully.");
            } catch (error) {
                console.error("Failed to delete event:", error);
                toast.error("Failed to delete event.");
            } finally {
                setEventToDelete(null);
            }
        }
    };

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

            {!isLoading && 
                <EventList 
                    events={events} 
                    onEdit={handleEventSelect}
                    onDelete={handleDeleteRequest} 
                />
            }

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

            <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the event.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
