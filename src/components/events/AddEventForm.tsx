import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth.tsx';
import { Event } from '@/types/events';
import { useEvents } from '@/hooks/useEvents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  event_date: z.date({ required_error: 'Event date is required' }),
  notes: z.string().optional(),
  event_type: z.string().min(1, 'Event type is required'),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface AddEventFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventToEdit?: Event | null;
}

export const AddEventForm: React.FC<AddEventFormProps> = ({ isOpen, onOpenChange, eventToEdit }) => {
  const { user } = useAuth();
  const { addEvent, updateEvent } = useEvents(eventToEdit ? new Date(eventToEdit.event_date) : new Date());

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: eventToEdit
      ? { ...eventToEdit, event_date: new Date(eventToEdit.event_date) }
      : { name: '', notes: '', event_type: 'General', event_date: new Date() },
  });

  React.useEffect(() => {
    if (isOpen) {
        if (eventToEdit) {
            form.reset({ ...eventToEdit, event_date: new Date(eventToEdit.event_date) });
        } else {
            form.reset({ name: '', notes: '', event_type: 'General', event_date: new Date() });
        }
    }
  }, [eventToEdit, form, isOpen]);

  const onSubmit = async (values: EventFormValues) => {
    if (!user) return;

    try {
      if (eventToEdit) {
        await updateEvent({
          id: eventToEdit.id,
          ...values,
          notes: values.notes || null,
          event_date: format(values.event_date, 'yyyy-MM-dd'),
        });
        toast.success("Event updated successfully.");
      } else {
        await addEvent({
          ...values,
          notes: values.notes || null,
          event_date: format(values.event_date, 'yyyy-MM-dd'),
          created_by: user.id,
        });
        toast.success("Event added successfully.");
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save event:', error);
      toast.error("Failed to save event. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Edit Event' : 'Add New Event'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bill due date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Bill Due">Bill Due</SelectItem>
                      <SelectItem value="Birthday">Birthday</SelectItem>
                      <SelectItem value="LPG Refill">LPG Refill</SelectItem>
                      <SelectItem value="Maid's Off">Maid's Off</SelectItem>
                      <SelectItem value="Festival">Festival Plan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any extra details..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
