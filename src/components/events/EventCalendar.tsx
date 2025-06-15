
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Event } from '@/types/events';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format, parseISO, isSameDay } from 'date-fns';

interface EventCalendarProps {
  events: Event[];
  month: Date;
  onMonthChange: (date: Date) => void;
  onEventSelect: (event: Event) => void;
  onAddEvent: (date: Date) => void;
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ events, month, onMonthChange, onEventSelect, onAddEvent }) => {
  
  const eventDates = React.useMemo(() => events.map(e => parseISO(e.event_date)), [events]);
  
  const modifiers = {
    withEvent: eventDates,
  };

  const modifiersStyles = {
    withEvent: {
      position: 'relative' as const,
    },
  };
  
  const DayContent = (props: { date: Date }) => {
    const { date } = props;
    const dayEvents = events.filter(e => isSameDay(parseISO(e.event_date), date));
    
    return (
      <div className='relative w-full h-full' onClick={() => onAddEvent(date)}>
        {format(date, 'd')}
        {dayEvents.length > 0 && (
           <Popover>
            <PopoverTrigger asChild>
                <div className='absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 w-full'>
                    {dayEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    ))}
                    {dayEvents.length > 3 && <div className="text-xs -mt-1">+</div>}
                </div>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <h4 className="font-medium">Events for {format(date, 'PPP')}</h4>
                {dayEvents.map((event) => (
                  <div key={event.id} onClick={(e) => {e.stopPropagation(); onEventSelect(event)}} className="p-2 hover:bg-accent rounded-md cursor-pointer">
                    <Badge variant="secondary" className="mb-1">{event.event_type}</Badge>
                    <p className="font-semibold">{event.name}</p>
                    {event.notes && <p className="text-sm text-muted-foreground">{event.notes}</p>}
                    {event.created_by_profile?.name && <p className="text-xs text-muted-foreground">Added by {event.created_by_profile.name}</p>}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };
  
  return (
    <Calendar
      month={month}
      onMonthChange={onMonthChange}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      className="rounded-md border p-0"
      components={{
        DayContent
      }}
      classNames={{
        head_cell: "text-muted-foreground rounded-md w-full",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-16 sm:h-20 lg:h-24 w-full p-2 font-normal rounded-md hover:bg-accent",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: 'bg-accent text-accent-foreground',
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
    />
  );
};
