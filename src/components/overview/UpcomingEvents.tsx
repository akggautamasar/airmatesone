
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useUpcomingEvents } from '@/hooks/useEvents';
import { Calendar, PartyPopper, Receipt } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const eventIcons: { [key: string]: React.ReactNode } = {
    'Bill Due': <Receipt className="h-5 w-5 text-red-500" />,
    'Birthday': <PartyPopper className="h-5 w-5 text-yellow-500" />,
    'General': <Calendar className="h-5 w-5 text-blue-500" />,
    'LPG Refill': <Receipt className="h-5 w-5 text-orange-500" />,
    "Maid's Off": <Calendar className="h-5 w-5 text-gray-500" />,
    'Festival': <PartyPopper className="h-5 w-5 text-green-500" />,
};

export const UpcomingEvents = () => {
    const { upcomingEvents, isLoading } = useUpcomingEvents(7); // Show events for the next 7 days

    const getDateLabel = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) return "Today";
        if (isTomorrow(date)) return "Tomorrow";
        return format(date, 'EEEE, MMMM d');
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Events (Next 7 Days)</CardTitle>
                    <CardDescription>Loading upcoming events...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <div className="bg-muted rounded-full p-3 animate-pulse h-11 w-11"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Events (Next 7 Days)</CardTitle>
                <CardDescription>A look at what's happening soon.</CardDescription>
            </CardHeader>
            <CardContent>
                {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                        {upcomingEvents.map(event => (
                            <div key={event.id} className="flex items-center space-x-4">
                                <div className="bg-muted rounded-full p-3">
                                    {event.event_type && eventIcons[event.event_type] ? eventIcons[event.event_type] : <Calendar className="h-5 w-5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold">{event.name}</p>
                                    <p className="text-sm text-muted-foreground">{getDateLabel(event.event_date)}</p>
                                    {event.notes && <p className="text-xs text-muted-foreground pt-1">{event.notes}</p>}
                                </div>
                                {event.event_type && <Badge variant="outline">{event.event_type}</Badge>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No upcoming events in the next 7 days. 🎉</p>
                )}
            </CardContent>
        </Card>
    );
};
